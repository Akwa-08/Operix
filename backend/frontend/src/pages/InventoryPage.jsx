import { useState, useEffect } from "react";
import InventoryTable from "../components/InventoryTable";
import AddItemModal from "../components/AddItemModal";
import EditItemModal from "../components/EditItemModal";

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const loadInventory = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/inventory");
      const data = await res.json();
      setInventory(data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch inventory:", err);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Inventory</h1>

      <button onClick={() => setShowAddModal(true)}>+ Add Item</button>

      <InventoryTable items={inventory} onEdit={(item) => setEditingItem(item)} />

      {showAddModal && (
        <AddItemModal
          onClose={() => setShowAddModal(false)}
          onSaved={loadInventory}
        />
      )}

      {editingItem && (
        <EditItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSaved={loadInventory}
        />
      )}
    </div>
  );
}
