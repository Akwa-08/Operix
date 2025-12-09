import { useEffect, useState } from "react";
import AddItemModal from "./components/AddItemModel";
import EditItemModal from "./components/EditItemModel";
import "./App.css"; // You'll create this for styling

export default function App() {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);

  const [selectedType, setSelectedType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Fetch inventory
  const fetchInventory = async () => {
    const res = await fetch("http://localhost:5000/api/inventory");
    const data = await res.json();
    setInventory(data);
    setFilteredInventory(data);
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Filter logic
  useEffect(() => {
    let list = [...inventory];

    if (selectedType) {
      list = list.filter((i) => i.item_type === selectedType);
    }

    if (selectedStatus) {
      list = list.filter((i) => i.status === selectedStatus);
    }

    setFilteredInventory(list);
  }, [selectedType, selectedStatus, inventory]);

  // Delete handler
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;

    await fetch(`http://localhost:5000/api/inventory/${id}`, {
      method: "DELETE",
    });

    fetchInventory();
  };

  // Dashboard stats
  const stats = {
    total: inventory.length,
    available: inventory.filter((i) => i.status === "Available").length,
    low: inventory.filter((i) => i.status === "Low Stock").length,
    restocking: inventory.filter((i) => i.status === "Restocking").length,
    phasedOut: inventory.filter((i) => i.status === "Phased Out").length,
  };

  // Unique types for dropdown
  const itemTypes = [...new Set(inventory.map((i) => i.item_type))];

  return (
    <div className="app-container">

      {/* Dashboard Cards */}
      <div className="dashboard">
        <div className="dashboard-card total">Total Materials: {stats.total}</div>
        <div className="dashboard-card available">Available: {stats.available}</div>
        <div className="dashboard-card low">Low Stock: {stats.low}</div>
        <div className="dashboard-card restocking">Restocking: {stats.restocking}</div>
        <div className="dashboard-card phased">Phased Out: {stats.phasedOut}</div>
      </div>

      {/* Filters + Add Button */}
      <div className="top-bar">
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="filter-select"
        >
          <option value="">Filter by Type</option>
          {itemTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="filter-select"
        >
          <option value="">Filter by Status</option>
          <option value="Available">Available</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Restocking">Restocking</option>
          <option value="Phased Out">Phased Out</option>
        </select>

        <button className="add-btn" onClick={() => setShowAdd(true)}>
          + Add Item
        </button>
      </div>

      {/* Inventory Table */}
      <div className="table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Item Type</th>
              <th>Item Variant</th>
              <th>Usable Stocks</th>
              <th>Stock Unit</th>
              <th>Purchase QTY</th>
              <th>Purchase Unit</th>
              <th>Supplier</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredInventory.map((item) => (
              <tr key={item.id}>
                <td>{item.item_type}</td>
                <td>{item.item_variant}</td>
                <td>{item.stock}</td>
                <td>{item.stock_unit_id}</td>
                <td>{item.purchase_qty}</td>
                <td>{item.purchase_unit}</td>
                <td>{item.supplier_id}</td>

                <td>
                  <span className={`status-tag status-${item.status.toLowerCase().replace(" ", "")}`}>
                    {item.status}
                  </span>
                </td>

                <td className="actions">
                  <button className="edit-btn" onClick={() => setEditItem(item)}>✏</button>
                  <button className="delete-btn" onClick={() => handleDelete(item.id)}>🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showAdd && (
        <AddItemModal
          onClose={() => setShowAdd(false)}
          onSaved={fetchInventory}
        />
      )}

      {editItem && (
        <EditItemModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSaved={fetchInventory}
        />
      )}
    </div>
  );
}
