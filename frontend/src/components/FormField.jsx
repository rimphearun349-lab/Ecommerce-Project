export default function FormField({ label, id, error, ...inputProps }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        name={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full rounded border px-3 py-2 focus:outline-none ${
          error ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"
        }`}
        {...inputProps}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
