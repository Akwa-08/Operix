import React from "react";

export const KpiCard = ({
  title,
  value,
  icon,
  iconColor,
  accent,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  iconColor: string;
  accent?: string;
}) => (
  <div
    className={`bg-white rounded-xl border border-gray-200 p-3 md:p-4 shadow-sm flex items-center gap-3 transition-transform hover:-translate-y-0.5 hover:shadow-md ${accent || ""}`}
  >
    <div className={`p-2 rounded-lg bg-gray-50 ${iconColor}`}>{icon}</div>
    <div>
      <p className="text-xl md:text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 leading-tight">{title}</p>
    </div>
  </div>
);
