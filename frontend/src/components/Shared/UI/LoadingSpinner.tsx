interface LoadingSpinnerProps {
  message?: string;
  /** Wraps in a full-viewport centered container. Default: true */
  fullPage?: boolean;
  className?: string;
  /** Type of skeleton to show. Default: 'dashboard' */
  type?: "dashboard" | "table" | "form" | "messages" | "spinner";
}

import {
  DashboardSkeleton,
  SkeletonTable,
  SkeletonForm,
  SkeletonMessages,
} from "./Skeleton";

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  fullPage = true,
  className = "",
  type = "dashboard",
}) => {
  if (!fullPage || type === "spinner") {
    return (
      <div
        className={`flex flex-col items-center justify-center p-8 gap-4 ${className}`}>
        <div className="w-10 h-10 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin"></div>
        {message && (
          <p className="text-xs text-gray-400 font-medium animate-pulse">
            {message}
          </p>
        )}
      </div>
    );
  }

  const renderSkeleton = () => {
    switch (type) {
      case "table":
        return <SkeletonTable />;
      case "form":
        return <SkeletonForm />;
      case "messages":
        return <SkeletonMessages />;
      default:
        return <DashboardSkeleton />;
    }
  };

  return (
    <div
      className={`max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500 ${className}`}>
      {renderSkeleton()}
    </div>
  );
};
