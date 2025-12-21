import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

function App() {
  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [sharedLink, setSharedLink] = useState('');
  const [uploading, setUploading] = useState(false);
  
  // Auth form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  // Check if user is logged in on component mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Sign up a new user AND sign them in automatically
  const handleSignUp = async () => {
    if (!email || !password) return alert("Please fill all fields!");
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password
    });
    
    if (signUpError) {
      alert(signUpError.message);
      return;
    }

    // Sign in the user immediately
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      alert("Account created! Please sign in manually.");
    } else {
      setEmail('');
      setPassword('');
    }
  };

  // Sign in existing user
  const handleSignIn = async () => {
    if (!email || !password) return alert("Please fill all fields!");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) alert(error.message);
    else {
      setEmail('');
      setPassword('');
    }
  };

  // Sign out current user
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Upload selected file to Supabase Storage
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
      .createSignedUrl(fileName, 3600); // Link expires in 1 hour

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
      maxWidth: '800px', 
      margin: '0 auto', 
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      backgroundColor: '#0f0f0f',
      borderRadius: '16px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
      textAlign: 'center',
      color: '#e0e0e0',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: '2rem'
    }}>
      <h1 style={{ 
        marginBottom: '1rem', 
        fontSize: '32px',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        color: '#4ade80'
      }}>
        🔒 SecureFileShare
      </h1>

      {!user ? (
        <div style={{ 
          width: '100%',
          textAlign: 'left',
          padding: '2rem',
          backgroundColor: '#151515',
          borderRadius: '12px',
          border: '1px solid #333',
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.4)'
        }}>
          <h2 style={{ 
            marginBottom: '1.5rem', 
            fontSize: '24px',
            fontWeight: '600',
            textAlign: 'center',
            color: '#ccc'
          }}>
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '14px',
              marginBottom: '12px',
              borderRadius: '8px',
              border: '1px solid #333',
              backgroundColor: '#1a1a1a',
              color: '#e0e0e0',
              fontSize: '16px'
            }}
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '14px',
              marginBottom: '16px',
              borderRadius: '8px',
              border: '1px solid #333',
              backgroundColor: '#1a1a1a',
              color: '#e0e0e0',
              fontSize: '16px'
            }}
          />
          
          <button
            onClick={isSignUp ? handleSignUp : handleSignIn}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#0d6efd',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '16px',
              marginBottom: '12px'
            }}
          >
            {isSignUp ? 'Sign Up & Login' : 'Sign In'}
          </button>
          
          <p style={{ textAlign: 'center', fontSize: '14px', color: '#aaa' }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setEmail('');
                setPassword('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#4ade80',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '14px'
              }}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      ) : (
        <>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '8px',
            marginBottom: '1.5rem',
            fontSize: '16px',
            color: '#ccc'
          }}>
            <span>👤</span>
            <span>{user.email}</span>
          </div>
          
          <button 
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              marginBottom: '1.5rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '16px'
            }}
          >
            Sign Out
          </button>
          
          <div style={{ 
            width: '100%',
            textAlign: 'left',
            padding: '2rem',
            backgroundColor: '#151515',
            borderRadius: '12px',
            border: '1px solid #333',
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.4)'
          }}>
            <h3 style={{ 
              marginBottom: '1rem', 
              fontSize: '20px',
              fontWeight: '600',
              color: '#ccc'
            }}>
              📤 Upload File
            </h3>
            
            <input 
              type="file" 
              onChange={(e) => setFile(e.target.files[0])}
              style={{
                marginBottom: '1rem',
                padding: '12px',
                width: '100%',
                borderRadius: '8px',
                border: '1px solid #333',
                backgroundColor: '#1a1a1a',
                color: '#e0e0e0',
                fontSize: '16px'
              }}
            />
            
            <button 
              onClick={handleUpload} 
              disabled={uploading}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: uploading ? '#555' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: uploading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '16px'
              }}
            >
              {uploading ? '🔒 Encrypting & Uploading...' : '📤 Upload Secure File'}
            </button>

            {sharedLink && (
              <div style={{ 
                marginTop: '1.5rem', 
                textAlign: 'left',
                backgroundColor: '#1a1a1a',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #444',
                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.4)'
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
          </div>
        </>
      )}

      <footer style={{ 
        marginTop: '2rem', 
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