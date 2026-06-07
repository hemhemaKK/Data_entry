import React from "react";
import { FaPlus } from "react-icons/fa";

/**
 * Card that triggers the client creation modal.
 * Props:
 *   - onClick: function to open the client form modal
 */
const AddClientCard = ({ onClick }) => (
  <div
    className="client-card bg-glass backdrop-blur-md p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer flex items-center justify-center text-center"
    onClick={onClick}
  >
    <div className="text-white">
      <FaPlus className="text-3xl mx-auto mb-2" />
      <p className="font-medium">Add Client</p>
    </div>
  </div>
);

export default AddClientCard;
