import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

function App() {
  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [sharedLink, setSharedLink] = useState('');
  const [uploading, setUploading] = useState(false);

  // نتحقق من المستخدم عند التحميل
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin, // مهم لـ Vercel
      }
    });
    if (error) alert('خطأ في تسجيل الدخول');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleUpload = async () => {
    if (!user) return alert("يجب تسجيل الدخول أولًا!");
    if (!file) return alert("اختر ملف!");

    setUploading(true);
    const fileName = `${user.id}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(fileName, file);

    if (uploadError) {
      alert("خطأ في الرفع!");
      setUploading(false);
      return;
    }

    const { data, error: urlError } = await supabase.storage
      .from('uploads')
      .createSignedUrl(fileName, 3600);

    if (urlError) {
      alert("خطأ في توليد الرابط!");
      setUploading(false);
      return;
    }

    setSharedLink(data.signedUrl);
    setUploading(false);
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
        </>
      )}
    </div>
  );
}

export default App;