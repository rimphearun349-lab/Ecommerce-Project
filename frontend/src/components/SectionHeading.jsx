import Link from "next/link";
import { ChevronRight } from "@/components/Icons";

// "Featured <Products>" with the highlighted word in the brand color and an optional "View all" link.
export default function SectionHeading({ title, highlight, href }) {
  return (
    <div className="mb-5 flex items-end justify-between border-b border-slate-200">
      <h2 className="-mb-px border-b-2 border-blue-600 pb-2 text-lg font-semibold">
        {title} <span className="text-blue-600">{highlight}</span>
      </h2>
      {href && (
        <Link href={href} className="mb-2 flex items-center gap-0.5 text-sm font-medium text-slate-600 hover:text-blue-600">
          View all <ChevronRight />
        </Link>
      )}
    </div>
  );
}
