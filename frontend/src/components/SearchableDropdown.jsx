import React, { useState, useRef, useEffect } from 'react';

const SearchableDropdown = ({ options, value, onChange, placeholder, disabled, onKeyDown, inputRef }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (isOpen) return; // Do not overwrite what the user is typing while the dropdown is open!
    const opt = options.find(o => o.id.toString() === value.toString());
    if (opt) {
      setSearchTerm(opt.name);
    } else {
      setSearchTerm('');
    }
  }, [value, options, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        const opt = options.find(o => o.id.toString() === value.toString());
        setSearchTerm(opt ? opt.name : '');
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef, value, options]);

  const currentSelectedOpt = options.find(o => o.id.toString() === value.toString());
  const isSearchTermPristine = currentSelectedOpt && searchTerm === currentSelectedOpt.name;

  const matchOption = (opt, term) => {
    if (!term || !term.trim()) return true;
    const termClean = term.toLowerCase().trim();
    const nameClean = (opt.name || '').toLowerCase();
    const searchKey = ((opt.name || '') + ' ' + (opt.contact_number || '') + ' ' + (opt.searchKey || '')).toLowerCase();
    
    // 1. Direct substring check
    if (searchKey.includes(termClean) || nameClean.includes(termClean)) return true;
    
    // 2. Acronym / Cleaned substring check (strips periods, hyphens, spaces, parens)
    const strip = (s) => (s || '').replace(/[\.\-\(\)\s]+/g, '');
    if (strip(searchKey).includes(strip(termClean))) return true;
    
    // 3. Multi-word check: all words in search term must appear anywhere in option
    const words = termClean.split(/\s+/).filter(Boolean);
    if (words.length > 1 && words.every(w => searchKey.includes(w) || strip(searchKey).includes(strip(w)))) {
      return true;
    }
    
    return false;
  };

  const getScore = (opt, term) => {
    if (!term || !term.trim()) return 0;
    if (opt.id === 'ADD_NEW') return -1000;
    const termClean = term.toLowerCase().trim();
    const nameClean = (opt.name || '').toLowerCase().trim();
    const strip = (s) => (s || '').replace(/[\.\-\(\)\s]+/g, '');
    const nameStrip = strip(nameClean);
    const termStrip = strip(termClean);

    // 1. Exact match (highest priority)
    if (nameClean === termClean || nameStrip === termStrip) return 100;
    
    // 2. Starts with search term (e.g., typing "kk" matching "KKI")
    if (nameClean.startsWith(termClean) || nameStrip.startsWith(termStrip)) return 80;

    // 3. Any word in the name starts with search term (e.g., "Sri KKI" matching "kk")
    const words = nameClean.split(/[\s\-\.\(\)]+/).filter(Boolean);
    if (words.some(w => w.startsWith(termClean))) return 70;

    // 4. Acronym match (e.g., typing "mvr" matching "M. V. R.")
    const acronym = words.map(w => w[0]).join('');
    if (acronym.startsWith(termClean)) return 60;

    // 5. Contains match (e.g., typing "kk" matching "KANNAKURUKKAI")
    if (nameClean.includes(termClean) || nameStrip.includes(termStrip)) return 20;

    return 10;
  };

  const filteredOptions = isSearchTermPristine 
    ? options 
    : options
        .filter(opt => matchOption(opt, searchTerm))
        .sort((a, b) => {
          if (a.id === 'ADD_NEW') return 1;
          if (b.id === 'ADD_NEW') return -1;
          const scoreA = getScore(a, searchTerm);
          const scoreB = getScore(b, searchTerm);
          if (scoreB !== scoreA) return scoreB - scoreA;
          // If scores are tied, prefer shorter name length (more exact/concise match)
          const lenDiff = (a.name || '').length - (b.name || '').length;
          if (lenDiff !== 0) return lenDiff;
          // Finally, sort alphabetically
          return (a.name || '').localeCompare(b.name || '');
        });

  // Reset active index when search changes, OR set to currently selected item if pristine
  useEffect(() => {
    if (isOpen) {
      if (isSearchTermPristine && currentSelectedOpt) {
        const idx = options.findIndex(o => o.id.toString() === currentSelectedOpt.id.toString());
        setActiveIndex(idx >= 0 ? idx : 0);
      } else {
        setActiveIndex(0);
      }
    }
  }, [searchTerm, isOpen, isSearchTermPristine, currentSelectedOpt ? currentSelectedOpt.id : null]);

  const handleSelect = (id) => {
    onChange({ target: { value: id } });
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', flex: 1 }}>
      <input
        ref={inputRef}
        type="text"
        className="input"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
        }}
        onClick={(e) => {
          setIsOpen(true);
          setTimeout(() => {
            if (e.target) e.target.select();
          }, 0);
        }}
        onFocus={(e) => {
          if (!value) setIsOpen(true);
          setTimeout(() => {
            if (e.target) e.target.select();
          }, 0);
        }}
        onKeyDown={(e) => {
           if (e.key === 'Tab' && e.shiftKey) {
               setIsOpen(false);
               return; // Allow native shift-tab navigation
           }
           
           if (e.key === 'Enter' || e.key === 'Tab') {
              e.preventDefault();
              
              if (isOpen && filteredOptions.length > 0 && searchTerm.trim() !== '') {
                  // They are making a valid selection
                  const selectedId = filteredOptions[activeIndex].id;
                  handleSelect(selectedId);
                  if (onKeyDown) setTimeout(() => onKeyDown(e), 0);
              } else if (!isOpen && value) {
                  // Dropdown is not open and we already have a valid selection!
                  // Just keep the same selection and move to the next field!
                  if (onKeyDown) setTimeout(() => onKeyDown(e), 0);
              } else {
                  // Invalid or empty selection
                  // Do NOT go to the next field. Just revert to the last valid value.
                  setIsOpen(false);
                  const opt = options.find(o => o.id.toString() === value.toString());
                  setSearchTerm(opt ? opt.name : '');
              }
              return;
           }

           if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
               if (!isOpen) {
                   setIsOpen(true);
                   return;
               }
               e.preventDefault();
               if (e.key === 'ArrowDown') {
                   setActiveIndex(prev => (prev + 1) % (filteredOptions.length || 1));
               } else {
                   setActiveIndex(prev => (prev - 1 + (filteredOptions.length || 1)) % (filteredOptions.length || 1));
               }
               return;
           }
        }}
        disabled={disabled}
        style={{ width: '100%', padding: '0.5rem', fontSize: '1.2rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'white', color: 'black' }}
      />
      {isOpen && !disabled && (
        <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000, background: 'white', border: '1px solid var(--border)', borderRadius: '4px', maxHeight: '250px', overflowY: 'auto', listStyle: 'none', padding: 0, margin: 0, boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
          {filteredOptions.length === 0 ? (
            <li style={{ padding: '0.75rem', color: 'gray' }}>No options found</li>
          ) : (
            filteredOptions.map((opt, idx) => (
              <li 
                key={idx} 
                onClick={() => handleSelect(opt.id)}
                style={{ 
                  padding: '0.75rem', 
                  cursor: 'pointer', 
                  color: opt.id === 'ADD_NEW' ? 'blue' : 'black', 
                  fontWeight: opt.id === 'ADD_NEW' ? 'bold' : 'normal', 
                  borderBottom: '1px solid #eee',
                  background: activeIndex === idx ? '#e6f7ff' : 'white'
                }}
                onMouseEnter={() => setActiveIndex(idx)}
              >
                {opt.name}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default SearchableDropdown;
