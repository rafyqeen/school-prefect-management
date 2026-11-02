
"use client";

import { useMemo, useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  doc,
  writeBatch,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/auth-context";

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

type Prefect = {
  name: string;
  form: number;
  className: string;
};

type PaymentRecord = {
  prefectName: string;
  form: number;
  amount: number;
  status: string;
  month: string;
};

const money = (amount: number) =>
  `RM ${amount.toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function PaymentsPage() {
  const [search, setSearch] = useState("");
  const [selectedForm, setSelectedForm] = useState("All");
  const [selectedMonth, setSelectedMonth] = useState("January");

  const [prefects, setPrefects] = useState<Prefect[]>([]);
  const [payments, setPayments] = useState<Record<string, PaymentRecord>>({});

  const [monthlyFee, setMonthlyFee] = useState(3);
  const [totalMonths, setTotalMonths] = useState(11);

  const [loadingPrefects, setLoadingPrefects] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const [savingPayment, setSavingPayment] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");

  const { user, role } = useAuth();

  const isStaff =
    !!user &&
    (role === "admin" || role === "assistant_treasurer");

  useEffect(() => {
    const unsubscribe = onSnapshot(
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

        setLoadingSettings(false);
      },
      (error) => {
        console.error("Failed to load fee settings:", error);
        setPaymentError("Unable to load fee settings.");
        setLoadingSettings(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "prefects"),
      (snapshot) => {
        const records: Prefect[] = [];

        snapshot.forEach((prefectDoc) => {
          const data = prefectDoc.data();

          records.push({
            name: data.name ?? "",
            form: Number(data.form ?? 0),
            className: data.className ?? "",
          });
        });

        records.sort((a, b) => {
          if (a.form !== b.form) return b.form - a.form;
          return a.name.localeCompare(b.name);
        });

        setPrefects(records);
        setLoadingPrefects(false);
      },
      (error) => {
        console.error("Failed to load prefects:", error);
        setPaymentError("Unable to load prefect records from Firestore.");
        setLoadingPrefects(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "payments"),
      (snapshot) => {
        const records: Record<string, PaymentRecord> = {};

        snapshot.forEach((paymentDoc) => {
          const data = paymentDoc.data();

          records[paymentDoc.id] = {
            prefectName: data.prefectName ?? "",
            form: Number(data.form ?? 0),
            amount: Number(data.amount ?? 0),
            status: data.status ?? "",
            month: data.month ?? "",
          };
        });

        setPayments(records);
        setLoadingPayments(false);
      },
      (error) => {
        console.error("Failed to load payments:", error);
        setPaymentError("Unable to load payment records. Please refresh.");
        setLoadingPayments(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const availableMonths = months.slice(
    0,
    Math.min(Math.max(totalMonths, 0), months.length)
  );

  useEffect(() => {
    if (
      availableMonths.length > 0 &&
      !availableMonths.includes(selectedMonth)
    ) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [totalMonths, selectedMonth]);

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
  }, [prefects, search, selectedForm]);

  function getPaymentId(name: string, form: number, month: string) {
    const safeName = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");

    return `${form}_${safeName}_${month.toLowerCase()}`;
  }

  function getPrefectPayments(prefect: Prefect) {
    return Object.entries(payments).filter(
      ([, payment]) =>
        payment.prefectName === prefect.name &&
        payment.form === prefect.form &&
        payment.status === "Paid"
    );
  }

  function getPaidAmount(prefect: Prefect) {
    return getPrefectPayments(prefect).reduce(
      (total, [, payment]) => total + payment.amount,
      0
    );
  }

  function isMonthPaid(prefect: Prefect, month: string) {
    const totalFee = monthlyFee * availableMonths.length;
    const paidAmount = getPaidAmount(prefect);

    if (totalFee > 0 && paidAmount >= totalFee) {
      return true;
    }

    const paymentId = getPaymentId(prefect.name, prefect.form, month);
    return payments[paymentId]?.status === "Paid";
  }

  async function togglePayment(prefect: Prefect) {
    if (!isStaff || !user) return;

    const paymentId = getPaymentId(
      prefect.name,
      prefect.form,
      selectedMonth
    );

    const isPaid = isMonthPaid(prefect, selectedMonth);

    setSavingPayment(paymentId);
    setPaymentError("");
    setPaymentMessage("");

    try {
      if (isPaid) {
        // Delete only the selected month's payment.
        // Other paid months remain unchanged.
        const existingPayment = payments[paymentId];

        if (!existingPayment || existingPayment.status !== "Paid") {
          setPaymentError(
            "The payment record for this month could not be found. Please refresh."
          );
          return;
        }

        await deleteDoc(doc(db, "payments", paymentId));

        setPaymentMessage(
          `${prefect.name}: ${selectedMonth} payment has been undone.`
        );
      } else {
        const batch = writeBatch(db);

        batch.set(doc(db, "payments", paymentId), {
          prefectName: prefect.name,
          form: prefect.form,
          className: prefect.className,
          month: selectedMonth,
          amount: monthlyFee,
          status: "Paid",
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
        });

        await batch.commit();

        setPaymentMessage(
          `${prefect.name}: ${selectedMonth} payment recorded successfully.`
        );
      }
    } catch (error) {
      console.error("Failed to update payment:", error);
      setPaymentError(
        "Payment could not be updated. Please check your login and Firestore rules."
      );
    } finally {
      setSavingPayment(null);
    }
  }

  async function settleFullFee(prefect: Prefect) {
    if (!isStaff || !user) return;

    const totalFee = monthlyFee * availableMonths.length;
    const paidAmount = getPaidAmount(prefect);
    const remaining = Math.max(0, totalFee - paidAmount);

    if (remaining <= 0) {
      setPaymentMessage(`${prefect.name} has already completed payment.`);
      return;
    }

    const savingId = `full_${prefect.form}_${prefect.name}`;

    setSavingPayment(savingId);
    setPaymentError("");
    setPaymentMessage("");

    try {
      const batch = writeBatch(db);
      let balance = remaining;

      for (const month of availableMonths) {
        if (balance <= 0) break;

        const paymentId = getPaymentId(
          prefect.name,
          prefect.form,
          month
        );

        const existingPayment = payments[paymentId];

        if (existingPayment?.status === "Paid") {
          continue;
        }

        const amountForMonth = Math.min(monthlyFee, balance);

        batch.set(doc(db, "payments", paymentId), {
          prefectName: prefect.name,
          form: prefect.form,
          className: prefect.className,
          month,
          amount: amountForMonth,
          status: "Paid",
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
          paymentType: "full_settlement",
        });

        balance -= amountForMonth;
      }

      await batch.commit();

      setPaymentMessage(
        `${prefect.name}: full payment recorded. ${money(remaining)} collected.`
      );
    } catch (error) {
      console.error("Failed to settle full fee:", error);
      setPaymentError(
        "Full payment could not be recorded. Please check your login and Firestore rules."
      );
    } finally {
      setSavingPayment(null);
    }
  }

  const totalCollected = Object.values(payments)
    .filter((payment) => payment.status === "Paid")
    .reduce((total, payment) => total + payment.amount, 0);

  const isLoading =
    loadingPrefects || loadingPayments || loadingSettings;

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-64 shrink-0 bg-slate-900 p-6 text-white md:block">
        <h1 className="text-xl font-bold">Prefect Portal</h1>

        <p className="mb-8 mt-2 text-xs text-slate-400">
          ADMINISTRATION SYSTEM
        </p>

        <nav className="space-y-2">
          <a href="/" className="block rounded-lg px-4 py-3 text-sm text-slate-300 hover:bg-slate-800">
            Dashboard
          </a>
          <a href="/prefects" className="block rounded-lg px-4 py-3 text-sm text-slate-300 hover:bg-slate-800">
            Prefect Management
          </a>
          <a href="/payments" className="block rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white">
            Payment Management
          </a>
          <a href="/reports" className="block rounded-lg px-4 py-3 text-sm text-slate-300 hover:bg-slate-800">
            Payment Reports
          </a>
          <a href="/settings" className="block rounded-lg px-4 py-3 text-sm text-slate-300 hover:bg-slate-800">
            Settings
          </a>
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="bg-[#10213D] px-6 py-6 text-white shadow-md md:px-8">
          <h1 className="text-2xl font-bold">Payment Management</h1>
          <p className="mt-1 text-sm text-slate-300">
            Manage monthly prefect payments for 2026
          </p>
          <p className="mt-2 text-xs text-slate-300">
            {isStaff
              ? "Staff access: editing enabled"
              : "Public access: read-only"}
          </p>
        </header>

        <main className="p-5 md:p-8">
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total Prefects</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {prefects.length}
              </p>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Monthly Fee</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {money(monthlyFee)}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {availableMonths.length} payment months
              </p>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Recorded Payments</p>
              <p className="mt-2 text-2xl font-bold text-emerald-700">
                {money(totalCollected)}
              </p>
            </div>
          </div>

          <section className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-800">
                Monthly Payment Records
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Select a month, then view the prefects' payment status.
              </p>
            </div>

            {paymentError && (
              <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {paymentError}
              </p>
            )}

            {paymentMessage && (
              <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                {paymentMessage}
              </p>
            )}

            <div className="mb-5 grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Select Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {availableMonths.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Search Prefect
                </label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Enter prefect name..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              {["All", "2", "3", "4", "5"].map((form) => (
                <button
                  key={form}
                  onClick={() => setSelectedForm(form)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium ${
                    selectedForm === form
                      ? "bg-[#10213D] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {form === "All" ? "All Forms" : `Form ${form}`}
                </button>
              ))}
            </div>

            {isLoading ? (
              <p className="py-8 text-center text-slate-500">
                Loading prefect and payment records...
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left text-sm">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      <th className="px-4 py-3">No.</th>
                      <th className="px-4 py-3">Prefect Name</th>
                      <th className="px-4 py-3">Form</th>
                      <th className="px-4 py-3">Class</th>
                      <th className="px-4 py-3">Month</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Payment Status</th>
                      {isStaff && <th className="px-4 py-3">Action</th>}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredPrefects.map((prefect, index) => {
                      const paymentId = getPaymentId(
                        prefect.name,
                        prefect.form,
                        selectedMonth
                      );

                      const isPaid = isMonthPaid(prefect, selectedMonth);

                      const isFullPaid =
                        getPaidAmount(prefect) >=
                        monthlyFee * availableMonths.length;

                      const isSaving =
                        savingPayment === paymentId ||
                        savingPayment ===
                          `full_${prefect.form}_${prefect.name}`;

                      return (
                        <tr
                          key={`${prefect.form}_${prefect.name}`}
                          className="hover:bg-slate-50"
                        >
                          <td className="px-4 py-3 text-slate-500">
                            {index + 1}
                          </td>

                          <td className="px-4 py-3 font-medium text-slate-800">
                            {prefect.name}
                          </td>

                          <td className="px-4 py-3">Form {prefect.form}</td>

                          <td className="px-4 py-3">{prefect.className}</td>

                          <td className="px-4 py-3">{selectedMonth}</td>

                          <td className="px-4 py-3">{money(monthlyFee)}</td>

                          <td className="px-4 py-3">
                            {isPaid ? (
                              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                Paid
                              </span>
                            ) : (
                              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                Unpaid
                              </span>
                            )}
                          </td>

                          {isStaff && (
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => togglePayment(prefect)}
                                  disabled={
                                    isSaving ||
                                    savingPayment !== null ||
                                    (!isPaid && isFullPaid)
                                  }
                                  className={`rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50 ${
                                    isPaid
                                      ? "bg-red-100 text-red-700 hover:bg-red-200"
                                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                                  }`}
                                >
                                  {isSaving
                                    ? "Saving..."
                                    : isPaid
                                      ? "Undo Payment"
                                      : "Mark as Paid"}
                                </button>

                                <button
                                  onClick={() => settleFullFee(prefect)}
                                  disabled={
                                    isSaving ||
                                    savingPayment !== null ||
                                    isFullPaid
                                  }
                                  className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                  {isFullPaid ? "Fully Paid" : "Settle Full Fee"}
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}

                    {filteredPrefects.length === 0 && (
                      <tr>
                        <td
                          colSpan={isStaff ? 8 : 7}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          No prefects found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <p className="mt-5 text-xs text-slate-400">
            Prefect and payment records are loaded from the shared Firestore database.
          </p>
        </main>
      </div>
    </div>
  );
}
