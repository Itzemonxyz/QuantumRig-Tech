import React from 'react';

export default function TakaIcon({ className, strokeWidth = 2, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M7 6h11M11 6v10.5a3.5 3.5 0 0 0 7 0M11 11.5c-3 0-5 2-5 4s2 4 5 4" />
    </svg>
  );
}
