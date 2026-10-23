"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ErrorMessage from "@/components/ErrorMessage";
import Loading from "@/components/Loading";
import ProtectedRoute from "@/components/ProtectedRoute";
import SectionHeading from "@/components/SectionHeading";
import StatusBadge from "@/components/StatusBadge";
import useApi from "@/hooks/useApi";
import { formatDate, formatPrice } from "@/lib/format";
import KhqrModal from "@/components/KhqrModal";
import { submitToPayWay } from "@/lib/payway";
import { cancelOrder, confirmAbaPayment, getAbaStatus, getErrorMessage, getOrders, payOrder, startAbaCheckout, startKhqr } from "@/services/api";

const ONLINE_METHODS = [
  { value: "ABA_KHQR", label: "ABA KHQR (scan)" },
  { value: "ABA_PAYWAY", label: "ABA PayWay page" },
  { value: "CARD", label: "Card" },
  { value: "PAYPAL", label: "PayPal" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
];

function OrdersContent() {
  const { data, loading, error, reload } = useApi(() => getOrders());
  const [notice, setNotice] = useState(null); // { type: "success" | "error", text }
  const [methods, setMethods] = useState({}); // chosen payment method per order id
  const [busyId, setBusyId] = useState(null);
  const [khqr, setKhqr] = useState(null); // { order, qr } while the QR pop-up is open

  // Offer ABA PayWay only when the server has PayWay credentials; otherwise default to Card
  const abaEnabled = useApi(() => getAbaStatus()).data?.enabled === true;
  const defaultMethod = abaEnabled ? "ABA_KHQR" : "CARD";
  const onlineMethods = ONLINE_METHODS.filter((method) => !method.value.startsWith("ABA") || abaEnabled);

  // Messages left in the URL by checkout / ABA PayWay:
  //   ?placed=12  ?placed=12&payment=failed&reason=...  ?aba=12 (back from PayWay)  ?aba=cancel&order=12
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const placed = params.get("placed");
    const aba = params.get("aba");

    if (aba === "cancel") {
      setNotice({ type: "error", text: `You cancelled the ABA PayWay payment for order #${params.get("order")}. It is still pending.` });
    } else if (aba) {
      // The customer is back from PayWay. Never trust the URL: ask the server, which asks PayWay.
      confirmAbaPayment(Number(aba))
        .then((payment) => {
          if (payment.status === "COMPLETED") {
            setNotice({ type: "success", text: `Payment received. Order #${aba} is paid. Thank you!` });
          } else if (payment.status === "FAILED") {
            setNotice({ type: "error", text: `The ABA PayWay payment for order #${aba} was not completed. You can try again below.` });
          } else {
            setNotice({ type: "error", text: `ABA PayWay has not confirmed order #${aba} yet. Wait a moment, then press "Check payment".` });
          }
          reload();
        })
        .catch((err) => setNotice({ type: "error", text: getErrorMessage(err) }));
    } else if (placed && params.get("payment") === "failed") {
      setNotice({
        type: "error",
        text: `Order #${placed} was created, but the payment failed: ${params.get("reason") || "unknown error"}. You can pay or cancel it below.`,
      });
    } else if (placed) {
      setNotice({ type: "success", text: `Thank you! Order #${placed} was placed successfully.` });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run(order, action) {
    setBusyId(order.id);
    setNotice(null);
    try {
      await action();
      reload();
    } catch (err) {
      setNotice({ type: "error", text: getErrorMessage(err) });
    }
    setBusyId(null);
  }

  const handlePay = (order) =>
    run(order, async () => {
      const method = methods[order.id] ?? defaultMethod;
      if (method === "ABA_KHQR") {
        setKhqr({ order, qr: await startKhqr(order.id) });
      } else if (method === "ABA_PAYWAY") {
        submitToPayWay(await startAbaCheckout(order.id)); // leaves the site
      } else {
        await payOrder(order.id, method);
      }
    });
  const handleCheck = (order) =>
    run(order, async () => {
      const payment = await confirmAbaPayment(order.id);
      setNotice({
        type: payment.status === "COMPLETED" ? "success" : "error",
        text:
          payment.status === "COMPLETED"
            ? `Payment received. Order #${order.id} is paid.`
            : `ABA PayWay has not confirmed order #${order.id} yet (status: ${payment.status}).`,
      });
    });
  const handleCancel = (order) => {
    if (window.confirm(`Cancel order #${order.id}?`)) run(order, () => cancelOrder(order.id));
  };

  const orders = [...(data ?? [])].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

  return (
    <div>
      <SectionHeading title="My" highlight="Orders" />

      {khqr && (
        <KhqrModal
          key={khqr.qr.tranId}
          order={khqr.order}
          qr={khqr.qr}
          onClose={() => {
            setKhqr(null);
            reload();
          }}
          onRegenerate={async () => setKhqr({ order: khqr.order, qr: await startKhqr(khqr.order.id) })}
        />
      )}

      {notice && (
        <p
          role={notice.type === "error" ? "alert" : "status"}
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            notice.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-800"
          }`}
        >
          {notice.text}
        </p>
      )}

      {loading && <Loading message="Loading your orders..." />}
      {error && <ErrorMessage title="Could not load your orders" message={error} onRetry={reload} />}

      {data && orders.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
          <p className="text-xl font-semibold">You have no orders yet</p>
          <Link href="/products" className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-700">
            Start shopping
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {orders.map((order) => (
          <article key={order.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <header className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-bold">Order #{order.id}</h2>
                <p className="text-sm text-slate-500">{formatDate(order.orderDate)}</p>
              </div>
              <StatusBadge status={order.status} />
            </header>

            <ul className="mt-3 divide-y text-sm">
              {order.items.map((item) => (
                <li key={item.productId} className="flex justify-between py-2">
                  <span>
                    {item.productName} <span className="text-slate-500">x {item.quantity}</span>
                  </span>
                  <span>{formatPrice(item.subtotal)}</span>
                </li>
              ))}
            </ul>

            <p className="mt-2 text-right text-lg font-bold">Total: {formatPrice(order.totalPrice)}</p>

            {order.status === "PENDING" && (
              <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t pt-3">
                <select
                  value={methods[order.id] ?? defaultMethod}
                  onChange={(event) => setMethods({ ...methods, [order.id]: event.target.value })}
                  aria-label="Payment method"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  {onlineMethods.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handlePay(order)}
                  disabled={busyId === order.id}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  Pay now
                </button>
                {(methods[order.id] ?? defaultMethod).startsWith("ABA") && (
                  <button
                    onClick={() => handleCheck(order)}
                    disabled={busyId === order.id}
                    className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-60"
                  >
                    Check payment
                  </button>
                )}
                <button
                  onClick={() => handleCancel(order)}
                  disabled={busyId === order.id}
                  className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                >
                  Cancel order
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <OrdersContent />
    </ProtectedRoute>
  );
}
