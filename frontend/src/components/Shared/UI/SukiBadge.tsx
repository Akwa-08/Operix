import React from "react";
import { Crown } from "lucide-react";

interface SukiBadgeProps {
  size?: "sm" | "md";
}

export const SukiBadge: React.FC<SukiBadgeProps> = ({ size = "md" }) => (
  <div
    className={`flex items-center gap-1 bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-md shadow-sm border border-amber-200/50 flex-shrink-0 ${
      size === "sm" ? "px-1 py-0" : "px-2 py-0.5"
    }`}
  >
    <Crown size={size === "sm" ? 8 : 10} fill="currentColor" />
    <span
      className={`${
        size === "sm" ? "text-[8px]" : "text-[10px]"
      } font-black uppercase tracking-tight`}
    >
      Suki
    </span>
  </div>
);
