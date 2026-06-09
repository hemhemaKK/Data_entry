import React, { useState, useEffect, useRef } from 'react';

export default function GlobalConfirmModal() {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    message: '',
    resolve: null
  });

  useEffect(() => {
    // Expose a global async confirm function
    window.confirmAsync = (message) => {
      return new Promise((resolve) => {
        setConfirmState({
          isOpen: true,
          message,
          resolve
        });
      });
    };
  const cancelBtnRef = useRef(null);
  const confirmBtnRef = useRef(null);

  const handleKeyDown = (e, targetRef) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      if (targetRef && targetRef.current) {
        targetRef.current.focus();
      }
    }
  };

  useEffect(() => {
    if (confirmState.isOpen && cancelBtnRef.current) {
      setTimeout(() => {
        if (cancelBtnRef.current) cancelBtnRef.current.focus();
      }, 50);
    }
  }, [confirmState.isOpen]);

  if (!confirmState.isOpen) return null;

  const handleAction = (result) => {
    if (confirmState.resolve) {
      confirmState.resolve(result);
    }
    setConfirmState({ isOpen: false, message: '', resolve: null });
  };

  return (
    <div 
      style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)', zIndex: 10000 
      }}
    >
      <div 
        className="fade-in" 
        style={{ 
          maxWidth: '400px', width: '90%', backgroundColor: '#ffffff', 
          padding: '24px', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', 
          textAlign: 'center', border: '1px solid rgba(0,0,0,0.1)' 
        }}
      >
        <h3 style={{ marginTop: 0, color: '#333333', fontSize: '1.25rem', fontWeight: 'bold' }}>
          Confirmation Required
        </h3>
        <p style={{ margin: '20px 0', fontSize: '16px', color: '#000000', whiteSpace: 'pre-wrap' }}>
          {confirmState.message}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <button 
            ref={cancelBtnRef}
            onKeyDown={(e) => handleKeyDown(e, confirmBtnRef)}
            style={{ 
              flex: 1, backgroundColor: '#e2e8f0', color: '#0f172a', 
              border: 'none', padding: '10px', borderRadius: '6px', 
              fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' 
            }} 
            onClick={() => handleAction(false)}
          >
            Cancel
          </button>
          <button 
            ref={confirmBtnRef}
            onKeyDown={(e) => handleKeyDown(e, cancelBtnRef)}
            style={{ 
              flex: 1, backgroundColor: '#ef4444', color: '#ffffff', 
              border: 'none', padding: '10px', borderRadius: '6px', 
              fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' 
            }} 
            onClick={() => handleAction(true)}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
