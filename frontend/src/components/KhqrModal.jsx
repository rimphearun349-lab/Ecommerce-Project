"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { formatDate, formatPrice } from "@/lib/format";
import { confirmAbaPayment, getErrorMessage } from "@/services/api";

const POLL_MS = 4000; // how often we ask the server (which asks ABA PayWay) if the customer has paid

function clock(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Pop-up with the invoice and a real KHQR code from ABA PayWay.
 *   order        the order (id, orderDate, items, totalPrice)
 *   qr           { qrImage, deeplink, tranId, lifetimeMinutes } from POST /api/payments/aba/khqr
 *   onClose      called when the customer closes the pop-up (after paying, or to pay later)
 *   onRegenerate async function that asks the server for a fresh QR code
 */
export default function KhqrModal({ order, qr, onClose, onRegenerate }) {
  const [secondsLeft, setSecondsLeft] = useState(qr.lifetimeMinutes * 60);
  const [state, setState] = useState("waiting"); // waiting | paid | failed | expired
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const checking = useRef(false);

  // Only show what we expect: a picture, and a link that opens the ABA Mobile app
  const image = qr.qrImage?.startsWith("data:image/") ? qr.qrImage : null;
  const deeplink = qr.deeplink?.startsWith("abamobilebank://") ? qr.deeplink : null;

  const checkNow = useCallback(async () => {
    if (checking.current) return;
    checking.current = true;
    try {
      const payment = await confirmAbaPayment(order.id);
      if (payment.status === "COMPLETED") setState("paid");
      else if (payment.status === "FAILED") setState("failed");
      setNote("");
    } catch (err) {
      setNote(getErrorMessage(err));
    } finally {
      checking.current = false;
    }
  }, [order.id]);

  // While waiting: count down every second and ask for the result every few seconds
  useEffect(() => {
    if (state !== "waiting") return;
    const poll = setInterval(checkNow, POLL_MS);
    const tick = setInterval(() => setSecondsLeft((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [state, checkNow]);

  useEffect(() => {
    if (state === "waiting" && secondsLeft === 0) setState("expired");
  }, [secondsLeft, state]);

  async function regenerate() {
    setBusy(true);
    setNote("");
    try {
      await onRegenerate(); // the parent replaces the QR, which restarts this pop-up
    } catch (err) {
      setNote(getErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="khqr-title"
    >
      <div className="my-8 w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between bg-blue-600 px-6 py-4 text-white">
          <h2 id="khqr-title" className="text-lg font-bold">
            Pay with ABA KHQR
          </h2>
          <button onClick={onClose} aria-label="Close" className="text-2xl leading-none hover:opacity-80">
            ×
          </button>
        </div>

        <div className="grid md:grid-cols-2">
          {/* Invoice */}
          <section className="border-b border-slate-200 p-6 md:border-b-0 md:border-r">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Invoice</p>
                <p className="text-xl font-bold">Order #{order.id}</p>
                <p className="text-sm text-slate-500">{formatDate(order.orderDate)}</p>
              </div>
              <StatusBadge status={state === "paid" ? "PAID" : "PENDING"} />
            </div>

            <ul className="mt-4 divide-y text-sm">
              {order.items.map((item) => (
                <li key={item.productId} className="flex justify-between gap-3 py-2">
                  <span>
                    {item.productName} <span className="text-slate-500">x {item.quantity}</span>
                  </span>
                  <span className="font-medium">{formatPrice(item.subtotal)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-2 flex justify-between border-t pt-3 text-lg font-bold">
              <span>Total</span>
              <span>{formatPrice(order.totalPrice)}</span>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Reference: <span className="font-mono">{qr.tranId}</span>
            </p>
          </section>

          {/* QR / result */}
          <section className="flex flex-col items-center justify-center p-6 text-center">
            {state === "paid" ? (
              <>
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600">
                  ✓
                </span>
                <p className="mt-4 text-xl font-bold">Payment received</p>
                <p className="mt-1 text-sm text-slate-600">Thank you! Order #{order.id} is paid.</p>
                <button onClick={onClose} className="mt-6 rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-700">
                  Done
                </button>
              </>
            ) : state === "waiting" ? (
              <>
                {image ? (
                  <img src={image} alt="KHQR code to pay" className="h-56 w-56 rounded-lg border border-slate-200 object-contain" />
                ) : (
                  <p className="text-sm text-red-600">The QR image could not be shown. Close this and try again.</p>
                )}
                <p className="mt-3 text-sm text-slate-600">Scan with ABA Mobile or any Cambodian banking app (KHQR).</p>
                <p className="mt-1 text-2xl font-bold">{formatPrice(qr.amount ?? order.totalPrice)}</p>
                <p className="mt-1 text-sm text-slate-500">
                  Expires in <span className="font-mono font-semibold text-slate-700">{clock(secondsLeft)}</span>
                </p>
                <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" /> Waiting for payment...
                </p>

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <button onClick={checkNow} className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50">
                    I have paid
                  </button>
                  {deeplink && (
                    <a href={deeplink} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                      Open ABA Mobile
                    </a>
                  )}
                </div>
                <button onClick={onClose} className="mt-4 text-sm text-slate-500 hover:text-slate-700 hover:underline">
                  Pay later
                </button>
              </>
            ) : (
              <>
                <p className="text-xl font-bold">{state === "expired" ? "This QR code has expired" : "Payment was not completed"}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {state === "expired"
                    ? "Create a new QR code to pay. If you already paid, it will be detected."
                    : "The payment was declined or cancelled. You can try again."}
                </p>
                <button
                  onClick={regenerate}
                  disabled={busy}
                  className="mt-5 rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {busy ? "Creating..." : "Create new QR code"}
                </button>
                <button onClick={onClose} className="mt-4 text-sm text-slate-500 hover:text-slate-700 hover:underline">
                  Pay later
                </button>
              </>
            )}

            {note && (
              <p role="alert" className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {note}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}