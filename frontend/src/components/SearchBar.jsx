"use client";

import { SearchIcon } from "@/components/Icons";

export default function SearchBar({ value, onChange, placeholder = "Search products...", className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label="Search"
        className="w-full rounded-lg border border-transparent bg-blue-50 py-2.5 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
      />
    </div>
  );
}
