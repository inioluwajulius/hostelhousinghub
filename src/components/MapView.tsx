import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface MapViewProps {
  properties: any[];
  center?: [number, number];
  onMarkerClick?: (propertyId: string) => void;
}

const formatPrice = (amount: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(amount);

const MapView = ({ properties, center = [6.5244, 3.3792], onMarkerClick }: MapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(mapRef.current).setView(center, 14);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const bounds: L.LatLngExpression[] = [];

    properties.forEach((p) => {
      const lat = p.latitude || p.universities?.latitude;
      const lng = p.longitude || p.universities?.longitude;
      if (!lat || !lng) return;

      const price = p.lowestPrice || p.rooms?.[0]?.price_per_session || 0;
      const marker = L.marker([lat, lng]).addTo(map);
      marker.bindPopup(`
        <div style="min-width:180px">
          <strong>${p.title}</strong><br/>
          <span style="color:#666;font-size:12px">${p.address}</span><br/>
          ${price > 0 ? `<strong style="color:#2d6a4f">${formatPrice(price)}</strong><span style="font-size:11px">/session</span>` : ""}
        </div>
      `);

      if (onMarkerClick) {
        marker.on("click", () => onMarkerClick(p.id));
      }

      bounds.push([lat, lng]);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [40, 40], maxZoom: 15 });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [properties, center]);

  return <div ref={mapRef} className="w-full h-full rounded-xl" style={{ minHeight: 400 }} />;
};

export default MapView;
