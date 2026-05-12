import { LayoutGrid, LayoutList } from "lucide-react";

interface ViewToggleProps {
  mode: "list" | "cards";
  onChange: (mode: "list" | "cards") => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ mode, onChange }) => (
  <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
    <button
      onClick={() => onChange("list")}
      title="List view"
      className={`p-2 rounded-md transition-all ${mode === "list" ? "bg-white shadow-sm text-cyan-600" : "text-gray-500 hover:text-gray-700"}`}
    >
      <LayoutList size={18} />
    </button>
    <button
      onClick={() => onChange("cards")}
      title="Card view"
      className={`p-2 rounded-md transition-all ${mode === "cards" ? "bg-white shadow-sm text-cyan-600" : "text-gray-500 hover:text-gray-700"}`}
    >
      <LayoutGrid size={18} />
    </button>
  </div>
);
