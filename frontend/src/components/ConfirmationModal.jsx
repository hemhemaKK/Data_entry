import React from "react";

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title = "Confirm", message = "Are you sure?" }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-bg fixed inset-0 flex items-center justify-center z-50">
      <div className="modal-content bg-glass backdrop-blur-md p-6 rounded-xl shadow-lg max-w-sm w-full">
        <h2 className="text-xl font-semibold mb-4 text-white">{title}</h2>
        <p className="mb-6 text-gray-200">{message}</p>
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="btn btn-danger"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
