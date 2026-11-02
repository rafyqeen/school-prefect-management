
"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
} from "firebase/firestore";

import { db } from "../../firebase";
import { useAuth } from "../../context/auth-context";

type SystemUser = {
  id: string;
  email: string;
  role: string;
};

export default function UsersPage() {
  const { user, role, loading: authLoading } = useAuth();

  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState("");

  const isStaff =
    !!user &&
    (role === "admin" || role === "assistant_treasurer");

  useEffect(() => {
    if (authLoading || !isStaff) return;

    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const records: SystemUser[] = snapshot.docs.map((item) => {
          const data = item.data();

          return {
            id: item.id,
            email: data.email ?? "Email not recorded",
            role: data.role ?? "Unknown",
          };
        });

        records.sort((a, b) => a.role.localeCompare(b.role));

        setUsers(records);
        setLoadingUsers(false);
        setError("");
      },
      (err) => {
        console.error("Failed to load users:", err);
        setError("Unable to load user records.");
        setLoadingUsers(false);
      }
    );

    return () => unsubscribe();
  }, [authLoading, isStaff]);

  if (authLoading) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        Loading...
      </main>
    );
  }

  if (!isStaff) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-red-600">
            Access Denied
          </h1>
          <p className="mt-2 text-slate-600">
            Sila login sebagai Admin atau Naib Bendahari.
          </p>
          <a
            href="/login"
            className="mt-5 inline-block rounded-lg bg-blue-900 px-5 py-3 text-white"
          >
            Go to Login
          </a>
        </div>
      </main>
    );
  }

  const getRoleLabel = (userRole: string) => {
    switch (userRole) {
      case "admin":
        return "Admin";
      case "assistant_treasurer":
        return "Assistant Treasurer";
      case "prefect":
        return "Prefect";
      default:
        return userRole;
    }
  };

  const getRoleStyle = (userRole: string) => {
    switch (userRole) {
      case "admin":
        return "bg-blue-100 text-blue-800";
      case "assistant_treasurer":
        return "bg-purple-100 text-purple-800";
      case "prefect":
        return "bg-green-100 text-green-800";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

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
            { label: "User Management", href: "/users" },
            { label: "Settings", href: "/settings" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-4 py-3 text-sm font-medium ${
                item.href === "/users"
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="bg-slate-900 px-8 py-6 text-white">
          <h1 className="text-2xl font-bold">
            User Management
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Manage system users and access roles.
          </p>
        </header>

        <main className="p-5 md:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800">
              Registered Users
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Senarai akaun yang mempunyai rekod dalam Firestore.
            </p>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total Users</p>
              <p className="mt-2 text-3xl font-bold text-blue-700">
                {users.length}
              </p>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Administrators</p>
              <p className="mt-2 text-3xl font-bold text-purple-700">
                {users.filter((item) => item.role === "admin").length}
              </p>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Assistant Treasurers
              </p>
              <p className="mt-2 text-3xl font-bold text-green-700">
                {
                  users.filter(
                    (item) => item.role === "assistant_treasurer"
                  ).length
                }
              </p>
            </div>
          </div>

          <section className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <h3 className="font-bold text-slate-800">
                User Accounts
              </h3>
            </div>

            {loadingUsers ? (
              <p className="p-6 text-slate-500">
                Loading user records...
              </p>
            ) : error ? (
              <p className="p-6 text-red-600">{error}</p>
            ) : users.length === 0 ? (
              <p className="p-6 text-slate-500">
                No user records found.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-5 py-4">User ID</th>
                      <th className="px-5 py-4">Email</th>
                      <th className="px-5 py-4">Role</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {users.map((item) => (
                      <tr key={item.id}>
                        <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-slate-500">
                          {item.id}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-800">
                          {item.email}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getRoleStyle(item.role)}`}
                          >
                            {getRoleLabel(item.role)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <p className="mt-5 text-xs text-slate-400">
            User records are loaded directly from Cloud Firestore.
          </p>
        </main>
      </div>
    </div>
  );
}
