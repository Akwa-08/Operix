// src/components/Shared/Inventory/DeliveryDetailsModal.tsx

import { Modal } from "../UI/Modal";
import type { Delivery } from "../../../Types";
import { getDeliveryStatusColor } from "../../../util/formatters";
import {
  Package,
  Truck,
  User,
  Calendar,
  ClipboardList,
  Hash,
  MessageSquare,
  CheckCircle,
  RotateCcw,
} from "lucide-react";

interface DeliveryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: Delivery;
}

const Field = ({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) => (
  <div>
    <p className="text-xs text-gray-500 font-semibold uppercase mb-1 flex items-center gap-1">
      {icon}
      {label}
    </p>
    <p className="text-sm text-gray-900 font-semibold">{value || "—"}</p>
  </div>
);

export const DeliveryDetailsModal: React.FC<DeliveryDetailsModalProps> = ({
  isOpen,
  onClose,
  delivery,
}) => {
  const statusLabel = delivery.status.replace("_", " ");
  const statusColor = getDeliveryStatusColor(delivery.status);
  const isReceived = ["received", "completed"].includes(delivery.status);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delivery Details" size="lg">
      <div className="space-y-5">

        {/* Header — Material + Status */}
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{delivery.materialName}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{delivery.materialUnit}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase capitalize ${statusColor}`}>
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Quantity summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Qty Requested</p>
            <p className="text-2xl font-bold text-gray-900">{delivery.requestedQuantity}</p>
            <p className="text-xs text-gray-500 mt-0.5">{delivery.materialUnit}</p>
          </div>
          <div className={`border rounded-lg p-4 text-center ${isReceived ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
            <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Qty Received</p>
            <p className={`text-2xl font-bold ${isReceived ? "text-green-700" : "text-gray-400"}`}>
              {delivery.receivedQuantity || "—"}
            </p>
            {isReceived && <p className="text-xs text-green-600 mt-0.5">{delivery.materialUnit}</p>}
          </div>
        </div>

        {/* Supplier & Logistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
          <Field label="Supplier" value={delivery.supplierName} icon={<Truck size={12} />} />
          <Field label="Requested By" value={delivery.requestedByName} icon={<User size={12} />} />
          <Field label="Date Requested" value={delivery.createdAt} icon={<Calendar size={12} />} />
          <Field label="Expected Arrival" value={delivery.expectedArrivalDate} icon={<Calendar size={12} />} />
        </div>

        {/* Receipt info — only meaningful when received/completed */}
        {(delivery.receivedDate || delivery.receiptReferenceNumber) && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-green-800 flex items-center gap-2">
              <CheckCircle size={16} />
              Receipt Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Date Received"
                value={delivery.receivedDate}
                icon={<Calendar size={12} />}
              />
              <Field
                label="Receipt Reference #"
                value={delivery.receiptReferenceNumber}
                icon={<Hash size={12} />}
              />
            </div>
          </div>
        )}

        {/* Returned info */}
        {delivery.status === "returned" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <RotateCcw size={20} className="text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-800">Returned / Faulty</p>
              <p className="text-xs text-red-600 mt-0.5">This delivery was marked as returned. Inventory was not restocked.</p>
            </div>
          </div>
        )}

        {/* Notes */}
        {delivery.notes && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-yellow-700 uppercase mb-1 flex items-center gap-1">
              <MessageSquare size={12} />
              Notes
            </p>
            <p className="text-sm text-gray-800">{delivery.notes}</p>
          </div>
        )}

        {/* Delivery ID for reference */}
        <div className="flex items-center gap-1 text-xs text-gray-400 pt-1">
          <ClipboardList size={12} />
          <span>Delivery ID: <span className="font-mono">{delivery.id}</span></span>
        </div>

      </div>
    </Modal>
  );
};
