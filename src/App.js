import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// دالة تشفير الملف
async function encryptFile(file) {
  const key = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    await file.arrayBuffer()
  );
  const blob = new Blob([iv, new Uint8Array(encrypted)], { type: 'application/octet-stream' });
  const exported = await window.crypto.subtle.exportKey("raw", key);
  const keyB64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
  return { blob, key: keyB64, originalName: file.name, originalType: file.type };
}

// دالة فك التشفير
async function decryptFile(encryptedArrayBuffer, keyB64, originalType) {
  const keyBuffer = Uint8Array.from(atob(keyB64), c => c.charCodeAt(0));
  const key = await window.crypto.subtle.importKey(
    "raw", keyBuffer, { name: "AES-GCM" }, false, ["decrypt"]
  );
  const iv = encryptedArrayBuffer.slice(0, 12);
  const encryptedData = encryptedArrayBuffer.slice(12);
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv }, key, encryptedData
  );
  return new Blob([decrypted], { type: originalType });
}

function App() {
  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [sharedLink, setSharedLink] = useState('');
  const [uploading, setUploading] = useState(false);
  const [decrypting, setDecrypting] = useState(false);
  const [decryptedUrl, setDecryptedUrl] = useState('');

  // تحقق من المستخدم
  useEffect(() => {
    const getUser = async () => {
      const {  { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // تسجيل الدخول
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) alert('خطأ في تسجيل الدخول');
  };

  // تسجيل الخروج
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSharedLink('');
    setDecryptedUrl('');
  };

  // رفع الملف المشفر
  const handleUpload = async () => {
    if (!user) return alert("يجب تسجيل الدخول أولًا!");
    if (!file) return alert("اختر ملف!");

    setUploading(true);
    try {
      // 1. نشفّر الملف
      const { blob, key, originalName, originalType } = await encryptFile(file);
      const fileName = `${user.id}/${Date.now()}-${originalName}.encrypted`;

      // 2. نرفع الملف المشفر
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, blob);
      if (uploadError) throw uploadError;

      // 3. نخزن المفتاح في قاعدة البيانات
      const { error: dbError } = await supabase
        .from('file_keys')
        .insert({
          file_path: fileName,
          decryption_key: key,
          user_id: user.id,
          original_name: originalName,
          original_type: originalType
        });
      if (dbError) throw dbError;

      // 4. نولد رابط مؤقت
      const { data, error: urlError } = await supabase.storage
        .from('uploads')
        .createSignedUrl(fileName, 3600);
      if (urlError) throw urlError;

      setSharedLink(data.signedUrl);
    } catch (error) {
      console.error(error);
      alert("خطأ في الرفع أو التشفير!");
    } finally {
      setUploading(false);
    }
  };

  // فك التشفير
  const handleDecrypt = async () => {
    if (!sharedLink) return alert("لا يوجد ملف لفك التشفير!");

    setDecrypting(true);
    try {
      // 1. نحمل الملف المشفر
      const response = await fetch(sharedLink);
      const arrayBuffer = await response.arrayBuffer();

      // 2. نسترجع المفتاح من قاعدة البيانات
      const filePath = new URL(sharedLink).pathname.split('/').slice(-1)[0];
      const { data, error } = await supabase
        .from('file_keys')
        .select('decryption_key, original_type')
        .eq('file_path', filePath)
        .single();
      if (error || !data) throw new Error("مفتاح فك التشفير غير موجود!");

      // 3. نفك التشفير
      const decryptedBlob = await decryptFile(
        arrayBuffer,
        data.decryption_key,
        data.original_type
      );

      // 4. نخلق رابط للعرض
      const url = URL.createObjectURL(decryptedBlob);
      setDecryptedUrl(url);
    } catch (error) {
      console.error(error);
      alert("خطأ في فك التشفير!");
    } finally {
      setDecrypting(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h2>شارك ملفك الآمن 📁</h2>

      {!user ? (
        <button onClick={handleLogin}>تسجيل الدخول بجوجل</button>
      ) : (
        <>
          <p>مرحباً، {user.email}!</p>
          <button onClick={handleLogout} style={{ marginBottom: '1rem' }}>تسجيل خروج</button>
          
          <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          <button onClick={handleUpload} disabled={uploading}>
            {uploading ? 'يشفّر ويرفع...' : 'ارفع الملف (مشفر)'}
          </button>

          {sharedLink && (
            <div style={{ marginTop: '1rem' }}>
              <p>✅ الرابط المؤقت (مشفر):</p>
              <input
                type="text"
                value={sharedLink}
                readOnly
                onClick={(e) => e.target.select()}
                style={{ width: '100%', padding: '8px', marginBottom: '0.5rem' }}
              />
              <button onClick={handleDecrypt} disabled={decrypting}>
                {decrypting ? 'يقوم بفك التشفير...' : 'فك التشفير واعرض الملف'}
              </button>

              {decryptedUrl && (
                <div style={{ marginTop: '1rem' }}>
                  <p>🔓 الملف بعد فك التشفير:</p>
                  {decryptedUrl.endsWith('.pdf') ? (
                    <embed src={decryptedUrl} type="application/pdf" width="100%" height="500px" />
                  ) : decryptedUrl.startsWith('data:image') ? (
                    <img src={decryptedUrl} alt="Decrypted" style={{ maxWidth: '100%' }} />
                  ) : (
                    <a href={decryptedUrl} download="decrypted-file">⬇️ نزّل الملف</a>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;