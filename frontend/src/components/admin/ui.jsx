// Small building blocks shared by every admin page.

export const inputClass =
  "w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none";

export const buttonClass = {
  primary: "rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60",
  ghost: "rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100",
  danger: "rounded border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50",
};

export function PageHeader({ title, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-bold">{title}</h1>
      {children}
    </div>
  );
}

export function Notice({ message }) {
  if (!message) return null;
  return (
    <p role="alert" className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </p>
  );
}

export function Table({ headers, children, empty = "Nothing here yet." }) {
  const rows = Array.isArray(children) ? children.flat().filter(Boolean) : children;
  const isEmpty = Array.isArray(rows) && rows.length === 0;
  return (
    <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
      <table className="w-full min-w-max text-left text-sm">
        <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">{children}</tbody>
      </table>
      {isEmpty && <p className="p-6 text-center text-gray-500">{empty}</p>}
    </div>
  );
}

export const cell = "px-4 py-3";
