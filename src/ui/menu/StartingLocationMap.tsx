import { useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  MAP_H,
  MAP_W,
  macroForRegion,
  regionsForContinent,
  type ContinentId,
  type MapRegion,
} from "../../content/world/geography";
import { QuartermaesterTileLayer } from "../map/QuartermaesterTileLayer";

type LatLngTuple = [number, number];

/** Convert the shared world-map pixel registry to Leaflet's bounded CRS. */
function regionLatLng(region: MapRegion): LatLngTuple {
  const [x, y] = region.seatXY;
  return [80 - (y / MAP_H) * 160, -170 + (x / MAP_W) * 340];
}

function FitRegions({ regions }: { regions: MapRegion[] }) {
  const map = useMap();

  useEffect(() => {
    if (!regions.length) return;
    const points = regions.map(regionLatLng);
    if (points.length === 1) map.setView(points[0], 5, { animate: false });
    else map.fitBounds(points, { padding: [28, 28], maxZoom: 5, animate: false });
  }, [map, regions]);

  return null;
}

interface Props {
  continentId: ContinentId;
  selectedLocation: string;
  onSelect: (regionId: string) => void;
}

export function StartingLocationMap({ continentId, selectedLocation, onSelect }: Props) {
  const regions = useMemo(() => regionsForContinent(continentId), [continentId]);

  return (
    <div className="h-[400px] w-full overflow-hidden rounded border-2 border-[#8c7853] bg-[#f3eacb] shadow-[inset_0_0_24px_rgba(76,56,31,0.3)]">
      <MapContainer
        center={[15, 0]}
        zoom={2}
        style={{ width: "100%", height: "100%", background: "#f3eacb" }}
        maxBounds={[[-85, -175], [85, 175]]}
        minZoom={1}
      >
        <QuartermaesterTileLayer />
        <FitRegions regions={regions} />
        {regions.map((region) => {
          const selected = selectedLocation === region.id;
          const macro = macroForRegion(region);
          return (
            <CircleMarker
              key={region.id}
              center={regionLatLng(region)}
              radius={selected ? 9 : Math.max(4, Math.min(7, region.labelPriority + 2))}
              pathOptions={{
                color: selected ? "#fff8dc" : "#654321",
                fillColor: selected ? "#d4af37" : "#b89342",
                fillOpacity: selected ? 0.96 : 0.82,
                weight: selected ? 3 : 1.5,
              }}
              eventHandlers={{ click: () => onSelect(region.id) }}
            >
              <Popup>
                <div className="text-center text-sm font-bold">{region.name}</div>
                <div className="mt-1 text-xs text-gray-600">{region.seat}{macro ? ` · ${macro.name}` : ""}</div>
                <div className="mt-1 max-w-[220px] text-xs text-gray-500">{region.description}</div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
