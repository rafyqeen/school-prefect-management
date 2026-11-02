
"use client";

import { useState } from "react";
import { useAuth } from "../../context/auth-context";
import { importPrefects } from "../../import-prefects";

export default function ImportPrefectsPage() {
  const { user, role, loading } = useAuth();

  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isStaff =
    !!user && (role === "admin" || role === "assistant_treasurer");

  async function handleImport() {
    if (!isStaff) return;

    const confirmed = window.confirm(
      "Import semua 66 pengawas ke Firestore sekarang?"
    );

    if (!confirmed) return;

    setImporting(true);
    setMessage("");
    setError("");

    try {
      const count = await importPrefects();
      setMessage(`Berjaya! ${count} pengawas telah diimport ke Firestore.`);
    } catch (err) {
      console.error("Import failed:", err);
      setError(
        "Import gagal. Sila semak login dan Firestore Security Rules."
      );
    } finally {
      setImporting(false);
    }
  }

  if (loading) {
    return <main className="p-8">Loading...</main>;
  }

  if (!isStaff) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <p className="text-red-600 font-semibold">
          Akses ditolak. Sila login sebagai Admin atau Naib Bendahari.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Import Prefect Records
        </h1>

        <p className="text-slate-600 mt-3">
          Halaman ini akan memasukkan semua 66 rekod pengawas ke dalam
          Firestore.
        </p>

        <button
          onClick={handleImport}
          disabled={importing}
          className="mt-6 w-full bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold py-3 rounded-lg"
        >
          {importing ? "Importing..." : "Import 66 Prefects"}
        </button>

        {message && (
          <p className="mt-5 bg-green-50 text-green-700 p-4 rounded-lg">
            {message}
          </p>
        )}

        {error && (
          <p className="mt-5 bg-red-50 text-red-700 p-4 rounded-lg">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
