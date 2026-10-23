import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";
import { formatPrice } from "@/lib/format";

function Rating({ average, count }) {
  if (!count) {
    return <span className="text-xs text-slate-400">No reviews yet</span>;
  }
  return (
    <span className="text-xs font-medium text-amber-500">
      ★ {average.toFixed(1)} <span className="font-normal text-slate-500">({count})</span>
    </span>
  );
}

export default function ProductCard({ product }) {
  const inStock = product.quantity > 0;
  const lowStock = inStock && product.quantity <= 5;
  // The database stores only a file name. Show a picture only when it is a full URL or a path.
  const hasImage = product.image && (product.image.startsWith("http") || product.image.startsWith("/"));

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-blue-500 hover:shadow-lg">
      <Link href={`/product/${product.id}`} className="relative block h-44 bg-slate-100">
        {hasImage ? (
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center text-5xl font-bold text-slate-300">
            {product.name.charAt(0)}
          </span>
        )}

        {(!inStock || lowStock) && (
          <span
            className={`absolute right-0 top-0 rounded-bl-lg px-2.5 py-1 text-xs font-semibold text-white ${
              inStock ? "bg-amber-500" : "bg-slate-700"
            }`}
          >
            {inStock ? `Only ${product.quantity} left` : "Sold out"}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <span className="text-xs uppercase tracking-wide text-slate-400">{product.categoryName}</span>
        <Link href={`/product/${product.id}`} className="line-clamp-1 font-semibold hover:text-blue-600">
          {product.name}
        </Link>

        <Rating average={product.averageRating} count={product.reviewCount} />

        <div className="flex items-baseline justify-between pt-1">
          <span className="text-lg font-bold">{formatPrice(product.price)}</span>
          <span className={`text-xs font-medium ${inStock ? "text-green-600" : "text-red-600"}`}>
            {inStock ? "In stock" : "Out of stock"}
          </span>
        </div>

        <div className="mt-auto grid gap-2 pt-3 sm:grid-cols-2">
          <Link
            href={`/product/${product.id}`}
            className="rounded-lg border border-blue-600 py-2 text-center text-sm font-semibold text-blue-600 hover:bg-blue-50"
          >
            View
          </Link>
          <AddToCartButton product={product} />
        </div>
      </div>
    </div>
  );
}
