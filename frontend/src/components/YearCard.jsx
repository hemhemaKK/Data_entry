import React from 'react';
import { useNavigate } from 'react-router-dom';

const YearCard = ({ year, id, onEdit, onDelete }) => {
  const navigate = useNavigate();
  return (
    <div 
      className="card" 
      style={{ background: 'linear-gradient(135deg, var(--accent), var(--bg-secondary))', cursor: 'pointer' }}
      onClick={() => navigate(`/year/${id}`)}
    >
      <h2 className="metric-value">{year}</h2>
      <p className="metric-label">Year</p>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <button className="btn" onClick={(e) => { e.stopPropagation(); onEdit(id, year); }}>
          Edit
        </button>
      </div>
    </div>
  );
};

export default YearCard;
