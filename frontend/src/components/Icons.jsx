// Small inline SVG icons (no extra package needed). Size/color follow the surrounding text.
const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export const SearchIcon = (props) => (
  <svg {...base} {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const CartIcon = (props) => (
  <svg {...base} {...props}>
    <circle cx="9" cy="20" r="1.4" />
    <circle cx="18" cy="20" r="1.4" />
    <path d="M2 3h3l2.7 12.4a1 1 0 0 0 1 .8h8.7a1 1 0 0 0 1-.8L20 8H6" />
  </svg>
);

export const UserIcon = (props) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);

export const ChevronRight = (props) => (
  <svg {...base} width={16} height={16} {...props}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);
