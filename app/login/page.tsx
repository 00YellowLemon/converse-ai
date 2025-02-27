import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAuth, GoogleAuthProvider, signInWithPopup, Auth, User } from 'firebase/auth';
import { app } from '@/lib/firebase';

export default function LoginPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const auth: Auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user: User | null) => {
      if (user) {
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [auth, router]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-8">Login</h1>
      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow flex items-center disabled:opacity-50"
      >
        <img src="/google.svg" alt="Google Logo" className="w-6 h-6 mr-2" />
        Continue with Google
      </button>
      {loading && <p className="mt-4">Loading...</p>}
      {error && <p className="mt-4 text-red-500">Error: {error}</p>}
    </div>
  );
}
