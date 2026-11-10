import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Info } from 'lucide-react';
import { CAMPUS_LOCATIONS } from '../utils/constants';

// Custom SVG pin marker for Leaflet
const createCustomIcon = (color = '#20231F') => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `<div style="
      background-color: ${color};
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid white;
      box-shadow: 0 4px 14px rgba(32, 35, 31, 0.25);
    ">
      <div style="
        width: 10px;
        height: 10px;
        background: white;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

export default function LocationPickerMap({
  latitude,
  longitude,
  pickupLocation,
  onChange,
  disabled = false
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [selectedCoords, setSelectedCoords] = useState({
    lat: latitude ? parseFloat(latitude) : 13.1287, // Default NMIT Bengaluru
    lng: longitude ? parseFloat(longitude) : 77.5874
  });

  // Initialize or update map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialLat = latitude ? parseFloat(latitude) : 13.1287;
    const initialLng = longitude ? parseFloat(longitude) : 77.5874;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 15);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      const marker = L.marker([initialLat, initialLng], {
        icon: createCustomIcon('#20231F'),
        draggable: !disabled
      }).addTo(map);

      if (!disabled) {
        marker.on('dragend', (e) => {
          const { lat, lng } = e.target.getLatLng();
          const cleanLat = parseFloat(lat.toFixed(6));
          const cleanLng = parseFloat(lng.toFixed(6));
          setSelectedCoords({ lat: cleanLat, lng: cleanLng });
          onChange({
            latitude: cleanLat,
            longitude: cleanLng,
            pickupLocation: pickupLocation || ''
          });
        });

        map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          const cleanLat = parseFloat(lat.toFixed(6));
          const cleanLng = parseFloat(lng.toFixed(6));
          marker.setLatLng([cleanLat, cleanLng]);
          setSelectedCoords({ lat: cleanLat, lng: cleanLng });
          onChange({
            latitude: cleanLat,
            longitude: cleanLng,
            pickupLocation: pickupLocation || ''
          });
        });
      }

      mapInstanceRef.current = map;
      markerRef.current = marker;
    } else {
      const map = mapInstanceRef.current;
      const marker = markerRef.current;
      if (latitude && longitude) {
        const newLat = parseFloat(latitude);
        const newLng = parseFloat(longitude);
        marker.setLatLng([newLat, newLng]);
        map.setView([newLat, newLng], map.getZoom());
        setSelectedCoords({ lat: newLat, lng: newLng });
      }
    }

    return () => {
      // Keep instance intact across renders, let unmount cleanup
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handlePresetSelect = (preset) => {
    if (disabled) return;
    const cleanLat = parseFloat(preset.lat.toFixed(6));
    const cleanLng = parseFloat(preset.lng.toFixed(6));
    setSelectedCoords({ lat: cleanLat, lng: cleanLng });

    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([cleanLat, cleanLng]);
      mapInstanceRef.current.setView([cleanLat, cleanLng], 16);
    }

    onChange({
      latitude: cleanLat,
      longitude: cleanLng,
      pickupLocation: preset.name
    });
  };

  const handleUseCurrentLocation = () => {
    if (disabled || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const cleanLat = parseFloat(pos.coords.latitude.toFixed(6));
        const cleanLng = parseFloat(pos.coords.longitude.toFixed(6));
        setSelectedCoords({ lat: cleanLat, lng: cleanLng });

        if (mapInstanceRef.current && markerRef.current) {
          markerRef.current.setLatLng([cleanLat, cleanLng]);
          mapInstanceRef.current.setView([cleanLat, cleanLng], 16);
        }

        onChange({
          latitude: cleanLat,
          longitude: cleanLng,
          pickupLocation: pickupLocation || 'Current Location'
        });
      },
      (err) => {
        console.warn('Geolocation permission denied or unavailable:', err.message);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--charcoal)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <MapPin size={16} color="var(--muted-green)" />
          Pickup Location on Campus Map
        </label>
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={disabled}
          className="btn btn-sm btn-outline btn-pill"
          style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem' }}
          title="Use browser location (optional)"
        >
          <Navigation size={13} /> Use My Current Location
        </button>
      </div>

      {/* Preset Campus Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Presets:</span>
        {CAMPUS_LOCATIONS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => handlePresetSelect(preset)}
            disabled={disabled}
            style={{
              fontSize: '0.75rem',
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              border: '1px solid var(--border-subtle)',
              background: pickupLocation === preset.name ? 'var(--charcoal)' : 'var(--warm-white)',
              color: pickupLocation === preset.name ? '#ffffff' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: pickupLocation === preset.name ? 700 : 500,
              transition: 'var(--transition)'
            }}
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Interactive Map Box */}
      <div
        ref={mapContainerRef}
        style={{
          height: '240px',
          width: '100%',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
          zIndex: 0
        }}
      />

      {/* Coordinate & Landmark Inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'block', fontWeight: 600 }}>
            Latitude
          </label>
          <input
            type="number"
            step="0.000001"
            className="form-input"
            value={selectedCoords.lat}
            readOnly
            style={{ backgroundColor: 'var(--sage-light)', cursor: 'not-allowed', fontSize: '0.85rem' }}
          />
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'block', fontWeight: 600 }}>
            Longitude
          </label>
          <input
            type="number"
            step="0.000001"
            className="form-input"
            value={selectedCoords.lng}
            readOnly
            style={{ backgroundColor: 'var(--sage-light)', cursor: 'not-allowed', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      <div>
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--charcoal)', marginBottom: '0.3rem', display: 'block' }}>
          Safe Public Pickup Landmark <span style={{ color: 'var(--accent-orange)' }}>*</span>
        </label>
        <input
          type="text"
          className="form-input"
          placeholder="e.g. NMIT Main Gate, Library Foyer, Nescafe Canteen"
          value={pickupLocation || ''}
          onChange={(e) =>
            onChange({
              latitude: selectedCoords.lat,
              longitude: selectedCoords.lng,
              pickupLocation: e.target.value
            })
          }
          disabled={disabled}
          required
        />
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.5rem',
        padding: '0.75rem 1rem',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--sage-light)',
        border: '1px solid var(--border-subtle)',
        fontSize: '0.8rem',
        color: 'var(--charcoal)'
      }}>
        <Info size={16} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--muted-green)' }} />
        <span>
          <strong>Campus Safety:</strong> Choose well-lit, public areas like campus gates, department foyers, or student cafeterias. Never enter or publish private hostel room numbers.
        </span>
      </div>
    </div>
  );
}
