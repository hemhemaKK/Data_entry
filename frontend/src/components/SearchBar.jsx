import React from "react";
import { FaSearch } from "react-icons/fa";

const SearchBar = ({ value, onChange, placeholder }) => (
  <div className="search-bar">
    <FaSearch className="search-bar-icon" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="search-bar-input"
    />
    {value && (
      <button className="search-bar-clear" onClick={() => onChange("")} title="Clear">
        ✕
      </button>
    )}
  </div>
);

export default SearchBar;
