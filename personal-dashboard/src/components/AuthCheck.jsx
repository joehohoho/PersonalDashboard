import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const AuthCheck = ({ children }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const ALLOWED_EMAIL = import.meta.env.VITE_ALLOWED_EMAIL;

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || user.email !== ALLOWED_EMAIL) {
        console.log('AuthCheck: Unauthorized access detected');
        await supabase.auth.signOut();
        navigate('/login');
        window.location.reload(); // Force reload after signout
      }
      setLoading(false);
    };

    // Initial check
    checkAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        const user = session?.user;
        if (user && user.email !== ALLOWED_EMAIL) {
          console.log('AuthCheck: Unauthorized user signed in');
          await supabase.auth.signOut();
          navigate('/login');
          window.location.reload();
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, ALLOWED_EMAIL]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return children;
};

export default AuthCheck; 