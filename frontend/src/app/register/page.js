"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import FormField from "@/components/FormField";
import { onlyErrors, validateEmail, validatePassword, validateUsername } from "@/lib/validation";
import { getErrorMessage, getFieldErrors, registerRequest } from "@/services/api";

export default function RegisterPage() {
  const router = useRouter();
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const username = form.get("username").trim();
    const email = form.get("email").trim();
    const password = form.get("password");
    const confirm = form.get("confirm");

    // 1. Check in the browser first (empty fields, invalid email, short password, mismatch)
    const problems = onlyErrors({
      username: validateUsername(username),
      email: validateEmail(email),
      password: validatePassword(password),
      confirm: password !== confirm ? "Passwords do not match" : "",
    });
    setErrors(problems);
    setFormError("");
    if (Object.keys(problems).length > 0) return;

    // 2. Then ask the API (it checks the same rules again, plus duplicates)
    setBusy(true);
    try {
      await registerRequest(username, email, password);
      router.push("/login?registered=1");
    } catch (err) {
      const fields = getFieldErrors(err);
      const message = getErrorMessage(err);

      if (Object.keys(fields).length > 0) {
        setErrors(fields);
      } else if (err.response?.status === 409 && /email/i.test(message)) {
        setErrors({ email: message });
      } else if (err.response?.status === 409 && /username/i.test(message)) {
        setErrors({ username: message });
      } else {
        setFormError(message);
      }
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-sm">
      <h1 className="mb-6 text-2xl font-bold">Create an account</h1>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField label="Username" id="username" type="text" autoComplete="username" error={errors.username} />
        <FormField label="Email" id="email" type="email" autoComplete="email" error={errors.email} />
        <FormField
          label="Password (at least 6 characters)"
          id="password"
          type="password"
          autoComplete="new-password"
          error={errors.password}
        />
        <FormField label="Confirm password" id="confirm" type="password" autoComplete="new-password" error={errors.confirm} />

        {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {busy ? "Creating account..." : "Register"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-blue-600 hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
}
