import React, { useState, useEffect } from "react";

// Modal form for creating or editing a client (user) under a place
const ClientFormModal = ({ isOpen, onClose, onSubmit, initialData = null }) => {
  const [name, setName] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setContactNumber(initialData.contact_number || "");
    } else {
      setName("");
      setContactNumber("");
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Name is required");
      return;
    }
    onSubmit({ name: name.trim(), contactNumber: contactNumber.trim() });
    setName("");
    setContactNumber("");
    onClose();
  };

  return (
    <div className="modal-bg fixed inset-0 flex items-center justify-center z-50">
      <div className="modal-content max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          {initialData?.name ? "Edit Party" : "Add New Client"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="modal-input"
              placeholder="Client name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              Contact Number
            </label>
            <input
              type="text"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              className="modal-input"
              placeholder="Contact number (optional)"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn">
              {initialData?.name ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientFormModal;
