import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center text-sm text-slate-400 mb-6 overflow-x-auto whitespace-nowrap pb-2">
      <Link to="/" className="flex items-center hover:text-orange-500 transition-colors">
        <Home className="w-4 h-4 mr-1" />
        <span className="sr-only">Home</span>
      </Link>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-4 h-4 mx-2 flex-shrink-0 text-slate-600" />
          {item.path && index < items.length - 1 ? (
            <Link to={item.path} className="hover:text-orange-500 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-200 font-medium">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
