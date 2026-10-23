import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";

export const metadata = {
  title: "MyShop",
  description: "Full-stack e-commerce (Next.js + Spring Boot)",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Kantumruy Pro supports Khmer + Latin. If it cannot load, the font stack in globals.css is used. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased">
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
