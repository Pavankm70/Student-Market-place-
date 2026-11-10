import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapPin, ExternalLink, Navigation, Compass } from 'lucide-react';

const createPinIcon = () => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `<div style="
      background-color: #20231F;
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

export default function ListingDetailMap({
  latitude,
  longitude,
  pickupLocation,
  distanceKm,
  buyerLocation
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const hasCoords = latitude !== null && latitude !== undefined &&
                    longitude !== null && longitude !== undefined;

  const latNum = hasCoords ? parseFloat(latitude) : null;
  const lngNum = hasCoords ? parseFloat(longitude) : null;

  useEffect(() => {
    if (!hasCoords || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([latNum, lngNum], 15);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      const marker = L.marker([latNum, lngNum], {
        icon: createPinIcon()
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 0.85rem; padding: 2px;">
          <strong>Pickup Point:</strong><br/>
          ${pickupLocation || 'Designated Campus Meeting Point'}
        </div>
      `);

      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView([latNum, lngNum], 15);
    }

    return () => {
      // unmount cleanup
    };
  }, [latNum, lngNum, hasCoords, pickupLocation]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const directionsUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${latNum},${lngNum}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pickupLocation || 'NMIT Bengaluru')}`;

  return (
    <div style={{
      background: 'var(--warm-white)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-subtle)',
      padding: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.85rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--charcoal)' }}>
            <MapPin size={18} color="var(--muted-green)" />
            Safe Campus Pickup Location
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {pickupLocation || 'Specified campus landmark'}
          </p>
        </div>

        {distanceKm !== null && distanceKm !== undefined && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.75rem',
            background: 'var(--sage-light)',
            color: 'var(--charcoal)',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: 700,
            border: '1px solid var(--border-subtle)'
          }}>
            <Navigation size={14} color="var(--muted-green)" />
            ~{distanceKm} km away
          </div>
        )}
      </div>

      {hasCoords ? (
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
      ) : (
        <div style={{
          height: '140px',
          background: 'var(--sage-light)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          color: 'var(--text-muted)',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <Compass size={24} color="var(--muted-green)" />
          <span style={{ fontSize: '0.85rem' }}>
            Exact map coordinates not provided for this listing. Please meet at the designated public landmark: <strong>{pickupLocation || 'Campus Meeting Area'}</strong>.
          </span>
        </div>
      )}

      {distanceKm !== null && distanceKm !== undefined && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          * Calculated as straight-line approximate distance from your selected campus location. Actual walking or driving route may differ.
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline btn-sm btn-pill"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
        >
          <ExternalLink size={14} /> Get Directions on Google Maps
        </a>
      </div>
    </div>
  );
}
