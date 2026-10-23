import Link from "next/link";

const columns = [
  {
    title: "Shop",
    links: [
      { href: "/", label: "Home" },
      { href: "/products", label: "All products" },
      { href: "/cart", label: "Cart" },
      { href: "/orders", label: "My orders" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Sign in" },
      { href: "/register", label: "Create account" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-8 bg-blue-600 text-blue-50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-[2fr_1fr_1fr]">
        <div>
          <p className="text-2xl font-extrabold text-white">MyShop</p>
          <p className="mt-2 max-w-xs text-sm text-blue-100">
            Electronics, clothing, books and more at friendly prices.
          </p>
        </div>

        {columns.map((column) => (
          <div key={column.title}>
            <p className="mb-3 border-b border-blue-500 pb-2 text-sm font-semibold text-white">{column.title}</p>
            <ul className="space-y-2 text-sm">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="border-t border-blue-500 py-4 text-center text-xs text-blue-100">
        MyShop - Full-stack e-commerce project (Next.js + Spring Boot)
      </p>
    </footer>
  );
}
