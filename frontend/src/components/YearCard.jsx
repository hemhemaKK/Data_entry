import React from 'react';
import { Link } from 'react-router-dom';

const YearCard = ({ year, id, onEdit, onDelete }) => (
  <div className="card" style={{ background: 'linear-gradient(135deg, var(--accent), var(--bg-secondary))' }}>
    <h2 className="metric-value">{year}</h2>
    <p className="metric-label">Year</p>
    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
      <Link to={`/year/${id}`} className="btn">
        View Details
      </Link>
      <button className="btn" onClick={() => onEdit(id, year)}>
        Edit
      </button>
      <button className="btn btn-danger" onClick={() => onDelete(id)}>
        Delete
      </button>
    </div>
  </div>
);

export default YearCard;
