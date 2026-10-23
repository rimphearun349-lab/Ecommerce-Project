"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";

export default function AddToCartButton({ product }) {
  const { addItem } = useCart();
  const [message, setMessage] = useState("");
  const outOfStock = product.quantity === 0;

  function handleClick() {
    const result = addItem(product, 1);
    setMessage(result.message || "Added to cart ✓");
    setTimeout(() => setMessage(""), 2500);
  }

  return (
    <div>
      <button
        type="button"
        disabled={outOfStock}
        onClick={handleClick}
        className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {outOfStock ? "Out of stock" : "Add to cart"}
      </button>
      {message && <p className="mt-1 text-xs text-green-600">{message}</p>}
    </div>
  );
}
