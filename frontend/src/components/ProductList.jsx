import ProductCard from "@/components/ProductCard";

export default function ProductList({ products, emptyMessage = "No products found." }) {
  if (!products || products.length === 0) {
    return <p className="py-10 text-center text-slate-500">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
