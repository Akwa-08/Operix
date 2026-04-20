interface LoadingSpinnerProps {
  message?: string;
  /** Wraps spinner in a full-width centered container with vertical padding. Default: true */
  fullPage?: boolean;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  fullPage = true,
  className = "",
}) => {
  const spinner = (
    <>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600" />
      {message && <p className="ml-4 text-base text-gray-500">{message}</p>}
    </>
  );

  if (!fullPage) return <div className={`flex items-center ${className}`}>{spinner}</div>;

  return (
    <div className={`max-w-7xl mx-auto flex items-center justify-center py-20 ${className}`}>
      {spinner}
    </div>
  );
};
