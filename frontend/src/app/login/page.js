"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import FormField from "@/components/FormField";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage, loginRequest } from "@/services/api";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  // Messages passed in the URL: ?registered=1 (after Register) and ?expired=1 (after a rejected token)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("registered")) setNotice("Account created. Please log in.");
    if (params.get("expired")) setNotice("Your session has expired. Please log in again.");
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const usernameOrEmail = form.get("usernameOrEmail").trim();
    const password = form.get("password");

    const problems = {};
    if (!usernameOrEmail) problems.usernameOrEmail = "Username or email is required";
    if (!password) problems.password = "Password is required";
    setErrors(problems);
    setFormError("");
    if (Object.keys(problems).length > 0) return;

    setBusy(true);
    try {
      const data = await loginRequest(usernameOrEmail, password);
      login(data);

      // Go back to the page that asked for login (?next=/admin), otherwise admins go to /admin.
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(next && next.startsWith("/") ? next : data.user?.role === "ADMIN" ? "/admin" : "/");
    } catch (err) {
      setFormError(err.response?.status === 401 ? "Wrong username/email or password." : getErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-sm">
      <h1 className="mb-6 text-2xl font-bold">Login</h1>

      {notice && <p className="mb-4 rounded bg-blue-50 px-3 py-2 text-sm text-blue-800">{notice}</p>}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField label="Username or email" id="usernameOrEmail" type="text" autoComplete="username" error={errors.usernameOrEmail} />
        <FormField label="Password" id="password" type="password" autoComplete="current-password" error={errors.password} />

        {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {busy ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        No account yet?{" "}
        <Link href="/register" className="font-medium text-blue-600 hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
