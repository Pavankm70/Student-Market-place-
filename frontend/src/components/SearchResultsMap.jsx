import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapPin } from 'lucide-react';

const createItemMarkerIcon = (isReserved = false) => {
  const bg = isReserved ? '#E5A15B' : '#20231F';
  return L.divIcon({
    className: 'custom-search-marker',
    html: `<div style="
      background-color: ${bg};
      width: 28px;
      height: 28px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
      box-shadow: 0 3px 10px rgba(32, 35, 31, 0.25);
    ">
      <div style="
        width: 8px;
        height: 8px;
        background: white;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28]
  });
};

const createBuyerMarkerIcon = () => {
  return L.divIcon({
    className: 'custom-buyer-marker',
    html: `<div style="
      background-color: #788B76;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 0 3px rgba(120, 139, 118, 0.4), 0 4px 12px rgba(32, 35, 31, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="width: 6px; height: 6px; background: white; border-radius: 50%;"></div>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

export default function SearchResultsMap({
  listings = [],
  buyerCoords = null,
  onClose
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Center on buyer coords or first listing or NMIT
    const defaultLat = buyerCoords?.lat || (listings[0]?.latitude) || 13.1287;
    const defaultLng = buyerCoords?.lng || (listings[0]?.longitude) || 77.5874;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 14);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      const markersGroup = L.featureGroup().addTo(map);
      mapInstanceRef.current = map;
      markersGroupRef.current = markersGroup;
    }

    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    markersGroup.clearLayers();

    const bounds = [];

    // Add Buyer Marker if set
    if (buyerCoords && buyerCoords.lat && buyerCoords.lng) {
      const buyerMarker = L.marker([buyerCoords.lat, buyerCoords.lng], {
        icon: createBuyerMarkerIcon()
      }).addTo(markersGroup);

      buyerMarker.bindPopup(`
        <div style="font-family: inherit; font-size: 0.85rem; padding: 2px;">
          <strong>Your Selected Location</strong>
        </div>
      `);
      bounds.push([buyerCoords.lat, buyerCoords.lng]);
    }

    // Add Listing Markers
    listings.forEach((item) => {
      if (item.latitude && item.longitude) {
        const marker = L.marker([item.latitude, item.longitude], {
          icon: createItemMarkerIcon(item.status === 'RESERVED')
        }).addTo(markersGroup);

        const imgTag = item.imageUrl
          ? `<img src="${item.imageUrl}" alt="${item.title}" style="width:100%; height:90px; object-fit:cover; border-radius:6px; margin-bottom:6px;" />`
          : '';

        const distanceTag = item.distanceKm !== null && item.distanceKm !== undefined
          ? `<div style="font-size:0.75rem; color:#788B76; font-weight:600; margin-bottom:4px;">~${item.distanceKm} km (approx straight-line)</div>`
          : '';

        const statusTag = item.status === 'RESERVED'
          ? `<span style="background:#EDF2EB; color:#E5A15B; font-size:0.7rem; font-weight:700; padding:2px 6px; border-radius:4px; margin-left:4px; border:1px solid #DDE3DA;">RESERVED</span>`
          : '';

        marker.bindPopup(`
          <div style="font-family: inherit; width: 180px; padding: 2px;">
            ${imgTag}
            <div style="font-weight: 700; font-size: 0.9rem; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #20231F;">
              ${item.title}
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <span style="font-size:0.95rem; font-weight:800; color:#20231F;">₹${item.price}</span>
              ${statusTag}
            </div>
            ${distanceTag}
            <div style="font-size: 0.75rem; color: #747B72; margin-bottom: 8px;">
              📍 ${item.pickupLocation || 'Campus Meeting Point'}
            </div>
            <a href="/listings/${item.id}" style="
              display: block;
              text-align: center;
              background: #20231F;
              color: white;
              padding: 6px 8px;
              border-radius: 9999px;
              font-size: 0.8rem;
              font-weight: 600;
              text-decoration: none;
            ">View Product</a>
          </div>
        `);

        bounds.push([item.latitude, item.longitude]);
      }
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 16 });
    }

    return () => {
      // maintain map
    };
  }, [listings, buyerCoords]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{
      background: 'var(--warm-white)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-subtle)',
      padding: '1.25rem',
      marginBottom: '1.5rem',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapPin size={18} color="var(--muted-green)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--charcoal)', margin: 0 }}>
            Campus Map: Nearby Product Listings
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            ({listings.filter(l => l.latitude && l.longitude).length} located items)
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-outline btn-pill"
            style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem' }}
          >
            Hide Map
          </button>
        )}
      </div>

      <div
        ref={mapContainerRef}
        style={{
          height: '320px',
          width: '100%',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
          zIndex: 0
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <span>📍 Click pins to preview items. Dark pins = Available, Amber = Reserved, Green circle = Your location.</span>
        <span>Straight-line approximate distance shown.</span>
      </div>
    </div>
  );
}
