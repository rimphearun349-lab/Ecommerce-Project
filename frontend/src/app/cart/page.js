"use client";

import Link from "next/link";
import Loading from "@/components/Loading";
import SectionHeading from "@/components/SectionHeading";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const { items, ready, total, count, setQuantity, removeItem, clear } = useCart();

  if (!ready) return <Loading message="Loading your cart..." />;

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
        <p className="text-xl font-semibold">Your cart is empty</p>
        <p className="mt-1 text-slate-500">Add some products and they will show up here.</p>
        <Link href="/products" className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-700">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      <SectionHeading title="Shopping" highlight="Cart" />

      <div className="grid gap-6 lg:grid-cols-3">
        <ul className="space-y-3 lg:col-span-2">
          {items.map((item) => {
            const hasImage = item.image && (item.image.startsWith("http") || item.image.startsWith("/"));
            return (
              <li key={item.productId} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4">
                <Link href={`/product/${item.productId}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {hasImage ? (
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-2xl font-bold text-slate-300">
                      {item.name.charAt(0)}
                    </span>
                  )}
                </Link>

                <div className="flex flex-1 flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div>
                    <Link href={`/product/${item.productId}`} className="font-semibold hover:text-blue-600">
                      {item.name}
                    </Link>
                    <p className="text-sm text-slate-500">{formatPrice(item.price)} each</p>
                    <button onClick={() => removeItem(item.productId)} className="mt-1 text-sm text-red-600 hover:underline">
                      Remove
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center rounded-lg border border-slate-200">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        className="px-3 py-1 hover:bg-slate-100 disabled:opacity-40"
                        disabled={item.quantity <= 1}
                        onClick={() => setQuantity(item.productId, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span className="min-w-10 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        className="px-3 py-1 hover:bg-slate-100 disabled:opacity-40"
                        disabled={item.quantity >= item.stock}
                        onClick={() => setQuantity(item.productId, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <span className="w-20 text-right font-semibold">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-bold">Order summary</h2>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Items ({count})</span>
            <span>{formatPrice(total)}</span>
          </div>
          <div className="mt-3 flex justify-between border-t pt-3 text-lg font-bold">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>

          <Link href="/checkout" className="mt-5 block rounded-lg bg-blue-600 py-3 text-center font-semibold text-white hover:bg-blue-700">
            Proceed to checkout
          </Link>
          <Link href="/products" className="mt-2 block text-center text-sm text-slate-600 hover:text-blue-600">
            Continue shopping
          </Link>
          <button onClick={clear} className="mt-4 w-full text-center text-sm text-red-600 hover:underline">
            Empty cart
          </button>
        </aside>
      </div>
    </div>
  );
}
