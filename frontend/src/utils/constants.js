export const CATEGORIES = [
  { value: 'ALL', label: 'All Items' },
  { value: 'BOOKS', label: 'Books' },
  { value: 'ELECTRONICS', label: 'Electronics' },
  { value: 'LAB_SUPPLIES', label: 'Lab Supplies' },
  { value: 'STATIONERY', label: 'Stationery' },
  { value: 'FURNITURE', label: 'Furniture' },
  { value: 'CLOTHING', label: 'Clothing' },
  { value: 'OTHER', label: 'Other' },
];

export const CONDITIONS = [
  'Brand New',
  'Like New',
  'Very Good',
  'Good',
  'Fair / Acceptable',
];

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'distance', label: '📍 Nearest to Me' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

export const RADIUS_OPTIONS = [
  { value: '', label: 'Any Distance' },
  { value: '1', label: 'Within 1 km' },
  { value: '3', label: 'Within 3 km' },
  { value: '5', label: 'Within 5 km' },
  { value: '10', label: 'Within 10 km' },
];

export const CAMPUS_LOCATIONS = [
  { name: 'NMIT Main Campus (Yelahanka)', lat: 13.1287, lng: 77.5873 },
  { name: 'Yelahanka Satellite Town', lat: 13.1007, lng: 77.5963 },
  { name: 'Hebbal Flyover / Outer Ring Rd', lat: 13.0358, lng: 77.5970 },
  { name: 'Reva University Campus (Kattigenahalli)', lat: 13.1137, lng: 77.6346 },
  { name: 'MS Ramaiah Institute of Technology', lat: 13.0317, lng: 77.5645 },
  { name: 'IISc Bengaluru (Mathikere Gate)', lat: 13.0219, lng: 77.5671 },
  { name: 'Bengaluru Central / MG Road', lat: 12.9756, lng: 77.6066 },
];

export const CATEGORY_PLACEHOLDERS = {
  BOOKS: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
  ELECTRONICS: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop&q=80',
  LAB_SUPPLIES: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80',
  STATIONERY: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&auto=format&fit=crop&q=80',
  FURNITURE: 'https://images.unsplash.com/photo-1580481077195-c3a8a30f71c9?w=800&auto=format&fit=crop&q=80',
  CLOTHING: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
  OTHER: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
};

export const DEFAULT_PLACEHOLDER_IMAGE = CATEGORY_PLACEHOLDERS.BOOKS;

export const getCategoryPlaceholder = (category) => {
  if (!category) return CATEGORY_PLACEHOLDERS.OTHER;
  const key = category.toUpperCase();
  return CATEGORY_PLACEHOLDERS[key] || CATEGORY_PLACEHOLDERS.OTHER;
};

// Clean and extract direct image URLs from common web sources
export const getBackendOrigin = () => {
  const raw = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:8080' : '');
  return raw.replace(/\/+$/, '').replace(/\/api$/, '');
};

export const sanitizeImageUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let url = rawUrl.trim();

  // Strip enclosing quotes if copied from code/markup
  if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
    url = url.slice(1, -1).trim();
  }

  // Handle data URLs (base64) and blob URLs directly
  if (url.startsWith('data:image/') || url.startsWith('blob:')) {
    return url;
  }

  const backendOrigin = getBackendOrigin();

  // Resolve backend uploaded images relative path to full backend URL
  if (url.startsWith('/uploads/') || url.startsWith('uploads/') || url.startsWith('/api/uploads/') || url.startsWith('api/uploads/')) {
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return backendOrigin ? `${backendOrigin}${cleanPath}` : cleanPath;
  }

  // If stored in database with localhost:8080/uploads/ but we are in production
  if (url.includes('localhost:8080/uploads/') && backendOrigin && !backendOrigin.includes('localhost:8080')) {
    return url.replace(/^https?:\/\/localhost:8080/, backendOrigin);
  }

  // Google Image search result page (extract actual target image URL)
  if (url.includes('google.') && (url.includes('imgurl=') || url.includes('imgrefurl='))) {
    try {
      const match = url.match(/[?&]imgurl=([^&]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    } catch {
      // keep original on parse error
    }
  }

  // Google Drive share link -> direct embeddable view URL
  if (url.includes('drive.google.com') && url.includes('/file/d/')) {
    const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      return `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`;
    }
  }

  // Dropbox link -> direct raw download URL
  if (url.includes('dropbox.com')) {
    if (url.includes('?dl=0')) {
      return url.replace('?dl=0', '?raw=1');
    }
    if (!url.includes('raw=1')) {
      return url.includes('?') ? `${url}&raw=1` : `${url}?raw=1`;
    }
  }

  // Ensure Cloudinary URLs use secure HTTPS protocol to avoid mixed content blocking
  if (url.startsWith('http://res.cloudinary.com/')) {
    return url.replace('http://', 'https://');
  }

  return url;
};

// Helpful curated presets sellers can quickly pick for their listings
export const PRESET_IMAGES = [
  { label: 'Computer Science & Code', category: 'BOOKS', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80' },
  { label: 'Math & Engineering Text', category: 'BOOKS', url: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=800&auto=format&fit=crop&q=80' },
  { label: 'Science / Chemistry Book', category: 'BOOKS', url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80' },
  { label: 'Laptop / Tablet Device', category: 'ELECTRONICS', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80' },
  { label: 'Scientific Calculator', category: 'ELECTRONICS', url: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=800&auto=format&fit=crop&q=80' },
  { label: 'Notebooks & Stationery', category: 'STATIONERY', url: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&auto=format&fit=crop&q=80' },
];
