
"use client";

import { useState, useEffect, FormEvent } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";
import { useAuth } from "../../context/auth-context";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const { user, role, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user && role) {
      router.replace("/");
    }
  }, [user, role, loading, router]);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setError("E-mel atau kata laluan tidak tepat.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-900 rounded-2xl mx-auto flex items-center justify-center text-white text-2xl font-bold">
            SP
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mt-5">
            School Prefect
          </h1>

          <p className="text-slate-500 mt-2">
            Management System
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Address
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>

        </form>

        <p className="text-center text-xs text-slate-400 mt-8">
          School Prefect Management System
        </p>

      </div>
    </main>
  );
}
