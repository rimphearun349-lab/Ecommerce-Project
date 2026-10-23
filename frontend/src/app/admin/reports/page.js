"use client";

import ErrorMessage from "@/components/ErrorMessage";
import Loading from "@/components/Loading";
import StatusBadge from "@/components/StatusBadge";
import { PageHeader, Table, cell } from "@/components/admin/ui";
import useApi from "@/hooks/useApi";
import { formatPrice } from "@/lib/format";
import { getOrders } from "@/services/api";

const STATUSES = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];

export default function AdminReportsPage() {
  const { data, error, reload } = useApi(() => getOrders());

  if (error) return <ErrorMessage message={error} onRetry={reload} />;
  if (!data) return <Loading message="Building reports..." />;

  // Orders and money per status
  const byStatus = STATUSES.map((status) => {
    const orders = data.filter((order) => order.status === status);
    return { status, count: orders.length, total: orders.reduce((sum, order) => sum + order.totalPrice, 0) };
  });

  // Best sellers: units sold per product, ignoring cancelled orders
  const sold = new Map();
  for (const order of data) {
    if (order.status === "CANCELLED") continue;
    for (const item of order.items) {
      const row = sold.get(item.productId) ?? { name: item.productName, units: 0, revenue: 0 };
      row.units += item.quantity;
      row.revenue += item.subtotal;
      sold.set(item.productId, row);
    }
  }
  const topProducts = [...sold.values()].sort((a, b) => b.units - a.units).slice(0, 10);

  return (
    <div className="space-y-8">
      <PageHeader title="Reports" />

      <section>
        <h2 className="mb-3 font-semibold">Orders by status</h2>
        <Table headers={["Status", "Orders", "Total value"]}>
          {byStatus.map((row) => (
            <tr key={row.status}>
              <td className={cell}>
                <StatusBadge status={row.status} />
              </td>
              <td className={cell}>{row.count}</td>
              <td className={cell}>{formatPrice(row.total)}</td>
            </tr>
          ))}
        </Table>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Top selling products</h2>
        <Table headers={["#", "Product", "Units sold", "Revenue"]} empty="No sales yet.">
          {topProducts.map((product, index) => (
            <tr key={product.name}>
              <td className={cell}>{index + 1}</td>
              <td className={`${cell} font-medium`}>{product.name}</td>
              <td className={cell}>{product.units}</td>
              <td className={cell}>{formatPrice(product.revenue)}</td>
            </tr>
          ))}
        </Table>
      </section>
    </div>
  );
}
