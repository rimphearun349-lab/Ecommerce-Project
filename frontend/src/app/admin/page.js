"use client";

import Link from "next/link";
import ErrorMessage from "@/components/ErrorMessage";
import Loading from "@/components/Loading";
import StatusBadge from "@/components/StatusBadge";
import { Table, cell } from "@/components/admin/ui";
import useApi from "@/hooks/useApi";
import { formatDate, formatPrice } from "@/lib/format";
import { getAdminStats, getOrders } from "@/services/api";

const REVENUE_STATUSES = ["PAID", "SHIPPED", "DELIVERED"];

// Revenue for each of the last 7 days (oldest first), counting only paid orders.
function revenueByDay(orders) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);
    days.push({ key: date.toDateString(), label: date.toLocaleDateString("en-GB", { weekday: "short" }), total: 0 });
  }
  for (const order of orders) {
    if (!REVENUE_STATUSES.includes(order.status)) continue;
    const day = days.find((d) => d.key === new Date(order.orderDate).toDateString());
    if (day) day.total += order.totalPrice;
  }
  return days;
}

export default function AdminDashboardPage() {
  const statsApi = useApi(() => getAdminStats());
  const ordersApi = useApi(() => getOrders());

  const error = statsApi.error || ordersApi.error;
  if (error) {
    return (
      <ErrorMessage
        title="Could not load the dashboard"
        message={error}
        onRetry={() => {
          statsApi.reload();
          ordersApi.reload();
        }}
      />
    );
  }
  if (!statsApi.data || !ordersApi.data) return <Loading message="Loading dashboard..." />;

  const stats = statsApi.data;
  const orders = [...ordersApi.data].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
  const chart = revenueByDay(orders);
  const max = Math.max(...chart.map((d) => d.total), 1);

  const cards = [
    { label: "Products", value: stats.totalProducts, href: "/admin/products" },
    { label: "Orders", value: stats.totalOrders, href: "/admin/orders" },
    { label: "Users", value: stats.totalUsers, href: "/admin/users" },
    { label: "Revenue", value: formatPrice(stats.totalRevenue), href: "/admin/reports" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="rounded-lg bg-white p-5 shadow-sm hover:shadow">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="mt-1 text-2xl font-bold">{card.value}</p>
          </Link>
        ))}
      </div>

      <section className="rounded-lg bg-white p-5 shadow-sm">
        <h2 className="mb-1 font-semibold">Sales / Revenue</h2>
        <p className="mb-4 text-sm text-gray-500">Last 7 days (paid, shipped and delivered orders)</p>
        <div className="flex h-44 items-end gap-3">
          {chart.map((day) => (
            <div key={day.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className="text-xs text-gray-500">{day.total > 0 ? formatPrice(day.total) : ""}</span>
              <div
                className="w-full rounded-t bg-blue-500"
                style={{ height: `${Math.max((day.total / max) * 100, 2)}%` }}
                title={`${day.label}: ${formatPrice(day.total)}`}
              />
              <span className="text-xs text-gray-600">{day.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm text-blue-600 hover:underline">
            View all
          </Link>
        </div>
        <Table headers={["Order", "Customer", "Date", "Total", "Status"]} empty="No orders yet.">
          {orders.slice(0, 5).map((order) => (
            <tr key={order.id}>
              <td className={cell}>#{order.id}</td>
              <td className={cell}>{order.username}</td>
              <td className={cell}>{formatDate(order.orderDate)}</td>
              <td className={cell}>{formatPrice(order.totalPrice)}</td>
              <td className={cell}>
                <StatusBadge status={order.status} />
              </td>
            </tr>
          ))}
        </Table>
      </section>
    </div>
  );
}
