"use client";

import { useState } from "react";
import ErrorMessage from "@/components/ErrorMessage";
import Loading from "@/components/Loading";
import { Notice, PageHeader, Table, cell, inputClass } from "@/components/admin/ui";
import useApi from "@/hooks/useApi";
import { formatDate, formatPrice } from "@/lib/format";
import { getErrorMessage, getPayments, updatePaymentStatus } from "@/services/api";

const STATUSES = ["PENDING", "COMPLETED", "FAILED", "REFUNDED"];

export default function AdminPaymentsPage() {
  const { data, error: loadError, reload } = useApi(() => getPayments());
  const [error, setError] = useState("");

  if (loadError) return <ErrorMessage message={loadError} onRetry={reload} />;
  if (!data) return <Loading message="Loading payments..." />;

  async function changeStatus(payment, status) {
    setError("");
    try {
      await updatePaymentStatus(payment.id, status);
      reload();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div>
      <PageHeader title="Payments" />
      <Notice message={error} />

      <Table headers={["No.", "Order", "Amount", "Method", "Reference", "Paid at", "Status"]} empty="No payments yet.">
        {[...data].reverse().map((payment, index) => (
          <tr key={payment.id}>
            <td className={cell} title={`Database ID: ${payment.id}`}>{index + 1}</td>
            <td className={cell}>#{payment.orderId}</td>
            <td className={cell}>{formatPrice(payment.amount)}</td>
            <td className={cell}>{payment.method}</td>
            <td className={cell}>{payment.transactionRef || "-"}</td>
            <td className={cell}>{payment.paidAt ? formatDate(payment.paidAt) : "-"}</td>
            <td className={cell}>
              <select
                value={payment.status}
                onChange={(event) => changeStatus(payment, event.target.value)}
                className={`${inputClass} w-auto`}
              >
                {STATUSES.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
