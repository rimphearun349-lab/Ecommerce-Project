"use client";

import { useState } from "react";
import ErrorMessage from "@/components/ErrorMessage";
import Loading from "@/components/Loading";
import StatusBadge from "@/components/StatusBadge";
import { Notice, PageHeader, Table, cell, inputClass } from "@/components/admin/ui";
import useApi from "@/hooks/useApi";
import { formatDate, formatPrice } from "@/lib/format";
import { getErrorMessage, getOrders, updateOrderStatus } from "@/services/api";

const STATUSES = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];

export default function AdminOrdersPage() {
  const { data, error: loadError, reload } = useApi(() => getOrders());
  const [filter, setFilter] = useState("ALL");
  const [error, setError] = useState("");

  if (loadError) return <ErrorMessage message={loadError} onRetry={reload} />;
  if (!data) return <Loading message="Loading orders..." />;

  async function changeStatus(order, status) {
    setError("");
    try {
      await updateOrderStatus(order.id, status);
      reload();
    } catch (err) {
      setError(getErrorMessage(err)); // e.g. the backend refuses an invalid status change
    }
  }

  const orders = data
    .filter((order) => filter === "ALL" || order.status === filter)
    .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

  return (
    <div>
      <PageHeader title="Orders">
        <select value={filter} onChange={(event) => setFilter(event.target.value)} className={`${inputClass} w-auto`}>
          <option value="ALL">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </PageHeader>

      <Notice message={error} />

      <Table headers={["Order", "Customer", "Date", "Items", "Total", "Status", "Change status"]} empty="No orders found.">
        {orders.map((order) => (
          <tr key={order.id}>
            <td className={cell}>#{order.id}</td>
            <td className={cell}>{order.username}</td>
            <td className={cell}>{formatDate(order.orderDate)}</td>
            <td className={cell}>{order.items.map((item) => `${item.productName} x${item.quantity}`).join(", ")}</td>
            <td className={cell}>{formatPrice(order.totalPrice)}</td>
            <td className={cell}>
              <StatusBadge status={order.status} />
            </td>
            <td className={cell}>
              <select
                value={order.status}
                onChange={(event) => changeStatus(order, event.target.value)}
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
