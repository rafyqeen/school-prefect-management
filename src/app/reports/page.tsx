
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../firebase";

type Prefect = {
  name: string;
  form: number;
};

type Payment = {
  prefectName: string;
  form: number;
  month: string;
  amount: number;
  status: string;
};

type FormReport = {
  form: number;
  prefects: number;
  collected: number;
  outstanding: number;
};

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
];

const money = (amount: number) =>
  `RM ${amount.toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function ReportsPage() {
  const [prefects, setPrefects] = useState<Prefect[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [monthlyFee, setMonthlyFee] = useState(3);
  const [totalMonths, setTotalMonths] = useState(11);

  const [loadingPrefects, setLoadingPrefects] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const [error, setError] = useState("");

  // Load prefect records
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "prefects"),
      (snapshot) => {
        const records: Prefect[] = snapshot.docs.map((item) => {
          const data = item.data();

          return {
            name: data.name ?? "",
            form: Number(data.form ?? 0),
          };
        });

        setPrefects(records);
        setLoadingPrefects(false);
      },
      (err) => {
        console.error("Failed to load prefects:", err);
        setError("Unable to load prefect records.");
        setLoadingPrefects(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Load payment records
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "payments"),
      (snapshot) => {
        const records: Payment[] = snapshot.docs.map((item) => {
          const data = item.data();

          return {
            prefectName: data.prefectName ?? "",
            form: Number(data.form ?? 0),
            month: data.month ?? "",
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

    return () => unsubscribe();
  }, []);

  // Load fee settings from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "settings", "fees"),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();

          setMonthlyFee(Number(data.monthlyFee ?? 3));
          setTotalMonths(
            Number(data.totalMonths ?? 11)
          );
        }

        setLoadingSettings(false);
      },
      (err) => {
        console.error("Failed to load fee settings:", err);
        setError("Unable to load fee settings.");
        setLoadingSettings(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Only count successful payments
  const paidPayments = useMemo(
    () => payments.filter((payment) => payment.status === "Paid"),
    [payments]
  );

  // Calculate overall statistics
  const totalPrefects = prefects.length;

  const totalExpectedFees =
    totalPrefects * monthlyFee * totalMonths;

  const totalCollected = paidPayments.reduce(
    (total, payment) => total + payment.amount,
    0
  );

  const totalOutstanding = Math.max(
    0,
    totalExpectedFees - totalCollected
  );

  // Calculate fully paid prefects
  const fullyPaidPrefects = prefects.filter((prefect) => {
    const paidMonths = new Set(
      paidPayments
        .filter(
          (payment) =>
            payment.prefectName === prefect.name &&
            payment.form === prefect.form
        )
        .map((payment) => payment.month)
    );

    return paidMonths.size >= totalMonths;
  }).length;

  const outstandingPrefects =
    totalPrefects - fullyPaidPrefects;

  // Calculate collection by form
  const reportData: FormReport[] = [2, 3, 4, 5].map((form) => {
    const formPrefects = prefects.filter(
      (prefect) => prefect.form === form
    );

    const collected = paidPayments
      .filter((payment) => payment.form === form)
      .reduce(
        (total, payment) => total + payment.amount,
        0
      );

    const expected =
      formPrefects.length * monthlyFee * totalMonths;

    return {
      form,
      prefects: formPrefects.length,
      collected,
      outstanding: Math.max(0, expected - collected),
    };
  });

  const isLoading =
    loadingPrefects ||
    loadingPayments ||
    loadingSettings;

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 bg-slate-900 text-white md:block">
        <div className="border-b border-slate-700 px-6 py-6">
          <h1 className="text-xl font-bold">
            Prefect Portal
          </h1>

          <p className="mt-1 text-xs text-slate-400">
            ADMINISTRATION SYSTEM
          </p>
        </div>

        <nav className="space-y-2 p-4">
          <a
            href="/"
            className="block rounded-lg px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"
          >
            Dashboard
          </a>

          <a
            href="/prefects"
            className="block rounded-lg px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"
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
            className="block rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
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

      {/* Main Content */}
      <div className="min-w-0 flex-1">
        <header className="bg-[#10213D] px-6 py-6 text-white shadow-md md:px-8">
          <h1 className="text-2xl font-bold">
            Payment Reports
          </h1>

          <p className="mt-1 text-sm text-slate-300">
            School Prefect Management System
          </p>

          <p className="mt-2 text-xs text-slate-300">
            Live data from Firebase Firestore
          </p>
        </header>

        <main className="p-5 md:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">
              Collection Overview
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Real-time summary of prefect monthly fee payments.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="rounded-xl bg-white p-10 text-center text-slate-500 shadow-sm">
              Loading report data from Firestore...
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  {
                    title: "Total Prefects",
                    value: totalPrefects.toString(),
                  },
                  {
                    title: "Total Expected Fees",
                    value: money(totalExpectedFees),
                  },
                  {
                    title: "Total Collection",
                    value: money(totalCollected),
                  },
                  {
                    title: "Outstanding Fees",
                    value: money(totalOutstanding),
                  },
                  {
                    title: "Fully Paid Prefects",
                    value: fullyPaidPrefects.toString(),
                  },
                  {
                    title: "Outstanding Prefects",
                    value: outstandingPrefects.toString(),
                  },
                  {
                    title: "Monthly Fee",
                    value: money(monthlyFee),
                  },
                  {
                    title: "Payment Period",
                    value: `${totalMonths} Months`,
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl bg-white p-6 shadow-sm"
                  >
                    <p className="text-sm text-slate-500">
                      {item.title}
                    </p>

                    <p className="mt-3 text-2xl font-bold text-slate-900">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Collection by Form */}
              <section className="mt-8 rounded-xl bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-lg font-bold text-slate-800">
                    Collection by Form
                  </h2>

                  <p className="text-xs text-slate-500">
                    Fee period: {totalMonths} months
                  </p>
                </div>

                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50 text-slate-600">
                        <th className="p-4">Form</th>
                        <th className="p-4">Prefects</th>
                        <th className="p-4">Collected</th>
                        <th className="p-4">Outstanding</th>
                      </tr>
                    </thead>

                    <tbody>
                      {reportData.map((item) => (
                        <tr
                          key={item.form}
                          className="border-b"
                        >
                          <td className="p-4 font-semibold">
                            Form {item.form}
                          </td>

                          <td className="p-4">
                            {item.prefects}
                          </td>

                          <td className="p-4 font-semibold text-green-700">
                            {money(item.collected)}
                          </td>

                          <td className="p-4 font-semibold text-red-600">
                            {money(item.outstanding)}
                          </td>
                        </tr>
                      ))}
                    </tbody>

                    <tfoot>
                      <tr className="bg-slate-50 font-bold">
                        <td className="p-4">Total</td>
                        <td className="p-4">
                          {totalPrefects}
                        </td>
                        <td className="p-4 text-green-700">
                          {money(totalCollected)}
                        </td>
                        <td className="p-4 text-red-600">
                          {money(totalOutstanding)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>

              {/* Monthly Collection */}
              <section className="mt-8 rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800">
                  Monthly Collection
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Recorded payments for each month.
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {months.slice(
                    0,
                    Math.min(totalMonths, months.length)
                  ).map((month) => {
                    const monthPayments = paidPayments.filter(
                      (payment) => payment.month === month
                    );

                    const amount = monthPayments.reduce(
                      (total, payment) =>
                        total + payment.amount,
                      0
                    );

                    return (
                      <div
                        key={month}
                        className="rounded-lg border border-slate-200 p-4"
                      >
                        <p className="text-sm font-medium text-slate-600">
                          {month}
                        </p>

                        <p className="mt-2 text-xl font-bold text-emerald-700">
                          {money(amount)}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {monthPayments.length} recorded payments
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>

              <p className="mt-5 text-xs text-slate-400">
                Reports update automatically when prefect, payment,
                or fee settings records change in Firestore.
              </p>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
