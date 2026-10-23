"use client";

import { useRouter } from "next/navigation";
import { PageHeader, buttonClass } from "@/components/admin/ui";
import { useAuth } from "@/context/AuthContext";

export default function AdminSettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const rows = [
    ["Signed in as", user?.username],
    ["Email", user?.email],
    ["Role", user?.role],
    ["API address", process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"],
  ];

  return (
    <div>
      <PageHeader title="Settings" />

      <dl className="max-w-xl divide-y rounded-lg bg-white shadow-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 px-4 py-3 text-sm">
            <dt className="text-gray-500">{label}</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-sm text-gray-500">
        The API address comes from <code>NEXT_PUBLIC_API_URL</code> in <code>.env.local</code>.
      </p>

      <button
        onClick={() => {
          logout();
          router.push("/login");
        }}
        className={`${buttonClass.danger} mt-6`}
      >
        Logout
      </button>
    </div>
  );
}
