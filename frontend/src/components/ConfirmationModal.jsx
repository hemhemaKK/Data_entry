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
    <div className="modal-bg fixed inset-0 flex items-center justify-center z-50">
      <div className="modal-content bg-glass backdrop-blur-md p-6 rounded-xl shadow-lg max-w-sm w-full">
        <h2 className="text-xl font-semibold mb-4 text-white">{title}</h2>
        <p className="mb-6 text-gray-200">{message}</p>
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} ref={cancelBtnRef} className="btn btn-secondary focus-ring">
            Cancel
          </button>
          <button
            ref={confirmBtnRef}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="btn btn-danger focus-ring"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
