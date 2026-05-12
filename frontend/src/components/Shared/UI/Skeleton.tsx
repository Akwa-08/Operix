import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "rounded";
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = "", 
  variant = "rounded" 
}) => {
  const baseClass = "animate-pulse bg-gray-200";
  const variantClasses = {
    text: "h-3 w-full rounded",
    circular: "rounded-full",
    rectangular: "rounded-none",
    rounded: "rounded-xl",
  };

  return (
    <div className={`${baseClass} ${variantClasses[variant]} ${className}`} />
  );
};

export const SkeletonCard = () => (
  <div className="bg-white rounded-2xl p-6 border border-gray-100 space-y-4">
    <div className="flex justify-between items-center">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-8" />
    </div>
    <Skeleton className="h-8 w-32" />
    <Skeleton className="h-3 w-48" />
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="w-full space-y-4">
    <div className="flex gap-4 px-4 py-3 bg-gray-50 rounded-xl">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="flex gap-4 px-4 py-4 border-b border-gray-50">
        {[1, 2, 3, 4].map((j) => (
          <Skeleton key={j} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonForm = () => (
  <div className="bg-white rounded-2xl p-8 space-y-10">
    <div className="flex items-center gap-6">
      <Skeleton variant="circular" className="w-24 h-24" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonMessages = () => (
  <div className="h-full flex flex-col space-y-4 p-4">
    <div className="flex justify-start">
      <Skeleton className="h-20 w-64 rounded-2xl rounded-tl-none" />
    </div>
    <div className="flex justify-end">
      <Skeleton className="h-12 w-48 rounded-2xl rounded-tr-none bg-cyan-100" />
    </div>
    <div className="flex justify-start">
      <Skeleton className="h-32 w-80 rounded-2xl rounded-tl-none" />
    </div>
    <div className="flex justify-end">
      <Skeleton className="h-16 w-56 rounded-2xl rounded-tr-none bg-cyan-100" />
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-8 animate-in fade-in duration-500">
    <div className="space-y-2">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <Skeleton className="h-64 rounded-2xl" />
      </div>
      <div className="lg:col-span-2">
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  </div>
);
