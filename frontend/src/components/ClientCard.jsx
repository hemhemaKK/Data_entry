import React, { useState } from "react";
import { FaEdit, FaTrashAlt, FaEye } from "react-icons/fa";

/**
 * ClientCard – displays client info with Edit, Delete, and View Details buttons.
 * Props:
 *   - client: { id, name, contact_number }
 *   - onEdit, onDelete: callbacks
 *   - onViewDetails: () => void – opens the flower detail view for this client
 */
const ClientCard = ({ client, onEdit, onDelete, onViewDetails }) => {
  return (
    <div className="client-card" style={{ cursor: 'pointer' }} onClick={onViewDetails}>
      <div className="client-card-header">
        <div className="client-card-title">
          <h3 className="client-card-name">{client.name}</h3>
          {client.contact_number && (
            <p className="client-card-contact">{client.contact_number}</p>
          )}
        </div>
        <div className="client-card-actions">
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="icon-btn" title="Edit">
            <FaEdit />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="icon-btn icon-btn-danger" title="Delete">
            <FaTrashAlt />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientCard;
