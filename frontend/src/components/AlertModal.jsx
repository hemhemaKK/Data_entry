import React, { useState, useEffect } from 'react';

export default function AlertModal() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Override window.alert
    const originalAlert = window.alert;
    window.alert = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  if (messages.length === 0) return null;

  return (
    <div 
      style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)', zIndex: 9999 
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
        <h3 style={{ marginTop: 0, color: '#ff4444', fontSize: '1.25rem', fontWeight: 'bold' }}>
          {messages[0].toLowerCase().includes('already') ? 'Duplicate Entry Detected' : 'Alert'}
        </h3>
        <p style={{ margin: '20px 0', fontSize: '16px', color: '#000000' }}>{messages[0]}</p>
        <button 
          style={{ 
            width: '100%', backgroundColor: '#ff4444', color: '#ffffff', 
            border: 'none', padding: '10px', borderRadius: '6px', 
            fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' 
          }}
          onClick={() => setMessages(prev => prev.slice(1))}
        >
          Okay
        </button>
      </div>
    </div>
  );
}
