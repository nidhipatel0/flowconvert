'use client';

interface CategoryLabelProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function CategoryLabel({ children, icon }: CategoryLabelProps) {
  return (
    <h3 className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase mb-3">
      {icon && <span className="text-teal-400">{icon}</span>}
      <span className="bg-gradient-to-r from-teal-400 to-teal-300 bg-clip-text text-transparent">
        {children}
      </span>
    </h3>
  );
}
