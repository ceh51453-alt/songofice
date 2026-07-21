import { useEffect } from "react";
import { MapContainer, CircleMarker, Popup, useMap, Marker, Polyline, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { useState } from "react";

/**
 * A component to log map coordinates on click
 */
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

import { REGION_COORDINATES } from "../../content/westeros/mapCoordinates";
import { REGIONS_BY_ID } from "../../content/westeros/regions";
import { useMvuStore } from "../../state/mvuStore";
import { QuartermaesterTileLayer } from "./QuartermaesterTileLayer";
import { useTerritoryStore } from "../../state/territoryStore";
import { useMilitaryStore } from "../../state/militaryStore";
import { houseColor } from "../../content/westeros/houseColors";

/**
 * A component to resize map when container size changes
 */
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [map]);
  return null;
}

export function InteractiveMap() {
  const stat = useMvuStore((s) => s.stat);
  const sovereignty = stat["Chủ Quyền Lãnh Thổ"] as Record<string, any>;
  const units = stat["Biên Chế Quân Sự"] as Record<string, any>;
  const selectRegion = useTerritoryStore((s) => s.selectRegion);
  const moveMode = useMilitaryStore((s) => s.moveMode);
  const selectedUnit = useMilitaryStore((s) => s.selectedUnit);
  const moveUnit = useMilitaryStore((s) => s.moveUnit);

  const handleMarkerClick = (regionId: string) => {
    if (moveMode && selectedUnit) {
      moveUnit(selectedUnit, regionId);
      return;
    }
    selectRegion(regionId);
  };

  return (
    <div className="w-full h-full relative z-10" id="mvu-interactive-map">
      <MapContainer
        center={[30, -120]}
        zoom={4}
        style={{ width: "100%", height: "100%", background: "#cad2d3" }}
        maxZoom={8}
        minZoom={2}
      >
        <MapResizer />
        <MapClickLogger />
        <QuartermaesterTileLayer />

        {Object.entries(REGION_COORDINATES).map(([regionId, coords]) => {
          const region = REGIONS_BY_ID[regionId];
          const controllingHouse = sovereignty[regionId]?.["Nhà Kiểm Soát"] ?? "vô-chủ";
          const color = houseColor(controllingHouse).base;

          return (
            <CircleMarker
              key={regionId}
              center={coords}
              radius={12}
              pathOptions={{ fillColor: color, fillOpacity: 0.8, color: "#fff", weight: 2 }}
              eventHandlers={{
                click: () => handleMarkerClick(regionId),
              }}
            >
              <Popup>
                <div className="text-sm font-semibold mb-1">{region?.name ?? regionId}</div>
                <div className="text-xs">
                  Nhà Kiểm Soát: <span style={{ color: color, fontWeight: "bold" }}>{houseColor(controllingHouse).label}</span>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* --- Army Markers Layer --- */}
        {Object.entries(units).map(([name, u]) => {
          if (u["Số Lượng"] <= 0) return null;
          
          const fromId = u["Lãnh Địa Đồn Trú"];
          const toId = u["Đang Di Chuyển Đến"];
          
          const fromCoords = REGION_COORDINATES[fromId];
          const toCoords = toId ? REGION_COORDINATES[toId] : null;
          
          if (!fromCoords) return null;

          // If moving, we can draw a line
          const isMoving = !!toCoords;

          // Custom DivIcon for army
          const armyIcon = L.divIcon({
            className: "bg-transparent",
            html: `<div class="bg-red-800 border-2 border-yellow-500 text-white rounded-full flex items-center justify-center font-bold text-[10px]" style="width: 24px; height: 24px; transform: translate(-50%, -50%); box-shadow: 0 0 5px rgba(0,0,0,0.5);">${(u["Số Lượng"] / 1000).toFixed(1)}k</div>`,
            iconSize: [24, 24],
            iconAnchor: [0, 0] // Centered via transform
          });

          return (
            <div key={`army-${name}`}>
              {isMoving && toCoords && (
                <Polyline positions={[fromCoords, toCoords]} color="#eab308" dashArray="5, 5" weight={2} opacity={0.8} />
              )}
              <Marker
                position={isMoving ? [(fromCoords[0] + toCoords[0]) / 2, (fromCoords[1] + toCoords[1]) / 2] : [fromCoords[0] + 0.5, fromCoords[1] + 0.5]} // slightly offset from seat
                icon={armyIcon}
              >
                <Popup>
                  <div className="text-sm font-semibold">{name}</div>
                  <div className="text-xs">Quân số: {u["Số Lượng"]}</div>
                  <div className="text-xs">Chỉ huy: {u["Chỉ Huy"] || "Không có"}</div>
                  {isMoving && <div className="text-xs italic text-yellow-600 mt-1">Đang hành quân...</div>}
                </Popup>
              </Marker>
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}
