"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// The shopping cart lives in the browser (localStorage). Only at checkout is it sent to the API,
// which re-checks stock and calculates the real prices.
const CartContext = createContext(null);
const STORAGE_KEY = "cart";

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // [{ productId, name, price, image, stock, quantity }]
  const [ready, setReady] = useState(false);

  // Load the saved cart once, in the browser
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(saved)) setItems(saved);
    } catch {
      // broken saved cart: start with an empty one
    }
    setReady(true);
  }, []);

  // Save after every change (but not before the first load, which would erase the saved cart)
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage full or blocked: the cart still works until the page is closed
    }
  }, [items, ready]);

  // Returns { ok, message } so the button can tell the user what happened.
  const addItem = useCallback(
    (product, quantity = 1) => {
      if (!product.quantity || product.quantity <= 0) {
        return { ok: false, message: "This product is out of stock." };
      }
      const existing = items.find((item) => item.productId === product.id);
      const wanted = (existing?.quantity ?? 0) + quantity;
      const next = Math.min(wanted, product.quantity); // never more than the stock
      const entry = {
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image ?? "",
        stock: product.quantity,
        quantity: next,
      };
      setItems(existing ? items.map((item) => (item.productId === product.id ? entry : item)) : [...items, entry]);
      return {
        ok: true,
        message: wanted > product.quantity ? `Only ${product.quantity} in stock, so the cart is limited to ${next}.` : "",
      };
    },
    [items]
  );

  const setQuantity = useCallback((productId, quantity) => {
    setItems((current) =>
      current.map((item) =>
        item.productId === productId ? { ...item, quantity: Math.max(1, Math.min(quantity, item.stock)) } : item
      )
    );
  }, []);

  const removeItem = useCallback((productId) => {
    setItems((current) => current.filter((item) => item.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      ready,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      addItem,
      setQuantity,
      removeItem,
      clear,
    }),
    [items, ready, addItem, setQuantity, removeItem, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside <CartProvider>");
  return context;
}
