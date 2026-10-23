"use client";

import Link from "next/link";
import ErrorMessage from "@/components/ErrorMessage";
import Loading from "@/components/Loading";
import ProductList from "@/components/ProductList";
import SectionHeading from "@/components/SectionHeading";
import useApi from "@/hooks/useApi";
import { getCategories, getProducts } from "@/services/api";

export default function HomePage() {
  const productsApi = useApi(() => getProducts());
  const categoriesApi = useApi(() => getCategories());

  const products = productsApi.data ?? [];
  const categories = categoriesApi.data ?? [];

  const featured = products.slice(0, 8);
  // Only products that really have reviews, best rated first
  const topRated = products
    .filter((product) => product.reviewCount > 0)
    .sort((a, b) => b.averageRating - a.averageRating || b.reviewCount - a.reviewCount)
    .slice(0, 4);

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-navy-800 px-8 py-14 text-white md:px-14 md:py-20">
        <div className="absolute -right-16 -top-20 h-80 w-80 rounded-full bg-blue-600/30" />
        <div className="absolute -bottom-24 right-32 h-64 w-64 rounded-full bg-blue-500/20" />

        <div className="relative max-w-xl">
          <p className="text-sm font-medium text-blue-200">Best deals online</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight md:text-6xl">SHOP SMART.</h1>
          <p className="mt-4 text-lg text-slate-300">Electronics, clothing, books and more at friendly prices.</p>
          <Link
            href="/products"
            className="mt-8 inline-block rounded-lg bg-blue-600 px-7 py-3 font-semibold text-white hover:bg-blue-500"
          >
            Shop now
          </Link>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section>
          <SectionHeading title="Shop from" highlight="Top Categories" href="/products" />
          <div className="flex flex-wrap justify-center gap-6 sm:justify-start">
            {categories.map((category) => (
              <Link key={category.id} href={`/products?category=${category.id}`} className="group w-24 text-center">
                <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-2xl font-bold text-slate-400 ring-2 ring-transparent transition group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:ring-blue-500">
                  {category.name.charAt(0)}
                </span>
                <span className="mt-2 block text-sm font-medium text-slate-700 group-hover:text-blue-600">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      <section>
        <SectionHeading title="Featured" highlight="Products" href="/products" />
        {productsApi.loading && <Loading message="Loading products..." />}
        {productsApi.error && (
          <ErrorMessage title="Could not load products" message={productsApi.error} onRetry={productsApi.reload} />
        )}
        {productsApi.data && <ProductList products={featured} />}
      </section>

      {/* Top rated */}
      {topRated.length > 0 && (
        <section>
          <SectionHeading title="Top" highlight="Rated" />
          <ProductList products={topRated} />
        </section>
      )}
    </div>
  );
}
