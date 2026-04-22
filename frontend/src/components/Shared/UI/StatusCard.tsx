interface StatusCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor?: string;
  trend?: string;
  trendUp?: boolean;
  className?: string;
  isCurrency?: boolean;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  value,
  icon,
  iconColor = 'text-cyan-600',
  trend,
  trendUp,
  className = '',
  isCurrency,
}) => {
  const showCurrency = isCurrency !== undefined 
    ? isCurrency 
    : (typeof value === 'number' && !title.toLowerCase().includes('total') && !title.toLowerCase().includes('count'));
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 md:p-6 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600 font-medium">{title}</p>
        <div className={iconColor}>{icon}</div>
      </div>
      <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
        {showCurrency
          ? `₱${Number(value).toLocaleString()}`
          : typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {trend && (
        <p
          className={`text-xs font-semibold ${
            trendUp ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {trend}
        </p>
      )}
    </div>
  );
};
