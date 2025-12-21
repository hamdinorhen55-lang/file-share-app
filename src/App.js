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
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      backgroundColor: '#121212',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
      textAlign: 'center',
      transition: 'all 0.3s ease'
    }}>
      <h2 style={{ 
        color: '#ffffff', 
        marginBottom: '1rem', 
        fontSize: '24px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}>
        <span style={{ fontSize: '28px' }}>🔒</span> Secure File Share
      </h2>

      {!user ? (
        <button 
          onClick={handleLogin}
          style={{
            padding: '14px 28px',
            fontSize: '16px',
            backgroundColor: '#4285F4',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 8px rgba(66, 133, 244, 0.3)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#3367D6';
            e.target.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#4285F4';
            e.target.style.transform = 'scale(1)';
          }}
        >
            <span style={{ fontSize: '14px' }}>G</span> Sign in with Google
          </button>
        ) : (
          <>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px',
              marginBottom: '1.5rem',
              color: '#e0e0e0',
              fontSize: '15px'
            }}>
              <span>👤</span>
              <span>{user.email}</span>
            </div>
            
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
                marginBottom: '1.5rem',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
            >
              Sign Out
            </button>
            
            <input 
              type="required" 
              accept="*"
              onChange={(e) => setFile(e.target.files[0])}
              style={{
                marginBottom: '1.5rem',
                padding: '12px',
                width: '100%',
                borderRadius: '10px',
                border: '1px solid #333',
                backgroundColor: '#1e1e1e',
                color: '#e0e0e0',
                fontSize: '15px',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
              }}
            />
            
            <button 
              onClick={handleUpload} 
              disabled={uploading}
              style={{
                padding: '14px 24px',
                fontSize: '16px',
                backgroundColor: uploading ? '#555' : '#0d6efd',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: uploading ? 'not-allowed' : 'pointer',
                width: '100%',
                fontWeight: 'bold',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(13, 110, 253, 0.3)'
              }}
            >
              {uploading ? '🔐 Encrypting & Uploading...' : '📤 Upload Secure File'}
            </button>

            {sharedLink && (
              <div style={{ 
                marginTop: '2rem', 
                textAlign: 'left',
                backgroundColor: '#1a1a1a',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #333',
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  marginBottom: '12px',
                  color: '#6ee7b7',
                  fontWeight: '600'
                }}>
                  <span>✅</span>
                  <span>Secure Download Link</span>
                </div>
                
                <input
                  type="text"
                  value={sharedLink}
                  readOnly
                  onClick={(e) => e.target.select()}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #444',
                    backgroundColor: '#252525',
                    color: '#4ade80',
                    fontSize: '14px',
                    fontFamily: 'Consolas, monospace',
                    marginBottom: '12px',
                    boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.4)'
                  }}
                />
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <a 
                    href={sharedLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#0d6efd',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '8px',
                      textAlign: 'center',
                      fontWeight: '500',
                      fontSize: '14px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#0b5ed7'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#0d6efd'}
                  >
                    🔓 Open Secure Link
                  </a>
                  
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(sharedLink);
                      alert('Link copied to clipboard!');
                    }}
                    style={{
                      padding: '10px',
                      backgroundColor: '#374151',
                      color: 'white',
                      border: '1px solid #4b5563',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: '14px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#4b5563'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#374151'}
                  >
                    📋 Copy
                  </button>
                </div>
                
                <p style={{ 
                  marginTop: '12px', 
                  fontSize: '12px', 
                  color: '#aaa',
                  textAlign: 'center'
                }}>
                  🔐 Link expires in 1 hour • Only accessible to those with the URL
                </p>
              </div>
            )}
          </>
        )}
        
        <footer style={{ 
          marginTop: '2.5rem', 
          color: '#666', 
          fontSize: '13px',
          borderTop: '1px solid #333',
          paddingTop: '1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
            <span>🛡️</span>
            <span>End-to-End Encrypted File Sharing</span>
          </div>
          <div>© {new Date().getFullYear()} SecureFileShare</div>
        </footer>
      </div>
    );
}

export default App;