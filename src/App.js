import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

function App() {
  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [sharedLink, setSharedLink] = useState('');
  const [uploading, setUploading] = useState(false);

  // Check user on load
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
        redirectTo: window.location.origin,
      }
    });
    if (error) alert('Login failed');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleUpload = async () => {
    if (!user) return alert("Please sign in first!");
    if (!file) return alert("Please select a file!");

    setUploading(true);
    const fileName = `${user.id}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(fileName, file);

    if (uploadError) {
      alert("Upload failed!");
      setUploading(false);
      return;
    }

    const { data, error: urlError } = await supabase.storage
      .from('uploads')
      .createSignedUrl(fileName, 3600);

    if (urlError) {
      alert("Failed to generate link!");
      setUploading(false);
      return;
    }

    setSharedLink(data.signedUrl);
    setUploading(false);
  };

  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '600px', 
      margin: '0 auto', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f8f9fa',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      textAlign: 'center'
    }}>
      <h2 style={{ color: '#333', marginBottom: '1rem' }}>🔒 Secure File Share</h2>

      {!user ? (
        <button 
          onClick={handleLogin}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#4285F4',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#3367D6'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#4285F4'}
        >
          Sign in with Google
        </button>
      ) : (
        <>
          <p style={{ color: '#555', marginBottom: '0.5rem' }}>Hello, {user.email}!</p>
          <button 
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              marginBottom: '1rem'
            }}
          >
            Sign Out
          </button>
          
          <input 
            type="file" 
            onChange={(e) => setFile(e.target.files[0])}
            style={{
              marginBottom: '1rem',
              padding: '10px',
              width: '100%',
              borderRadius: '8px',
              border: '1px solid #ddd'
            }}
          />
          <button 
            onClick={handleUpload} 
            disabled={uploading}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: uploading ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              width: '100%',
              fontWeight: 'bold'
            }}
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>

          {sharedLink && (
            <div style={{ marginTop: '1.5rem', textAlign: 'left' }}>
              <p style={{ fontWeight: 'bold', color: '#333' }}>✅ Secure Download Link:</p>
              <input
                type="text"
                value={sharedLink}
                readOnly
                onClick={(e) => e.target.select()}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                  marginBottom: '0.5rem'
                }}
              />
              <a 
                href={sharedLink} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  marginTop: '0.5rem',
                  padding: '8px 16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                Open in New Tab
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;