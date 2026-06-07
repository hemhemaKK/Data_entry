import React, { useState, useEffect } from "react";

/**
 * FlowerFormModal – simple modal to add or edit a flower name.
 * Only field: Name.
 */
const FlowerFormModal = ({ isOpen, onClose, onSubmit, initialData = null, clientName = "" }) => {
  const [name, setName] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
    } else {
      setName("");
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Flower name is required");
      return;
    }
    onSubmit({ name: name.trim() });
    setName("");
    onClose();
  };

  return (
    <div className="modal-bg fixed inset-0 flex items-center justify-center z-50">
      <div className="modal-content max-w-sm w-full mx-4">
        <h2 className="modal-title">
          {initialData?.id ? "Edit Flower" : "Add Flower"}
        </h2>
        {clientName && (
          <p className="modal-subtitle">
            for <span className="modal-highlight">{clientName}</span>
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label className="modal-label">Flower Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="modal-input"
              placeholder="e.g., Rose, Jasmine, Lily"
              autoFocus
              required
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn">
              {initialData?.id ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FlowerFormModal;
