import { useState } from 'react';
import { supabase } from './supabaseClient';
async function encryptFile(file) {
  // 1. نولد مفتاح تشفير AES-GCM
  const key = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  // 2. نخلق IV عشوائي
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // 3. نشفر الملف
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    await file.arrayBuffer()
  );

  // 4. نرجع الملف المشفر + المفتاح
  return {
    blob: new Blob([iv, new Uint8Array(encrypted)], { type: file.type }),
    key: key // نخزن المفتاح في مكان آمن (مثل: DB أو نعطيه للمستخدم)
  };
}

function App() {
  const [file, setFile] = useState(null);
  const [sharedLink, setSharedLink] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return alert("اختر ملف!");
  
    setUploading(true);
  
    try {
      // 1. نشفّر الملف
      const { blob, key } = await encryptFile(file);
      
      // 2. نرفع الملف المشفر
      const fileName = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, blob); // نرفع الملف المشفر
  
      if (uploadError) {
        alert("خطأ في الرفع!");
        setUploading(false);
        return;
      }
  
      // 3. نولد رابط مؤقت
      const { data, error: urlError } = await supabase.storage
        .from('uploads')
        .createSignedUrl(fileName, 3600);
  
      if (urlError) {
        alert("خطأ في توليد الرابط!");
        setUploading(false);
        return;
      }
  
      // 4. نعرض الرابط + المفتاح (للتشفير)
      setSharedLink(data.signedUrl);
      setUploading(false);
  
      // ⚠️ نحفظ المفتاح في مكان آمن (مثلاً: في قاعدة البيانات أو نعطيه للمستخدم)
      alert("تم التشفير! المفتاح: " + await window.crypto.subtle.exportKey("raw", key));
    } catch (error) {
      alert("خطأ في التشفير!");
      setUploading(false);
    }
  };
  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h2>شارك ملفك الآمن 📁</h2>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? 'يرفع...' : 'ارفع الملف'}
      </button>

      {sharedLink && (
        <div style={{ marginTop: '1rem' }}>
          <p>✅ الرابط المؤقت:</p>
          <input
            type="text"
            value={sharedLink}
            readOnly
            onClick={(e) => e.target.select()}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
      )}
    </div>
  );
}

export default App;