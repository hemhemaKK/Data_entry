import React, { useRef, useEffect } from "react";

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title = "Confirm", message = "Are you sure?" }) => {

  const cancelBtnRef = useRef(null);
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen && cancelBtnRef.current) {
      setTimeout(() => {
        if (cancelBtnRef.current) cancelBtnRef.current.focus();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        if (document.activeElement === cancelBtnRef.current) {
          if (confirmBtnRef.current) confirmBtnRef.current.focus();
        } else {
          if (cancelBtnRef.current) cancelBtnRef.current.focus();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;
  return (
    <div className="modal-bg">
      <div className="modal-content" style={{ maxWidth: '400px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--text-primary)' }}>{title}</h2>
        <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button onClick={onClose} ref={cancelBtnRef} className="btn btn-secondary">
            Cancel
          </button>
          <button
            ref={confirmBtnRef}
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
