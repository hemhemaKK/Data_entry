import React from 'react';
import { useNavigate } from 'react-router-dom';

const PlaceCard = ({ name, id, yearId, onEdit, onDelete }) => {
  const navigate = useNavigate();
  return (
    <div 
      className="card" 
      style={{ background: 'linear-gradient(135deg, var(--accent), var(--bg-secondary))', cursor: 'pointer' }}
      onClick={() => navigate(`/place/${id}`)}
    >
      <h2 className="metric-value">{name}</h2>
      <p className="metric-label">Group</p>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <button className="btn" onClick={(e) => { e.stopPropagation(); onEdit(id, name); }}>
          Edit
        </button>
        <button className="btn btn-danger" onClick={(e) => { e.stopPropagation(); onDelete(id); }}>
          Delete
        </button>
      </div>
    </div>
  );
};

export default PlaceCard;
