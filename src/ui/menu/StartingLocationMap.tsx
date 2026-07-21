import { MapContainer, CircleMarker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { REGION_COORDINATES } from "../../content/westeros/mapCoordinates";
import { REGIONS } from "../../content/westeros/regions";
import { QuartermaesterTileLayer } from "../map/QuartermaesterTileLayer";

import { useState } from "react";

function MapClickLogger() {
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  useMapEvents({
    click(e) {
      setCoords(e.latlng);
    },
  });
  
  if (!coords) return null;
  return (
    <div style={{
      position: 'absolute',
      bottom: 20,
      left: 20,
      zIndex: 1000,
      background: 'white',
      padding: '10px',
      color: 'black',
      fontWeight: 'bold',
      borderRadius: '4px',
      boxShadow: '0 0 10px rgba(0,0,0,0.5)'
    }}>
      Toạ độ: [{coords.lat.toFixed(2)}, {coords.lng.toFixed(2)}]
    </div>
  );
}

interface Props {
  selectedLocation: string;
  onSelect: (regionId: string) => void;
}

export function StartingLocationMap({ selectedLocation, onSelect }: Props) {
  return (
    <div className="w-full h-[400px] border border-[var(--glass-border)] rounded overflow-hidden">
      <MapContainer
        center={[30, -120]}
        zoom={3}
        style={{ width: "100%", height: "100%", background: "#0a1016" }}
        maxBounds={[[-90, -180], [90, 180]]}
      >
        <QuartermaesterTileLayer />
        <MapClickLogger />
        {REGIONS.map((region) => {
          const coords = REGION_COORDINATES[region.id];
          if (!coords) return null;
          
          const isSelected = selectedLocation === region.id;

          return (
            <CircleMarker
              key={region.id}
              center={coords}
              radius={isSelected ? 10 : 6}
              pathOptions={{
                color: isSelected ? "#eab308" : "#aaaaaa",
                fillColor: isSelected ? "#eab308" : "#444444",
                fillOpacity: isSelected ? 0.8 : 0.4,
                weight: isSelected ? 3 : 1
              }}
              eventHandlers={{
                click: () => onSelect(region.id)
              }}
            >
              <Popup>
                <div className="text-center font-bold text-sm">{region.name}</div>
                <div className="text-xs text-gray-600 mt-1">Bấm để chọn nơi này làm Vị Trí Khởi Đầu</div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
