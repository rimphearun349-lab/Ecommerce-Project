"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/context/CartContext";

export default function AddToCart({ product }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const outOfStock = product.quantity === 0;

  function handleAdd() {
    const result = addItem(product, quantity);
    setMessage(result.message || "Added to your cart.");
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-700">Quantity</span>
        <div className="flex items-center rounded-lg border border-slate-200">
          <button
            type="button"
            className="px-3 py-1 hover:bg-slate-100 disabled:opacity-40"
            disabled={outOfStock || quantity <= 1}
            onClick={() => setQuantity(quantity - 1)}
          >
            -
          </button>
          <span className="min-w-10 text-center">{outOfStock ? 0 : quantity}</span>
          <button
            type="button"
            className="px-3 py-1 hover:bg-slate-100 disabled:opacity-40"
            disabled={outOfStock || quantity >= product.quantity}
            onClick={() => setQuantity(quantity + 1)}
          >
            +
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={outOfStock}
          onClick={handleAdd}
          className="rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {outOfStock ? "Out of stock" : "Add to cart"}
        </button>
        {message && (
          <p className="text-sm text-slate-600">
            {message}{" "}
            <Link href="/cart" className="font-medium text-blue-600 hover:underline">
              View cart
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
