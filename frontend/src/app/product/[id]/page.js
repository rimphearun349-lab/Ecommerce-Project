import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCart from "@/components/AddToCart";
import ErrorMessage from "@/components/ErrorMessage";
import { formatDate, formatPrice } from "@/lib/format";
import { getErrorMessage, getProduct, getReviews } from "@/services/api";

export default async function ProductDetailPage({ params }) {
  const { id } = await params;

  // This page runs on the server, so it calls the Spring Boot API directly.
  let product;
  try {
    product = await getProduct(id);
  } catch (error) {
    if (error.response?.status === 404) notFound();
    return <ErrorMessage title="Could not load this product" message={getErrorMessage(error)} />;
  }

  // Reviews are optional: if they fail to load, still show the product.
  let productReviews = [];
  try {
    productReviews = await getReviews(product.id);
  } catch {
    productReviews = [];
  }
  const average =
    productReviews.length > 0
      ? productReviews.reduce((sum, review) => sum + review.rating, 0) / productReviews.length
      : null;

  return (
    <div className="space-y-10">
      <Link href="/products" className="text-sm text-blue-600 hover:underline">
        &larr; Back to products
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="flex h-72 items-center justify-center rounded-lg bg-gray-200 text-8xl font-bold text-gray-400">
          {product.name.charAt(0)}
        </div>

        <div>
          <span className="text-xs uppercase tracking-wide text-gray-500">{product.categoryName}</span>
          <h1 className="mt-1 text-3xl font-bold">{product.name}</h1>
          <p className="mt-2 text-2xl font-semibold text-blue-600">{formatPrice(product.price)}</p>
          <p className="mt-4 text-gray-700">{product.description}</p>
          <p className={`mt-3 text-sm font-medium ${product.quantity > 0 ? "text-green-600" : "text-red-600"}`}>
            {product.quantity > 0 ? `${product.quantity} in stock` : "Out of stock"}
          </p>

          <AddToCart product={product} />
        </div>
      </div>

      <section>
        <h2 className="mb-1 text-xl font-bold">Reviews</h2>
        {average !== null && (
          <p className="mb-4 text-sm text-gray-600">
            Average rating: {average.toFixed(1)} / 5 ({productReviews.length} reviews)
          </p>
        )}

        {productReviews.length === 0 ? (
          <p className="text-gray-500">No reviews yet.</p>
        ) : (
          <ul className="space-y-3">
            {productReviews.map((review) => (
              <li key={review.id} className="rounded-lg bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{review.username}</span>
                  <span className="text-gray-500">{formatDate(review.createdAt)}</span>
                </div>
                <p className="text-sm text-yellow-600">{review.rating} / 5</p>
                <p className="mt-1 text-gray-700">{review.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}