"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Loading from "@/components/Loading";
import ErrorMessage from "@/components/ErrorMessage";

/**
 * Wrap a page that needs a logged-in user:
 *   <ProtectedRoute>...</ProtectedRoute>
 * Add requireAdmin for admin-only pages:
 *   <ProtectedRoute requireAdmin>...</ProtectedRoute>
 * This only hides the page in the browser. The real protection is the backend (JWT + roles).
 */
export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { ready, isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [ready, isAuthenticated, router, pathname]);

  if (!ready || !isAuthenticated) {
    return <Loading message="Checking your session..." />;
  }

  if (requireAdmin && !isAdmin) {
    return <ErrorMessage title="Access denied" message="You need an administrator account to view this page." />;
  }

  return children;
}
