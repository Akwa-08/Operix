import { useState } from "react";

const AdminInventory: React.FC = () => {
  const [selected, setSelected] = useState("Products");

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelected(event.target.value);
  };

  return (
    <div className="p-6">
      {/* Dropdown */}
      <div className="mb-6">
        <label className="block mb-2 font-semibold text-lg">Inventory Type:</label>
        <select
          value={selected}
          onChange={handleChange}
          className="px-4 py-2 border rounded-md w-64"
        >
          <option value="Products">Products</option>
          <option value="Materials">Materials</option>
        </select>
      </div>

      {/* Display Content */}
      <div className="border p-6 rounded-md bg-white shadow">
        <h2 className="text-2xl font-bold">{selected}</h2>
      </div>
    </div>
  );
};

export default AdminInventory;
