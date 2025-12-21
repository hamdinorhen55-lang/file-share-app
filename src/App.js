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
  
  // Step 1: Create the account
  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password
  });
  
  if (signUpError) {
    alert(signUpError.message);
    return;
  }

  // Step 2: Sign in the user immediately (no email confirmation needed)
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (signInError) {
    alert("Account created! Please sign in manually.");
  } else {
    // Clear form
    setEmail('');
    setPassword('');
    // setUser will update automatically via useEffect
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
      maxWidth: '500px', 
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
      justifyContent: 'center'
    }}>
      <h2 style={{ 
        marginBottom: '1.5rem', 
        fontSize: '26px',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        color: '#4ade80'
      }}>
        🔒 SecureFileShare
      </h2>

      {!user ? (
        <div style={{ textAlign: 'left', width: '100%' }}>
          <h3 style={{ marginBottom: '1rem', textAlign: 'center', color: '#ccc' }}>
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h3>
          
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '12px',
              borderRadius: '8px',
              border: '1px solid #333',
              backgroundColor: '#1a1a1a',
              color: '#e0e0e0',
              fontSize: '15px'
            }}
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '16px',
              borderRadius: '8px',
              border: '1px solid #333',
              backgroundColor: '#1a1a1a',
              color: '#e0e0e0',
              fontSize: '15px'
            }}
          />
          
          <button
            onClick={isSignUp ? handleSignUp : handleSignIn}
            style={{
              width: '100%',
              padding: '12px',
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
            {isSignUp ? 'Sign Up' : 'Sign In'}
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
            fontSize: '15px',
            color: '#ccc'
          }}>
            <span>👤</span>
            <span>{user.email}</span>
          </div>
          
          <button 
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              marginBottom: '1.5rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px'
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
              border: '1px solid #333',
              backgroundColor: '#1a1a1a',
              color: '#e0e0e0',
              fontSize: '15px'
            }}
          />
          
          <button 
            onClick={handleUpload} 
            disabled={uploading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: uploading ? '#555' : '#0d6efd',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '16px'
            }}
          >
            {uploading ? 'Uploading...' : 'Upload Secure File'}
          </button>

          {sharedLink && (
            <div style={{ 
              marginTop: '1.5rem', 
              textAlign: 'left',
              backgroundColor: '#151515',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid #333',
              boxShadow: 'inset 0 0 10px rgba(0,0,0,0.4)'
            }}>
              <p style={{ fontWeight: 'bold', color: '#6ee7b7', marginBottom: '8px', fontSize: '15px' }}>
                ✅ Secure Download Link:
              </p>
              <input
                type="text"
                value={sharedLink}
                readOnly
                onClick={(e) => e.target.select()}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #444',
                  backgroundColor: '#222',
                  color: '#4ade80',
                  fontSize: '13px',
                  fontFamily: 'Consolas, monospace'
                }}
              />
              <p style={{ 
                marginTop: '10px', 
                fontSize: '12px', 
                color: '#777'
              }}>
                🔐 Link expires in 1 hour • Only accessible with this URL
              </p>
            </div>
          )}
        </>
      )}

      <footer style={{ 
        marginTop: '2rem', 
        color: '#666', 
        fontSize: '12px',
        borderTop: '1px solid #333',
        paddingTop: '1rem'
      }}>
        © {new Date().getFullYear()} SecureFileShare • End-to-End Encrypted
      </footer>
    </div>
  );
}

export default App;