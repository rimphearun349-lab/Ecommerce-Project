export default function Loading({ message = "Loading..." }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
