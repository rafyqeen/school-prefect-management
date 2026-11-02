
"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
} from "firebase/firestore";

import { db } from "../firebase";

const menuItems = [
  { label: "Dashboard", href: "/" },
  { label: "Prefect Management", href: "/prefects" },
  { label: "Payment Management", href: "/payments" },
  { label: "Payment Reports", href: "/reports" },
  { label: "Settings", href: "/settings" },
];

type Prefect = {
  id: string;
  name: string;
};

type Payment = {
  prefectName: string;
  amount: number;
  status: string;
};

const money = (amount: number) =>
  `RM ${amount.toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function Dashboard() {
  const [prefects, setPrefects] = useState<Prefect[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [monthlyFee, setMonthlyFee] = useState(3);
  const [totalMonths, setTotalMonths] = useState(11);

  const [loadingPrefects, setLoadingPrefects] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribePrefects = onSnapshot(
      collection(db, "prefects"),
      (snapshot) => {
        const records: Prefect[] = snapshot.docs.map((item) => ({
          id: item.id,
          name: item.data().name ?? "",
        }));

        setPrefects(records);
        setLoadingPrefects(false);
      },
      (err) => {
        console.error("Failed to load prefects:", err);
        setError("Unable to load prefect records.");
        setLoadingPrefects(false);
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
        setLoadingPayments(false);
      },
      (err) => {
        console.error("Failed to load payments:", err);
        setError("Unable to load payment records.");
        setLoadingPayments(false);
      }
    );

    const unsubscribeSettings = onSnapshot(
      doc(db, "settings", "fees"),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();

          setMonthlyFee(Number(data.monthlyFee ?? 3));
          setTotalMonths(Number(data.totalMonths ?? 11));
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

  const loading = loadingPrefects || loadingPayments;

  const feePerPrefect = monthlyFee * totalMonths;

  const getPaidAmount = (prefect: Prefect) => {
    return payments
      .filter(
        (payment) =>
          payment.prefectName === prefect.name &&
          payment.status === "Paid"
      )
      .reduce((total, payment) => total + payment.amount, 0);
  };

  const getOutstanding = (prefect: Prefect) => {
    return Math.max(0, feePerPrefect - getPaidAmount(prefect));
  };

  const totalPrefects = prefects.length;

  const totalOutstanding = prefects.reduce(
    (total, prefect) => total + getOutstanding(prefect),
    0
  );

  const fullyPaidPrefects = prefects.filter(
    (prefect) => getOutstanding(prefect) === 0
  ).length;

  const outstandingPrefects = totalPrefects - fullyPaidPrefects;

  const totalCollected = payments
    .filter((payment) => payment.status === "Paid")
    .reduce((total, payment) => total + payment.amount, 0);

  const totalExpectedFees = totalPrefects * feePerPrefect;

  const statistics = [
    {
      title: "Total Prefects",
      value: totalPrefects.toString(),
      description: "Registered prefects",
      color: "text-blue-600",
    },
    {
      title: "Outstanding",
      value: outstandingPrefects.toString(),
      description: "Prefects with unpaid fees",
      color: "text-orange-600",
    },
    {
      title: "Fully Paid",
      value: fullyPaidPrefects.toString(),
      description: "Prefects completed payment",
      color: "text-green-600",
    },
    {
      title: "Outstanding Fees",
      value: money(totalOutstanding),
      description: "Total unpaid collection",
      color: "text-red-600",
    },
    {
      title: "Total Expected Fees",
      value: money(totalExpectedFees),
      description: "Based on current fee settings",
      color: "text-blue-700",
    },
    {
      title: "Monthly Fee",
      value: money(monthlyFee),
      description: `${totalMonths} months per prefect`,
      color: "text-purple-600",
    },
    {
      title: "Total Collected",
      value: money(totalCollected),
      description: "Actual recorded payments",
      color: "text-emerald-600",
    },
  ];

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <p className="text-slate-600">Loading dashboard data...</p>
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
      <aside className="hidden w-64 shrink-0 bg-slate-900 text-white md:block">
        <div className="border-b border-slate-700 px-6 py-6">
          <h1 className="text-xl font-bold">Prefect System</h1>
          <p className="mt-1 text-xs text-slate-400">
            Management Portal
          </p>
        </div>

        <nav className="space-y-2 p-4">
          {menuItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-4 py-3 text-sm font-medium transition ${
                item.href === "/"
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
          <h1 className="text-2xl font-bold">
            School Prefect Management System
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Prefect Administration Portal
          </p>
        </header>

        <main className="p-5 md:p-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Dashboard
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Welcome to the School Prefect Management System.
              Manage prefect records and monitor fee collections here.
            </p>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {statistics.map((item) => (
              <div
                key={item.title}
                className="rounded-xl bg-white p-6 shadow-sm"
              >
                <p className="text-sm font-medium text-slate-500">
                  {item.title}
                </p>

                <p className={`mt-3 text-3xl font-bold ${item.color}`}>
                  {item.value}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <section className="mt-8 rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800">
              Quick Access
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Select a section to manage the prefect system.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {menuItems.slice(1).map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-lg border border-slate-200 p-5 transition hover:border-blue-500 hover:bg-blue-50"
                >
                  <h3 className="font-semibold text-slate-800">
                    {item.label}
                  </h3>
                  <p className="mt-2 text-xs text-slate-500">
                    Open {item.label}
                  </p>
                </a>
              ))}
            </div>
          </section>

          <p className="mt-6 text-xs text-slate-400">
            Dashboard statistics are updated automatically from Firestore.
          </p>
        </main>
      </div>
    </div>
  );
}
