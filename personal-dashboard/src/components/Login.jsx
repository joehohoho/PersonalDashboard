import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useEffect } from 'react';
import '../styles/Login.css';

const Login = () => {
  const navigate = useNavigate();
  const ALLOWED_EMAIL = import.meta.env.VITE_ALLOWED_EMAIL;

  useEffect(() => {
    // Debug log to verify environment variable
    console.log('Login Component - Allowed Email:', ALLOWED_EMAIL);

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Debug log for comparison
        console.log('Login Check - Comparing emails:', {
          userEmail: user.email,
          allowedEmail: ALLOWED_EMAIL,
          matches: user.email === ALLOWED_EMAIL
        });
        
        if (user.email === ALLOWED_EMAIL) {
          console.log('Login: Authorized user detected, redirecting to dashboard');
          navigate('/');
        } else {
          console.log('Unauthorized email, signing out...');
          await supabase.auth.signOut();
          alert(`Unauthorized access. Please use ${ALLOWED_EMAIL} to login.`);
        }
      }
    };

    checkUser();
  }, [navigate, ALLOWED_EMAIL]);

  const handleGoogleLogin = async () => {
    try {
      await supabase.auth.signOut(); // Clear any existing session
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account', // Force account selection
          },
          redirectTo: `${window.location.origin}/login`
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging in with Google:', error.message);
      alert(`Login error: ${error.message}. This might be a temporary Supabase OAuth issue. Please try again in a few minutes.`);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    
    console.log('Attempting email login with:', email);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      console.log('Email login successful:', data);
      
      // Check if the logged-in user is authorized
      if (data.user && data.user.email === ALLOWED_EMAIL) {
        console.log('Authorized user logged in, redirecting...');
        navigate('/');
      } else {
        console.log('Unauthorized user logged in, signing out...');
        await supabase.auth.signOut();
        alert(`Unauthorized access. Please use ${ALLOWED_EMAIL} to login.`);
      }
    } catch (error) {
      console.error('Error logging in with email:', error.message);
      alert(`Login error: ${error.message}`);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Welcome</h1>
        <p>Please sign in to continue</p>
        
        {/* Google OAuth Login */}
        <button onClick={handleGoogleLogin} className="google-login-btn">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
          </svg>
          Sign in with Google
        </button>
        
        <div style={{ margin: '20px 0', textAlign: 'center', color: '#666' }}>
          OR
        </div>
        
        {/* Email/Password Login Fallback */}
        <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input 
            type="email" 
            name="email" 
            placeholder="Email" 
            required 
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
          <input 
            type="password" 
            name="password" 
            placeholder="Password" 
            required 
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
          <button type="submit" style={{ 
            padding: '10px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            Sign in with Email
          </button>
        </form>
        
        <div style={{ marginTop: '20px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
          Note: If Google login fails, this might be a temporary Supabase OAuth issue.
        </div>
      </div>
    </div>
  );
};

export default Login;