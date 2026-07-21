import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

function getTileCode(x: number, y: number, zoom: number): string {
  let c = Math.pow(2, zoom);
  let d = x;
  let e = y;
  let f = "t";
  for (let g = 0; g < zoom; g++) {
    c = c / 2;
    if (e < c) {
      if (d < c) {
        f += "q";
      } else {
        f += "r";
        d -= c;
      }
    } else {
      if (d < c) {
        f += "t";
        e -= c;
      } else {
        f += "s";
        d -= c;
        e -= c;
      }
    }
  }
  return f;
}

export function QuartermaesterTileLayer() {
  const map = useMap();

  useEffect(() => {
    // Tự định nghĩa Layer kế thừa từ L.TileLayer để dùng custom getTileUrl
    const QM_TileLayer = (L.TileLayer as any).extend({
      getTileUrl: function (coords: any) {
        return `https://quartermaester.info/fsm/${getTileCode(coords.x, coords.y, coords.z)}.jpg`;
      },
    });

    const layer = new QM_TileLayer("", {
      attribution: '&copy; Quartermaester / ASOIAF community',
      minZoom: 2,
      maxZoom: 6,
      maxNativeZoom: 5,
      noWrap: true,
      bounds: [[-90, -180], [90, 180]]
    });
    layer.addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [map]);

  return null;
}
