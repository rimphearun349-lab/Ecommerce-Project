"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Loading from "@/components/Loading";
import ProtectedRoute from "@/components/ProtectedRoute";
import SectionHeading from "@/components/SectionHeading";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";
import KhqrModal from "@/components/KhqrModal";
import { submitToPayWay } from "@/lib/payway";
import useApi from "@/hooks/useApi";
import { createOrder, getAbaStatus, getErrorMessage, payOrder, startAbaCheckout, startKhqr } from "@/services/api";

const PAYMENT_METHODS = [
  { value: "ABA_KHQR", label: "ABA KHQR", hint: "Scan a real KHQR code with ABA Mobile or any Cambodian banking app" },
  { value: "ABA_PAYWAY", label: "ABA PayWay page", hint: "Card, ABA PAY or KHQR on the secure ABA PayWay page" },
  { value: "CASH_ON_DELIVERY", label: "Cash on delivery", hint: "Pay when the order arrives" },
  { value: "CARD", label: "Credit / Debit card", hint: "Paid right away (simulated)" },
  { value: "PAYPAL", label: "PayPal", hint: "Paid right away (simulated)" },
  { value: "BANK_TRANSFER", label: "Bank transfer", hint: "Paid right away (simulated)" },
];

function CheckoutContent() {
  const { items, ready, total, clear } = useCart();
  const router = useRouter();
  const [method, setMethod] = useState("CASH_ON_DELIVERY");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [khqr, setKhqr] = useState(null); // { order, qr } while the QR pop-up is open

  // Show ABA PayWay only when the server has PayWay credentials (otherwise paying would fail)
  const abaEnabled = useApi(() => getAbaStatus()).data?.enabled === true;
  const availableMethods = PAYMENT_METHODS.filter((option) => !option.value.startsWith("ABA") || abaEnabled);

  // The order exists and the QR pop-up is open (the cart is already empty at this point)
  if (khqr) {
    return (
      <KhqrModal
        key={khqr.qr.tranId}
        order={khqr.order}
        qr={khqr.qr}
        onClose={() => router.push(`/orders?placed=${khqr.order.id}`)}
        onRegenerate={async () => setKhqr({ order: khqr.order, qr: await startKhqr(khqr.order.id) })}
      />
    );
  }

  if (!ready) return <Loading message="Loading your cart..." />;

  // The cart is emptied as soon as the order exists, while the payment is still being prepared:
  // show a short message instead of flashing "Nothing to check out".
  if (busy && items.length === 0) return <Loading message="Preparing your payment..." />;

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
        <p className="text-xl font-semibold">Nothing to check out</p>
        <p className="mt-1 text-slate-500">Your cart is empty.</p>
        <Link href="/products" className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-700">
          Browse products
        </Link>
      </div>
    );
  }

  async function handlePlaceOrder() {
    setBusy(true);
    setError("");

    // 1. Create the order. The server checks the stock and calculates the prices.
    let order;
    try {
      order = await createOrder(items.map((item) => ({ productId: item.productId, quantity: item.quantity })));
    } catch (err) {
      setError(getErrorMessage(err)); // e.g. "Insufficient stock for ..."
      setBusy(false);
      return;
    }

    // The order exists now, so the cart must be emptied even if the payment step fails.
    clear();

    // 2. Pay for it
    try {
      if (method === "ABA_KHQR") {
        setKhqr({ order, qr: await startKhqr(order.id) });
        setBusy(false);
        return;
      }
      if (method === "ABA_PAYWAY") {
        // Leave the shop: the browser is sent to ABA PayWay and comes back to /orders?aba=<order id>
        submitToPayWay(await startAbaCheckout(order.id));
        return;
      }
      await payOrder(order.id, method);
      router.push(`/orders?placed=${order.id}`);
    } catch (err) {
      router.push(`/orders?placed=${order.id}&payment=failed&reason=${encodeURIComponent(getErrorMessage(err))}`);
    }
  }

  return (
    <div>
      <SectionHeading title="Check" highlight="out" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-lg font-bold">Payment method</h2>
            <div className="space-y-2">
              {availableMethods.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
                    method === option.value ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="method"
                    value={option.value}
                    checked={method === option.value}
                    onChange={() => setMethod(option.value)}
                    className="accent-blue-600"
                  />
                  <span>
                    <span className="block font-medium">{option.label}</span>
                    <span className="block text-xs text-slate-500">{option.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-lg font-bold">Items</h2>
            <ul className="divide-y">
              {items.map((item) => (
                <li key={item.productId} className="flex justify-between py-2 text-sm">
                  <span>
                    {item.name} <span className="text-slate-500">x {item.quantity}</span>
                  </span>
                  <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-bold">Order summary</h2>
          <div className="flex justify-between border-t pt-3 text-lg font-bold">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">The final price is confirmed by the server when you place the order.</p>

          {error && (
            <p role="alert" className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}{" "}
              <Link href="/cart" className="font-medium underline">
                Edit cart
              </Link>
            </p>
          )}

          <button
            onClick={handlePlaceOrder}
            disabled={busy}
            className="mt-5 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {busy ? "Placing order..." : "Place order"}
          </button>
        </aside>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <ProtectedRoute>
      <CheckoutContent />
    </ProtectedRoute>
  );
}