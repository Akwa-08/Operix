import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Save, Minus, Plus } from 'lucide-react';
import { useOrdersData } from '../../hooks/useSupabase';

interface ExcessMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  onConfirm: (excessUsage: Record<string, number>) => void;
}

export const ExcessMaterialModal: React.FC<ExcessMaterialModalProps> = ({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  onConfirm
}) => {
  const { getOrderBOM } = useOrdersData();
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<any[]>([]);
  const [excessValues, setExcessValues] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isOpen && orderId) {
      loadBOM();
    }
  }, [isOpen, orderId]);

  const loadBOM = async () => {
    setLoading(true);
    try {
      const data = await getOrderBOM(orderId);
      setMaterials(data);
      // Initialize excess values
      const initial: Record<string, number> = {};
      data.forEach((m: any) => {
        initial[m.inventory_item_id] = 0;
      });
      setExcessValues(initial);
    } catch (err) {
      console.error("Failed to load BOM:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateExcess = (id: string, delta: number) => {
    setExcessValues(prev => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] scale-in-center">
        {/* Header */}
        <div className="bg-cyan-600 px-6 py-4 flex items-center justify-between text-white">
          <div>
            <h3 className="text-xl font-bold">Production Completion</h3>
            <p className="text-cyan-100 text-xs">Recording material usage for {orderNumber}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 mb-6">
            <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">Excess Material Usage</p>
              <p>Please record any materials used beyond the standard requirement (e.g., due to misprints or errors).</p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
              <p className="text-gray-500 text-sm animate-pulse">Fetching material list...</p>
            </div>
          ) : materials.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 italic">No bill of materials found for this order.</p>
              <p className="text-xs text-gray-400 mt-1">Standard inventory will not be deducted.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {materials.map((m) => (
                <div key={m.inventory_item_id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-gray-900">{m.material_name}</p>
                      <p className="text-xs text-gray-500">Standard: {m.total_standard_usage} {m.unit}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-gray-700">Excess Usage:</span>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleUpdateExcess(m.inventory_item_id, -1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:border-cyan-500 hover:text-cyan-600 transition-colors shadow-sm"
                      >
                        <Minus size={14} />
                      </button>
                      <div className="w-16 text-center">
                        <input 
                          type="number"
                          value={excessValues[m.inventory_item_id]}
                          onChange={(e) => setExcessValues(prev => ({...prev, [m.inventory_item_id]: Math.max(0, parseFloat(e.target.value) || 0)}))}
                          className="w-full text-center font-bold text-cyan-600 focus:outline-none bg-transparent"
                        />
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{m.unit}</p>
                      </div>
                      <button 
                        onClick={() => handleUpdateExcess(m.inventory_item_id, 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:border-cyan-500 hover:text-cyan-600 transition-colors shadow-sm"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(excessValues)}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 transition-all shadow-md shadow-cyan-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <Save size={18} />
            Confirm & Ready
          </button>
        </div>
      </div>
    </div>
  );
};
