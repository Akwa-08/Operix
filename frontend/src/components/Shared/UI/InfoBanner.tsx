interface InfoBannerProps {
  /** Accent color: purple, orange, blue, cyan, green, red */
  color?: "purple" | "orange" | "blue" | "cyan" | "green" | "red";
  children: React.ReactNode;
  className?: string;
}

const COLORS: Record<string, { bg: string; border: string; text: string }> = {
  purple: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-900" },
  orange: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-900" },
  blue:   { bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-900"   },
  cyan:   { bg: "bg-cyan-50",   border: "border-cyan-200",   text: "text-cyan-900"   },
  green:  { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-900"  },
  red:    { bg: "bg-red-50",    border: "border-red-200",     text: "text-red-900"    },
};

export const InfoBanner: React.FC<InfoBannerProps> = ({ color = "blue", children, className = "" }) => {
  const c = COLORS[color];
  return (
    <div className={`${c.bg} border ${c.border} rounded-lg p-4 mb-6 ${className}`}>
      <p className={`text-sm ${c.text} font-medium`}>{children}</p>
    </div>
  );
};
