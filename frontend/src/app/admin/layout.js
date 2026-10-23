"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";

const menu = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  return (
    <ProtectedRoute requireAdmin>
      <div className="grid gap-6 md:grid-cols-[13rem_1fr]">
        <aside>
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Admin</p>
          <nav className="flex flex-wrap gap-1 md:flex-col">
            {menu.map((item) => {
              const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded px-3 py-2 text-sm font-medium ${
                    active ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0">{children}</section>
      </div>
    </ProtectedRoute>
  );
}
