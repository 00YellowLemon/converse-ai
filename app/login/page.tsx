"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { firebaseApp } from "@/lib/firebase";

export default function LoginPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const auth = getAuth(firebaseApp);

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      router.push("/home");
    } catch (err: any) {
      console.error("Sign-in error:", err.code, err.message);
      if (err.code === "auth/popup-closed-by-user") {
        setError("Sign-in window closed too soon. Please try again.");
      } else {
        setError(err.message);
      }
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
      {error && <p className="mt-4 text-red-500">{error}</p>}
    </div>
  );
}