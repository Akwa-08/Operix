interface KpiCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  iconBg?: string;
  iconColor: string;
  accent?: "red" | "green" | "yellow" | "blue" | "none";
  onClick?: () => void;
}

const ACCENT_BORDERS: Record<string, string> = {
  red:    "border-l-4 border-l-red-400",
  green:  "border-l-4 border-l-green-400",
  yellow: "border-l-4 border-l-amber-400",
  blue:   "border-l-4 border-l-cyan-400",
  none:   "",
};

export const KpiCard: React.FC<KpiCardProps> = ({
  title, value, sub, icon, iconBg = "bg-gray-100", iconColor, accent = "none", onClick,
}) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-xl border border-gray-200 p-4 shadow-sm transition-all ${onClick ? 'cursor-pointer hover:shadow-md active:scale-95' : ''} ${ACCENT_BORDERS[accent]}`}
  >
    <div className="flex items-start justify-between mb-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-tight">{title}</p>
      <div className={`p-2 rounded-lg ${iconBg} ${iconColor}`}>{icon}</div>
    </div>
    <p className="text-2xl font-bold text-gray-900 mb-0.5 truncate">{value}</p>
    {sub && <p className="text-xs text-gray-400">{sub}</p>}
  </div>
);
