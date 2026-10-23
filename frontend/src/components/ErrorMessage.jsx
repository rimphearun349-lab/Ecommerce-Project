"use client";

export default function ErrorMessage({ title = "Something went wrong", message, onRetry }) {
  return (
    <div role="alert" className="mx-auto max-w-lg rounded-lg border border-red-200 bg-red-50 p-5 text-center">
      <h2 className="font-semibold text-red-800">{title}</h2>
      {message && <p className="mt-1 text-sm text-red-700">{message}</p>}

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}
