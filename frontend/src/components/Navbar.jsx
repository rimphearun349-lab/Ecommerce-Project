"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CartIcon, SearchIcon, UserIcon } from "@/components/Icons";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import useApi from "@/hooks/useApi";
import { getCategories } from "@/services/api";

export default function Navbar() {
  const { ready, isAuthenticated, isAdmin, user, logout } = useAuth();
  const { count } = useCart();
  const router = useRouter();
  const [term, setTerm] = useState("");
  const categories = useApi(() => getCategories()).data ?? [];

  function handleSearch(event) {
    event.preventDefault();
    const query = term.trim();
    router.push(query ? `/products?q=${encodeURIComponent(query)}` : "/products");
  }

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <header className="bg-white shadow-sm">
      {/* Top strip */}
      <div className="hidden bg-slate-100 text-xs text-slate-600 md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-1.5">
          <span>Welcome to MyShop!</span>
          <div className="flex gap-5">
            <Link href="/orders" className="hover:text-blue-600">Track your order</Link>
            <Link href="/products" className="hover:text-blue-600">All products</Link>
          </div>
        </div>
      </div>

      {/* Logo, search, account, cart */}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4">
        <Link href="/" className="text-2xl font-extrabold tracking-tight text-blue-600">
          MyShop
        </Link>

        <form onSubmit={handleSearch} className="relative order-last w-full md:order-none md:max-w-md md:flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search products..."
            aria-label="Search products"
            className="w-full rounded-lg border border-transparent bg-blue-50 py-2.5 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
          />
        </form>

        <nav className="ml-auto flex items-center gap-5 text-sm font-medium text-slate-700">
          {isAdmin && (
            <Link href="/admin" className="rounded-full bg-blue-50 px-3 py-1 text-blue-700 hover:bg-blue-100">
              Admin
            </Link>
          )}

          {ready && isAuthenticated ? (
            <>
              <Link href="/orders" className="hover:text-blue-600">Orders</Link>
              <span className="hidden items-center gap-1.5 sm:flex">
                <UserIcon /> {user?.username}
              </span>
              <button onClick={handleLogout} className="hover:text-blue-600">Logout</button>
            </>
          ) : (
            ready && (
              <>
                <Link href="/login" className="flex items-center gap-1.5 hover:text-blue-600">
                  <UserIcon /> Sign in
                </Link>
                <Link href="/register" className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                  Register
                </Link>
              </>
            )
          )}

          <Link href="/cart" className="flex items-center gap-1.5 hover:text-blue-600">
            <CartIcon /> Cart
            {count > 0 && (
              <span className="min-w-5 rounded-full bg-blue-600 px-1.5 text-center text-xs font-semibold text-white">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>

      {/* Category chips */}
      <div className="border-t border-slate-100">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3">
          <Link href="/products" className="shrink-0 rounded-full bg-blue-600 px-4 py-1.5 text-sm font-medium text-white">
            All products
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.id}`}
              className="shrink-0 rounded-full border border-slate-200 px-4 py-1.5 text-sm text-slate-700 hover:border-blue-500 hover:text-blue-600"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
