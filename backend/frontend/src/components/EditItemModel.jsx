import { useState } from "react";

export default function EditItemModal({ item, onClose, onSaved }) {
  const [form, setForm] = useState(item);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    await fetch(`http://localhost:5000/api/inventory/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    onSaved();
    onClose();
  };

  return (
    <div style={{ padding: 20, background: "#eee", border: "1px solid #aaa" }}>
      <h2>Edit Item {item.id}</h2>

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

      <button onClick={handleSave}>Update</button>
      <button onClick={onClose} style={{ marginLeft: "10px" }}>
        Cancel
      </button>
    </div>
  );
}
