import { useState } from "react";

export default function AddItemModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    item_type_id: "",
    item_variant: "",
    stock: "",
    stock_unit_id: "",
    supplier_id: "",
    status: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdd = async () => {
    await fetch("http://localhost:5000/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    onSaved();
    onClose();
  };

  return (
    <div style={{ padding: 20, background: "#eee", border: "1px solid #aaa" }}>
      <h2>Add Item</h2>

      {Object.keys(form).map((key) => (
        <input
          key={key}
          name={key}
          placeholder={key}
          value={form[key]}
          onChange={handleChange}
          style={{ display: "block", marginBottom: "10px" }}
        />
      ))}

      <button onClick={handleAdd}>Save</button>
      <button onClick={onClose} style={{ marginLeft: "10px" }}>
        Cancel
      </button>
    </div>
  );
}
