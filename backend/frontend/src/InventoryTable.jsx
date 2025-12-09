import React, { useState } from "react";

function InventoryTable({ inventory, onAdd, onEdit }) {
  return (
    <div>
      <button
        onClick={onAdd}
        style={{
          padding: "10px 15px",
          background: "green",
          color: "white",
          border: "none",
          borderRadius: "5px",
          marginBottom: "15px",
          cursor: "pointer",
        }}
      >
        + Add New Item
      </button>

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
            <th>Edit</th>
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

              <td>
                <button
                  onClick={() => onEdit(item)}
                  style={{
                    padding: "5px 10px",
                    background: "blue",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default InventoryTable;
