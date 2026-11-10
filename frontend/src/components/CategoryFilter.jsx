import React from 'react';
import { CATEGORIES } from '../utils/constants';
import {
  Grid,
  BookOpen,
  Laptop,
  FlaskConical,
  PenTool,
  Armchair,
  Shirt,
  MoreHorizontal
} from 'lucide-react';

const categoryIcons = {
  ALL: Grid,
  BOOKS: BookOpen,
  ELECTRONICS: Laptop,
  LAB_SUPPLIES: FlaskConical,
  STATIONERY: PenTool,
  FURNITURE: Armchair,
  CLOTHING: Shirt,
  OTHER: MoreHorizontal,
};

const CategoryFilter = ({ selectedCategory, onSelectCategory }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        overflowX: 'auto',
        padding: '0.5rem 0.25rem 0.85rem 0.25rem',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
      className="category-filter-scroll"
    >
      {CATEGORIES.map((cat) => {
        const Icon = categoryIcons[cat.value] || Grid;
        const isSelected = selectedCategory === cat.value;

        return (
          <button
            key={cat.value}
            type="button"
            onClick={() => onSelectCategory(cat.value)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.55rem 1.15rem',
              borderRadius: '9999px',
              fontSize: '0.885rem',
              fontWeight: isSelected ? 700 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              border: isSelected ? '1px solid #20231F' : '1px solid #DDE3DA',
              backgroundColor: isSelected ? '#20231F' : '#FAFAF6',
              color: isSelected ? '#FFFFFF' : '#747B72',
              boxShadow: isSelected ? '0 2px 8px rgba(32, 35, 31, 0.15)' : 'none',
              transform: isSelected ? 'translateY(-1px)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <Icon size={15} color={isSelected ? '#DCE7DC' : '#747B72'} />
            <span>{cat.label}</span>
          </button>
        );
      })}

      <style>{`
        .category-filter-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default CategoryFilter;
