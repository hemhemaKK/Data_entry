import React from 'react';
import { useNavigate } from 'react-router-dom';

const PlaceCard = ({ name, id, yearId, onEdit, onDelete }) => {
  const navigate = useNavigate();
  return (
    <div 
      className="card" 
      style={{ 
        background: 'var(--bg-secondary)', 
        borderLeft: '4px solid var(--accent)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.25rem'
      }}
      onClick={() => navigate(`/place/${id}`)}
    >
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0', wordBreak: 'break-word', lineHeight: '1.3' }}>{name}</h2>
        <p className="metric-label" style={{ marginTop: '0.25rem' }}>Group</p>
      </div>
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
