import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({ onSearch, initialValue = '', placeholder = 'Search textbooks, electronics, lab supplies, dorm essentials...' }) => {
  const [term, setTerm] = useState(initialValue);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(term);
  };

  const handleClear = () => {
    setTerm('');
    onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} style={{ position: 'relative', width: '100%', maxWidth: '640px' }}>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          background: '#FAFAF6',
          borderRadius: '9999px',
          padding: '4px',
          boxShadow: '0 2px 10px rgba(32, 35, 31, 0.05)',
          border: '1.5px solid #DDE3DA',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="search-bar-wrapper"
      >
        <div style={{ paddingLeft: '16px', display: 'flex', alignItems: 'center', color: '#747B72' }}>
          <Search size={18} />
        </div>
        <input
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            padding: '0.8rem 0.75rem',
            fontSize: '0.95rem',
            fontFamily: 'inherit',
            color: '#20231F',
            backgroundColor: 'transparent',
            minWidth: 0,
          }}
        />
        {term && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              background: 'none',
              border: 'none',
              color: '#9DA69B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '6px',
              borderRadius: '50%',
              marginRight: '4px',
              transition: 'color 0.15s ease',
            }}
            title="Clear search"
          >
            <X size={17} />
          </button>
        )}
        <button
          type="submit"
          className="btn btn-primary btn-pill"
          style={{
            padding: '0.65rem 1.45rem',
            fontSize: '0.885rem',
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          Search
        </button>
      </div>

      <style>{`
        .search-bar-wrapper:focus-within {
          border-color: #20231F !important;
          background-color: #FFFFFF !important;
          box-shadow: 0 4px 18px rgba(32, 35, 31, 0.08) !important;
        }
      `}</style>
    </form>
  );
};

export default SearchBar;
