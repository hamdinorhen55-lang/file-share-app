import { useState } from 'react';
import { supabase } from './supabaseClient';

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
    const fileName = `${Date.now()}-${file.name}`;
  
    // 1. نرفع الملف
    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(fileName, file);
  
    if (uploadError) {
      alert("خطأ في الرفع!");
      setUploading(false);
      return;
    }
  
    // 2. نولد رابط مؤقت
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