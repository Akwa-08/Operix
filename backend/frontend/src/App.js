import React, { useEffect, useState } from "react";

function App() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch inventory from backend API
    const fetchInventory = async () => {
      try {
        const response = await fetch("/api/inventory");
        const data = await response.json();
        setInventory(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching inventory:", err);
        setLoading(false);
      }
    };

    fetchInventory();

    // Optional: Poll every 10 seconds for live updates
    const interval = setInterval(fetchInventory, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <p>Loading inventory...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Inventory</h1>
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>ID</th>
            <th>Item Type</th>
            <th>Item Variant</th>
            <th>Stock</th>
            <th>Stock Unit</th>
            <th>Supplier</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.item_type}</td>
              <td>{item.item_variant}</td>
              <td>{item.stock}</td>
              <td>{item.stock_unit}</td>
              <td>{item.supplier}</td>
              <td>{item.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
