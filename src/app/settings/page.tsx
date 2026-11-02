
"use client";

import { useEffect, useState } from "react";
import {
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../firebase";
import { useAuth } from "../../context/auth-context";

export default function SettingsPage() {
  const { user, role, loading: authLoading } = useAuth();

  const [monthlyFee, setMonthlyFee] = useState("3");
  const [totalMonths, setTotalMonths] = useState("11");
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const isStaff =
    !!user &&
    (role === "admin" || role === "assistant_treasurer");

  const totalFee =
    (Number(monthlyFee) || 0) * (Number(totalMonths) || 0);

  useEffect(() => {
    const settingsRef = doc(db, "settings", "fees");

    const unsubscribe = onSnapshot(
      settingsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();

          setMonthlyFee(String(data.monthlyFee ?? 3));
          setTotalMonths(String(data.totalMonths ?? 11));
        }

        setLoadingSettings(false);
        setError("");
      },
      (err) => {
        console.error("Failed to load fee settings:", err);
        setError("Unable to load fee settings.");
        setLoadingSettings(false);
      }
    );

    return () => unsubscribe();
  }, []);

  async function saveSettings() {
    if (!isStaff) {
      setError("Only Admin and Assistant Treasurer can change settings.");
      return;
    }

    const fee = Number(monthlyFee);
    const months = Number(totalMonths);

    if (
      !Number.isFinite(fee) ||
      !Number.isFinite(months) ||
      monthlyFee.trim() === "" ||
      totalMonths.trim() === "" ||
      fee < 0 ||
      months < 1 ||
      !Number.isInteger(months)
    ) {
      setError("Please enter a valid fee and number of months.");
      return;
    }

    setSaving(true);
    setSaved(false);
    setError("");

    try {
      await setDoc(
        doc(db, "settings", "fees"),
        {
          monthlyFee: fee,
          totalMonths: months,
          updatedAt: serverTimestamp(),
          updatedBy: user?.uid ?? null,
        },
        { merge: true }
      );

      setSaved(true);
    } catch (err) {
      console.error("Failed to save fee settings:", err);
      setError("Failed to save settings. Please check your login and Firestore rules.");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loadingSettings) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <p className="text-slate-600">Loading settings...</p>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-64 shrink-0 bg-slate-900 text-white md:block">
        <div className="border-b border-slate-700 px-6 py-6">
          <h1 className="text-xl font-bold">Prefect System</h1>
          <p className="mt-1 text-xs text-slate-400">
            Management Portal
          </p>
        </div>

        <nav className="space-y-2 p-4">
          {[
            { label: "Dashboard", href: "/" },
            { label: "Prefect Management", href: "/prefects" },
            { label: "Payment Management", href: "/payments" },
            { label: "Payment Reports", href: "/reports" },
            { label: "Settings", href: "/settings" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-4 py-3 text-sm font-medium transition ${
                item.href === "/settings"
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="bg-slate-900 px-8 py-6 text-white">
          <h1 className="text-2xl font-bold">System Settings</h1>
          <p className="mt-1 text-sm text-slate-300">
            School Prefect Management System
          </p>
        </header>

        <main className="p-5 md:p-8">
          <h2 className="text-xl font-bold text-slate-800">
            Fee Configuration
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Configure the prefect monthly and annual fees.
          </p>

          <section className="mt-6 max-w-2xl rounded-xl bg-white p-6 shadow-sm">
            {!isStaff && (
              <p className="mb-5 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
                View-only access. Login as Admin or Assistant Treasurer to change settings.
              </p>
            )}

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Monthly Fee (RM)
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={monthlyFee}
                disabled={!isStaff}
                onChange={(e) => {
                  setMonthlyFee(e.target.value);
                  setSaved(false);
                  setError("");
                }}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 disabled:bg-slate-100"
              />
            </div>

            <div className="mt-6">
              <label className="text-sm font-semibold text-slate-700">
                Number of Collection Months
              </label>

              <input
                type="number"
                min="1"
                step="1"
                value={totalMonths}
                disabled={!isStaff}
                onChange={(e) => {
                  setTotalMonths(e.target.value);
                  setSaved(false);
                  setError("");
                }}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 disabled:bg-slate-100"
              />
            </div>

            <div className="mt-6 rounded-lg bg-blue-50 p-5">
              <p className="text-sm text-blue-700">
                Total Annual Fee per Prefect
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-900">
                RM {totalFee.toFixed(2)}
              </p>

              <p className="mt-1 text-xs text-blue-600">
                Monthly fee × collection months
              </p>
            </div>

            {isStaff && (
              <button
                onClick={saveSettings}
                disabled={saving}
                className="mt-6 w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
            )}

            {saved && (
              <p className="mt-4 text-center text-sm font-medium text-green-700">
                Settings saved successfully!
              </p>
            )}

            {error && (
              <p className="mt-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-700">
                {error}
              </p>
            )}
          </section>

          <p className="mt-5 text-xs text-slate-500">
            Fee settings are stored in the shared Firestore database.
          </p>
        </main>
      </div>
    </div>
  );
}
