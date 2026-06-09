import React, { useState, useEffect, useRef } from "react";
import { FaTimes } from "react-icons/fa";

const RecordFormModal = ({ isOpen, onClose, onSubmit, initialData, flowerId }) => {
  const [formData, setFormData] = useState({
    date: "",
    weight: "",
    van: "",
    rate: "",
    laggage: "",
    collie: ""
  });

  const dateRef = useRef(null);
  const vanRef = useRef(null);
  const weightRef = useRef(null);
  const rateRef = useRef(null);
  const laggageRef = useRef(null);
  const collieRef = useRef(null);
  const saveBtnRef = useRef(null);

  const handleEnterKey = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef && nextRef.current) {
        nextRef.current.focus();
      }
    }
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        date: initialData.date || "",
        weight: initialData.weight || "",
        van: initialData.van || "",
        rate: initialData.rate || "",
        laggage: initialData.laggage || "",
        collie: initialData.collie || ""
      });
    } else {
      setFormData({ date: "", weight: "", van: "", rate: "", laggage: "", collie: "" });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      flower_id: flowerId,
      date: formData.date ? formData.date : null,
      weight: formData.weight !== "" ? parseFloat(formData.weight) : null,
      van: formData.van || null,
      rate: formData.rate !== "" ? parseFloat(formData.rate) : null,
      laggage: formData.laggage !== "" ? parseFloat(formData.laggage) : 0,
      collie: formData.collie !== "" ? parseFloat(formData.collie) : 0
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h2>{initialData ? "Edit Record" : "Add Record"}</h2>
          <button className="icon-btn" onClick={onClose}><FaTimes /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Date</label>
            <input type="date" name="date" className="form-control" value={formData.date} onChange={handleChange} onKeyDown={(e) => handleEnterKey(e, vanRef)} ref={dateRef} required />
          </div>
          <div className="form-group">
            <label>Van</label>
            <input type="text" name="van" className="form-control" value={formData.van} onChange={handleChange} onKeyDown={(e) => handleEnterKey(e, weightRef)} ref={vanRef} />
          </div>
          <div className="form-group">
            <label>Weight (kg)</label>
            <input type="number" step="0.01" name="weight" className="form-control" value={formData.weight} onChange={handleChange} onKeyDown={(e) => handleEnterKey(e, rateRef)} ref={weightRef} />
          </div>
          <div className="form-group">
            <label>Rate ()</label>
            <input type="number" step="0.01" name="rate" className="form-control" value={formData.rate} onChange={handleChange} onKeyDown={(e) => handleEnterKey(e, laggageRef)} ref={rateRef} />
          </div>
          <div className="form-group">
            <label>Laggage ()</label>
            <input type="number" step="0.01" name="laggage" className="form-control" value={formData.laggage} onChange={handleChange} onKeyDown={(e) => handleEnterKey(e, collieRef)} ref={laggageRef} />
          </div>
          <div className="form-group">
            <label>Collie ()</label>
            <input type="number" step="0.01" name="collie" className="form-control" value={formData.collie} onChange={handleChange} onKeyDown={(e) => handleEnterKey(e, saveBtnRef)} ref={collieRef} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" ref={saveBtnRef}>Save Record</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordFormModal;
