import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listingService } from '../services/listingService';
import ProductCard from '../components/ProductCard';
import CategoryFilter from '../components/CategoryFilter';
import SearchBar from '../components/SearchBar';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import SearchResultsMap from '../components/SearchResultsMap';
import { useToast } from '../context/ToastContext';
import { SORT_OPTIONS, CONDITIONS, CAMPUS_LOCATIONS, RADIUS_OPTIONS } from '../utils/constants';
import {
  SlidersHorizontal,
  RefreshCw,
  MapPin,
  Navigation,
  Map as MapIcon,
  IndianRupee,
  Layers,
  Sparkles,
  Compass,
  Filter
} from 'lucide-react';

const BrowsePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMap, setShowMap] = useState(false);

  // Filters state from query parameters or defaults
  const initialCategory = searchParams.get('category') || 'ALL';
  const initialSearch = searchParams.get('search') || '';
  const initialSort = searchParams.get('sort') || 'newest';
  const initialStatus = searchParams.get('status') || '';
  const initialCondition = searchParams.get('condition') || '';
  const initialMinPrice = searchParams.get('minPrice') || '';
  const initialMaxPrice = searchParams.get('maxPrice') || '';
  const initialRadius = searchParams.get('radiusKm') || '';
  const initialBuyerCampus = searchParams.get('campus') || '';

  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState(initialSearch);
  const [sort, setSort] = useState(initialSort);
  const [status, setStatus] = useState(initialStatus);
  const [condition, setCondition] = useState(initialCondition);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [radiusKm, setRadiusKm] = useState(initialRadius);
  const [selectedCampus, setSelectedCampus] = useState(initialBuyerCampus);

  // Buyer coordinates (optional)
  const [buyerCoords, setBuyerCoords] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);

  // Sync state when URL searchParams changes
  useEffect(() => {
    setCategory(searchParams.get('category') || 'ALL');
    setSearch(searchParams.get('search') || '');
    setSort(searchParams.get('sort') || 'newest');
    setStatus(searchParams.get('status') || '');
    setCondition(searchParams.get('condition') || '');
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
    setRadiusKm(searchParams.get('radiusKm') || '');
    setSelectedCampus(searchParams.get('campus') || '');
  }, [searchParams]);

  // Handle campus selection
  useEffect(() => {
    if (selectedCampus) {
      const match = CAMPUS_LOCATIONS.find((c) => c.name === selectedCampus);
      if (match) {
        setBuyerCoords({ lat: match.lat, lng: match.lng });
      }
    } else if (!geoLoading && !searchParams.get('lat')) {
      setBuyerCoords(null);
    }
  }, [selectedCampus]);

  // Fetch listings from backend
  const fetchListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        search,
        category,
        sort,
        status: status || undefined,
        conditionType: condition || undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      };

      if (buyerCoords && buyerCoords.lat && buyerCoords.lng) {
        params.buyerLat = buyerCoords.lat;
        params.buyerLng = buyerCoords.lng;
        if (radiusKm) {
          params.radiusKm = parseFloat(radiusKm);
        }
      }

      const data = await listingService.getListings(params);
      setListings(data || []);
    } catch (err) {
      console.error('Failed to load listings:', err);
      setError('Unable to load listings from server. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [category, search, sort, status, condition, minPrice, maxPrice, radiusKm, buyerCoords]);

  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'ALL') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    updateParam('category', newCat);
  };

  const handleSearchChange = (newSearch) => {
    setSearch(newSearch);
    updateParam('search', newSearch);
  };

  const handleCampusChange = (e) => {
    const val = e.target.value;
    setSelectedCampus(val);
    updateParam('campus', val);
  };

  const handleUseGeolocation = () => {
    if (!navigator.geolocation) {
      toast.warning('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: parseFloat(pos.coords.latitude.toFixed(6)),
          lng: parseFloat(pos.coords.longitude.toFixed(6)),
        };
        setBuyerCoords(coords);
        setSelectedCampus('My Location');
        setGeoLoading(false);
        toast.success('Current location detected!');
      },
      (err) => {
        console.warn('Geolocation denied or unavailable:', err.message);
        setGeoLoading(false);
        toast.info('Could not detect location. You can select a campus landmark from the dropdown.');
      },
      { timeout: 8000 }
    );
  };

  const handleResetFilters = () => {
    setCategory('ALL');
    setSearch('');
    setSort('newest');
    setStatus('');
    setCondition('');
    setMinPrice('');
    setMaxPrice('');
    setRadiusKm('');
    setSelectedCampus('');
    setBuyerCoords(null);
    setSearchParams({});
  };

  const hasActiveFilters = category !== 'ALL' || search || status || condition || minPrice || maxPrice || radiusKm || selectedCampus;

  return (
    <div className="page-enter" style={{ padding: '3rem 0 5rem 0', minHeight: '85vh', backgroundColor: 'var(--warm-white)' }}>
      <div className="container">
        {/* Header with Title & Map View Switcher */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', backgroundColor: 'var(--sage-light)', color: 'var(--charcoal)', padding: '4px 12px', borderRadius: 'var(--radius-pill)', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
                <Compass size={14} color="var(--muted-green)" /> Verified Student Exchange
              </div>
              <h1 style={{ fontSize: '2.5rem', margin: 0, letterSpacing: '-0.03em', color: 'var(--charcoal)', fontWeight: 800, lineHeight: 1.15 }}>
                Marketplace Catalog
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', margin: '0.45rem 0 0 0', maxWidth: '640px', lineHeight: 1.5 }}>
                Explore vetted textbooks, electronics, dorm essentials, and lab gear directly from verified students on campus.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowMap(!showMap)}
              className={`btn btn-pill ${showMap ? 'btn-primary' : 'btn-outline'}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 700,
                padding: '0.65rem 1.4rem',
                transition: 'all 0.2s ease',
              }}
            >
              <MapIcon size={17} />
              <span>{showMap ? 'Hide Campus Map' : 'View on Campus Map'}</span>
            </button>
          </div>

          {/* Quick Search */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <SearchBar
              onSearch={handleSearchChange}
              initialValue={search}
              placeholder="Search by title, author, course code, or description..."
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div style={{ marginBottom: '2rem' }}>
          <CategoryFilter
            selectedCategory={category}
            onSelectCategory={handleCategoryChange}
          />
        </div>

        {/* Optional Search Results Map */}
        {showMap && (
          <div style={{ marginBottom: '2rem', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)' }}>
            <SearchResultsMap
              listings={listings}
              buyerCoords={buyerCoords}
              onClose={() => setShowMap(false)}
            />
          </div>
        )}

        {/* Minimalist Filter Card */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            padding: '1.4rem 1.6rem',
            marginBottom: '2.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          {/* Row 1: Location & Proximity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap', paddingBottom: '1rem', borderBottom: '1px solid var(--sage-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--charcoal)', fontSize: '0.875rem', fontWeight: 700 }}>
              <MapPin size={16} color="var(--muted-green)" />
              <span>Buyer Landmark:</span>
            </div>

            <select
              value={selectedCampus}
              onChange={handleCampusChange}
              className="form-select"
              style={{ width: 'auto', padding: '0.45rem 2.25rem 0.45rem 0.85rem', fontSize: '0.875rem', borderRadius: 'var(--radius-sm)', borderColor: 'var(--border-subtle)', backgroundColor: 'var(--warm-white)' }}
            >
              <option value="">Any Landmark (All Campus)</option>
              {CAMPUS_LOCATIONS.map((loc) => (
                <option key={loc.name} value={loc.name}>
                  {loc.name}
                </option>
              ))}
              {selectedCampus === 'My Location' && (
                <option value="My Location">📍 Current Device Location</option>
              )}
            </select>

            <button
              type="button"
              onClick={handleUseGeolocation}
              disabled={geoLoading}
              className="btn btn-sm btn-outline btn-pill"
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.95rem' }}
              title="Use your device GPS (optional)"
            >
              <Navigation size={13} color="var(--charcoal)" />
              <span>{geoLoading ? 'Locating...' : 'Use My GPS'}</span>
            </button>

            {buyerCoords && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Radius:</span>
                <select
                  value={radiusKm}
                  onChange={(e) => {
                    setRadiusKm(e.target.value);
                    updateParam('radiusKm', e.target.value);
                  }}
                  className="form-select"
                  style={{ width: 'auto', padding: '0.4rem 2rem 0.4rem 0.75rem', fontSize: '0.85rem', borderRadius: 'var(--radius-sm)', borderColor: 'var(--border-subtle)', backgroundColor: 'var(--warm-white)' }}
                >
                  {RADIUS_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Row 2: Status, Condition, Price Range, Sort & Reset */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--charcoal)', fontSize: '0.85rem', fontWeight: 700 }}>
                <Filter size={15} color="var(--muted-green)" />
                <span>Filters:</span>
              </div>

              {/* Status */}
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  updateParam('status', e.target.value);
                }}
                className="form-select"
                style={{ width: 'auto', padding: '0.45rem 2.25rem 0.45rem 0.85rem', fontSize: '0.85rem', borderRadius: 'var(--radius-sm)', borderColor: 'var(--border-subtle)', backgroundColor: 'var(--warm-white)' }}
              >
                <option value="">All Statuses</option>
                <option value="AVAILABLE">Available Only</option>
                <option value="RESERVED">Reserved</option>
                <option value="SOLD">Sold Archive</option>
              </select>

              {/* Condition */}
              <select
                value={condition}
                onChange={(e) => {
                  setCondition(e.target.value);
                  updateParam('condition', e.target.value);
                }}
                className="form-select"
                style={{ width: 'auto', padding: '0.45rem 2.25rem 0.45rem 0.85rem', fontSize: '0.85rem', borderRadius: 'var(--radius-sm)', borderColor: 'var(--border-subtle)', backgroundColor: 'var(--warm-white)' }}
              >
                <option value="">All Conditions</option>
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Price Range */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>₹</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => {
                    setMinPrice(e.target.value);
                    updateParam('minPrice', e.target.value);
                  }}
                  className="form-input"
                  style={{ width: '85px', padding: '0.4rem 0.65rem', fontSize: '0.85rem', borderRadius: 'var(--radius-sm)', borderColor: 'var(--border-subtle)', backgroundColor: 'var(--warm-white)' }}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value);
                    updateParam('maxPrice', e.target.value);
                  }}
                  className="form-input"
                  style={{ width: '85px', padding: '0.4rem 0.65rem', fontSize: '0.85rem', borderRadius: 'var(--radius-sm)', borderColor: 'var(--border-subtle)', backgroundColor: 'var(--warm-white)' }}
                />
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="btn btn-sm btn-outline btn-pill"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-orange)', borderColor: 'rgba(229, 161, 91, 0.4)', fontSize: '0.8rem', background: 'rgba(229, 161, 91, 0.08)' }}
                >
                  <RefreshCw size={12} />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Sort:
              </span>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  updateParam('sort', e.target.value);
                }}
                className="form-select"
                style={{ width: 'auto', padding: '0.45rem 2.25rem 0.45rem 0.85rem', fontSize: '0.85rem', borderRadius: 'var(--radius-sm)', borderColor: 'var(--border-subtle)', backgroundColor: 'var(--warm-white)' }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Count Meta */}
        {!loading && !error && (
          <div style={{ marginBottom: '1.5rem', fontSize: '0.925rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              Showing <strong style={{ color: 'var(--charcoal)' }}>{listings.length}</strong> {listings.length === 1 ? 'item' : 'items'}
              {category !== 'ALL' && <span> in <strong style={{ color: 'var(--charcoal)' }}>{category.replace('_', ' ')}</strong></span>}
              {search && <span> matching "<strong>{search}</strong>"</span>}
              {buyerCoords && <span> near <strong style={{ color: 'var(--muted-green)' }}>{selectedCampus}</strong></span>}
            </div>
            {buyerCoords && (
              <span style={{ fontSize: '0.8rem', color: 'var(--charcoal)', fontWeight: 600, backgroundColor: 'var(--sage-light)', padding: '4px 10px', borderRadius: 'var(--radius-pill)' }}>
                * Straight-line distance calculated from {selectedCampus}
              </span>
            )}
          </div>
        )}

        {/* Listings Display Grid */}
        {loading ? (
          <div className="grid-listings stagger-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="skeleton-card">
                <div className="skeleton skeleton-img" />
                <div style={{ padding: '1.25rem' }}>
                  <div className="skeleton skeleton-text" style={{ width: '40%' }} />
                  <div className="skeleton skeleton-text" style={{ width: '85%', height: '22px' }} />
                  <div className="skeleton skeleton-text" style={{ width: '50%', height: '24px', marginTop: '12px' }} />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <EmptyState
            title="Connection Error"
            message={error}
            actionText="Try Again"
            onAction={fetchListings}
          />
        ) : listings.length === 0 ? (
          <EmptyState
            title="No matching listings found"
            message="No products match your current search terms, campus proximity, or category filter. Try widening the radius or clearing filters."
            actionText="Clear All Filters"
            onAction={handleResetFilters}
          />
        ) : (
          <div className="grid-listings stagger-grid">
            {listings.map((listing) => (
              <ProductCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowsePage;
