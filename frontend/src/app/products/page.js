"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import ErrorMessage from "@/components/ErrorMessage";
import Loading from "@/components/Loading";
import ProductList from "@/components/ProductList";
import SearchBar from "@/components/SearchBar";
import SectionHeading from "@/components/SectionHeading";
import useApi from "@/hooks/useApi";
import { getCategories, getProducts } from "@/services/api";

function ProductsContent() {
  // ?q=phone and ?category=2 come from the navbar search box and the category chips
  const params = useSearchParams();
  const [keyword, setKeyword] = useState(params.get("q") ?? "");
  const [categoryId, setCategoryId] = useState(params.get("category") ?? "all");
  const [sort, setSort] = useState("name");

  useEffect(() => {
    setKeyword(params.get("q") ?? "");
    setCategoryId(params.get("category") ?? "all");
  }, [params]);

  const productsApi = useApi(() => getProducts());
  const categoriesApi = useApi(() => getCategories());

  const products = productsApi.data;
  const categories = categoriesApi.data ?? []; // filter still works if categories fail to load

  const visible = useMemo(() => {
    if (!products) return [];
    const term = keyword.trim().toLowerCase();

    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(term) &&
        (categoryId === "all" || product.categoryId === Number(categoryId))
    );

    return [...filtered].sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      return a.name.localeCompare(b.name);
    });
  }, [products, keyword, categoryId, sort]);

  const selectClass =
    "rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none";

  return (
    <div>
      <SectionHeading title="All" highlight="Products" />

      <div className="mb-6 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <SearchBar value={keyword} onChange={setKeyword} className="min-w-56 flex-1" />

        <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className={selectClass}>
          <option value="all">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <select value={sort} onChange={(event) => setSort(event.target.value)} className={selectClass}>
          <option value="name">Name (A-Z)</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
      </div>

      {productsApi.loading && <Loading message="Loading products..." />}
      {productsApi.error && (
        <ErrorMessage title="Could not load products" message={productsApi.error} onRetry={productsApi.reload} />
      )}
      {products && (
        <>
          <p className="mb-4 text-sm text-slate-500">{visible.length} product(s)</p>
          <ProductList products={visible} />
        </>
      )}
    </div>
  );
}

// useSearchParams needs a Suspense boundary in the Next.js App Router
export default function ProductsPage() {
  return (
    <Suspense fallback={<Loading message="Loading products..." />}>
      <ProductsContent />
    </Suspense>
  );
}
