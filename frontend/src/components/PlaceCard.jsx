import React from 'react';
import { Link } from 'react-router-dom';

const PlaceCard = ({ name, id, yearId, onEdit, onDelete }) => (
  <div className="card" style={{ background: 'linear-gradient(135deg, var(--accent), var(--bg-secondary))' }}>
    <h2 className="metric-value">{name}</h2>
    <p className="metric-label">Place</p>
    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
      <Link to={`/place/${id}`} className="btn">
        View Details
      </Link>
      <button className="btn" onClick={() => onEdit(id, name)}>
        Edit
      </button>
      <button className="btn btn-danger" onClick={() => onDelete(id)}>
        Delete
      </button>
    </div>
  </div>
);

export default PlaceCard;
