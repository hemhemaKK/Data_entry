import React, { useState, useEffect, useRef } from "react";

/**
 * FlowerFormModal – simple modal to add or edit a flower name.
 * Only field: Name.
 */
const FlowerFormModal = ({ isOpen, onClose, onSubmit, initialData = null, clientName = "", globalFlowers = [] }) => {
  const [name, setName] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
    } else {
      setName("");
    }
  }, [initialData, isOpen]);

  const nameRef = useRef(null);
  const saveBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen && nameRef.current) {
      setTimeout(() => {
        if (nameRef.current) nameRef.current.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleEnterKey = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef && nextRef.current) {
        nextRef.current.focus();
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Flower name is required");
      return;
    }
    
    const names = name.split(/[\n,]+/).map(s => s.trim()).filter(s => s);
    if (names.length === 0) return;
    
    if (initialData?.id && names.length > 1) {
      alert("You can only edit one flower name at a time.");
      return;
    }
    
    if (initialData?.id) {
      onSubmit({ name: names[0] });
    } else {
      onSubmit({ names });
    }
    
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
            <label className="modal-label">Flower Name(s) - Comma Separated</label>
            <input
              type="text"
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => handleEnterKey(e, saveBtnRef)}
              className="modal-input"
              placeholder="e.g., Rose, Jasmine, Lily"
              required
            />
          </div>
          
          {!initialData?.id && globalFlowers.length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                Quick Add: Click to append
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '100px', overflowY: 'auto', padding: '0.25rem' }}>
                {globalFlowers.map((gf, idx) => (
                  <span 
                    key={idx}
                    onClick={() => setName(prev => prev ? prev + ', ' + gf : gf)}
                    style={{ padding: '0.25rem 0.6rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '16px', fontSize: '0.8rem', cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  >
                    {gf}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" ref={saveBtnRef} className="btn focus-ring">
              {initialData?.id ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FlowerFormModal;
