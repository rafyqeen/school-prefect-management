
"use client";

import { useMemo, useState, useEffect } from "react";
import {
  collection,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../firebase";

type Prefect = {
  id: string;
  name: string;
  form: number;
  className: string;
  outstanding: number;
};

type Payment = {
  prefectName: string;
  amount: number;
  status: string;
};

export default function PrefectsPage() {
  const [prefects, setPrefects] = useState<Prefect[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedForm, setSelectedForm] = useState("All");
  const [search, setSearch] = useState("");
  const [monthlyFee, setMonthlyFee] = useState(3);
  const [totalMonths, setTotalMonths] = useState(11);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribePrefects = onSnapshot(
      collection(db, "prefects"),
      (snapshot) => {
        const records: Prefect[] = snapshot.docs.map((item) => {
          const data = item.data();

          return {
            id: item.id,
            name: data.name ?? "",
            form: Number(data.form ?? 0),
            className: data.className ?? "",
            outstanding: Number(data.outstanding ?? 0),
          };
        });

        records.sort(
          (a, b) => b.form - a.form || a.name.localeCompare(b.name)
        );

        setPrefects(records);
        setLoading(false);
        setError("");
      },
      (err) => {
        console.error("Failed to load prefects:", err);
        setError("Unable to load prefect records.");
        setLoading(false);
      }
    );

    const unsubscribePayments = onSnapshot(
      collection(db, "payments"),
      (snapshot) => {
        const records: Payment[] = snapshot.docs.map((item) => {
          const data = item.data();

          return {
            prefectName: data.prefectName ?? "",
            amount: Number(data.amount ?? 0),
            status: data.status ?? "",
          };
        });

        setPayments(records);
      },
      (err) => {
        console.error("Failed to load payments:", err);
        setError("Unable to load payment records.");
      }
    );

    const unsubscribeSettings = onSnapshot(
      doc(db, "settings", "fees"),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();

          setMonthlyFee(Number(data.monthlyFee ?? 3));
          setTotalMonths(Number(data.totalMonths ?? 11));
        } else {
          setMonthlyFee(3);
          setTotalMonths(11);
        }
      },
      (err) => {
        console.error("Failed to load fee settings:", err);
        setError("Unable to load fee settings.");
      }
    );

    return () => {
      unsubscribePrefects();
      unsubscribePayments();
      unsubscribeSettings();
    };
  }, []);

  const totalFee = monthlyFee * totalMonths;

  const getOutstanding = (prefect: Prefect) => {
    const paidAmount = payments
      .filter(
        (payment) =>
          payment.prefectName === prefect.name &&
          payment.status === "Paid"
      )
      .reduce((total, payment) => total + payment.amount, 0);

    return Math.max(0, totalFee - paidAmount);
  };

  const filteredPrefects = useMemo(() => {
    return prefects.filter((prefect) => {
      const matchesForm =
        selectedForm === "All" ||
        prefect.form.toString() === selectedForm;

      const matchesSearch = prefect.name
        .toLowerCase()
        .includes(search.toLowerCase());

      return matchesForm && matchesSearch;
    });
  }, [prefects, selectedForm, search]);

  const totalOutstanding = prefects.reduce(
    (total, prefect) => total + getOutstanding(prefect),
    0
  );

  const paidCount = prefects.filter(
    (prefect) => getOutstanding(prefect) === 0
  ).length;

  const outstandingCount = prefects.length - paidCount;

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <p className="text-slate-600">Loading prefect records...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <p className="rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </p>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-64 shrink-0 bg-slate-900 p-6 text-white md:block">
        <h1 className="text-xl font-bold">Prefect Portal</h1>
        <p className="mb-8 mt-2 text-xs text-slate-400">
          ADMINISTRATION SYSTEM
        </p>

        <nav className="space-y-2">
          <a
            href="/"
            className="block rounded-lg px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"
          >
            Dashboard
          </a>

          <a
            href="/prefects"
            className="block rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
          >
            Prefect Management
          </a>

          <a
            href="/payments"
            className="block rounded-lg px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"
          >
            Payment Management
          </a>

          <a
            href="/reports"
            className="block rounded-lg px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"
          >
            Payment Reports
          </a>

          <a
            href="/settings"
            className="block rounded-lg px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"
          >
            Settings
          </a>
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="bg-[#10213D] px-6 py-6 text-white shadow-md md:px-8">
          <h1 className="text-2xl font-bold">Prefect Management</h1>
          <p className="mt-1 text-sm text-slate-300">
            School Prefect Directory 2026
          </p>
        </header>

        <main className="p-5 md:p-8">
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total Prefects", value: prefects.length },
              { label: "Fully Paid", value: paidCount },
              { label: "Outstanding", value: outstandingCount },
              {
                label: "Total Outstanding",
                value: `RM ${totalOutstanding.toFixed(2)}`,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-white p-5 shadow-sm"
              >
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[2, 3, 4, 5].map((form) => (
              <div
                key={form}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="text-sm text-slate-500">Form {form}</p>
                <p className="mt-1 text-2xl font-bold text-[#10213D]">
                  {prefects.filter((p) => p.form === form).length}
                </p>
                <p className="text-xs text-slate-400">Prefects</p>
              </div>
            ))}
          </div>

          <section className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  All Prefects
                </h2>
                <p className="text-sm text-slate-500">
                  Showing {filteredPrefects.length} of {prefects.length} prefects
                </p>
              </div>

              <input
                type="text"
                placeholder="Search prefect name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-blue-500 md:w-72"
              />
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              {["All", "2", "3", "4", "5"].map((form) => (
                <button
                  key={form}
                  onClick={() => setSelectedForm(form)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    selectedForm === form
                      ? "bg-[#10213D] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {form === "All" ? "All Forms" : `Form ${form}`}
                </button>
              ))}
            </div>

            <div className="mb-4 text-xs text-slate-500">
              Monthly fee: RM {monthlyFee.toFixed(2)} · Total months:{" "}
              {totalMonths} · Total fee per prefect: RM {totalFee.toFixed(2)}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="px-4 py-3">No.</th>
                    <th className="px-4 py-3">Prefect Name</th>
                    <th className="px-4 py-3">Form</th>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3">Total Fee</th>
                    <th className="px-4 py-3">Outstanding</th>
                    <th className="px-4 py-3">Payment Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredPrefects.map((prefect, index) => {
                    const outstanding = getOutstanding(prefect);

                    return (
                      <tr key={prefect.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-500">
                          {index + 1}
                        </td>

                        <td className="px-4 py-3 font-medium text-slate-800">
                          {prefect.name}
                        </td>

                        <td className="px-4 py-3">Form {prefect.form}</td>
                        <td className="px-4 py-3">{prefect.className}</td>

                        <td className="px-4 py-3">
                          RM {totalFee.toFixed(2)}
                        </td>

                        <td className="px-4 py-3 font-medium">
                          RM {outstanding.toFixed(2)}
                        </td>

                        <td className="px-4 py-3">
                          {outstanding === 0 ? (
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                              Paid
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                              Outstanding
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredPrefects.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        No prefects found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
