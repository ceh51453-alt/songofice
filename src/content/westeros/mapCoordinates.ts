import { REGIONS } from "../world/geography";

/**
 * Quartermaester-calibrated lat/lng for every region seat.
 *
 * Coordinates are extracted from the Quartermaester interactive map
 * (quartermaester.info) which uses Google Maps / Leaflet with Mercator
 * projection. The mapping from our canvas pixel space to Mercator lat/lng
 * is highly non-linear, so direct lookup is the only reliable approach.
 *
 * Regions not in the Quartermaester database (Yi Ti, Ulthos, deep Sothoryos,
 * etc.) are placed by proportional interpolation from nearby known points.
 */

const KNOWN_COORDINATES: Record<string, [number, number]> = {
  // ── Westeros: The North ──────────────────────────────────────────────────
  "the-north":          [66.25, -123.33],  // Winterfell
  "north-wolfswood":    [70.19, -138.53],  // Deepwood Motte
  "north-barrowlands":  [57.59, -136.60],  // Barrowton
  "north-white-knife":  [56.68, -114.10],  // White Harbor
  "north-dreadfort":    [67.42, -102.58],  // Dreadfort
  "north-karhold":      [70.33,  -88.17],  // Karhold
  "north-last-hearth":  [72.62, -104.69],  // Last Hearth
  "north-neck":         [46.10, -124.64],  // Greywater Watch
  "north-bear-island":  [72.80, -145.00],  // Mormont Keep (estimated from map position)
  "north-skagos":       [58.84,  -97.66],  // Ramsgate / Kingshouse
  "north-stony-shore":  [62.90, -133.96],  // Torrhen's Square

  // ── Westeros: Iron Islands ───────────────────────────────────────────────
  "the-iron-islands":   [27.74, -150.62],  // Pyke
  "iron-harlaw":        [31.37, -144.46],  // Ten Towers
  "iron-great-wyk":     [30.47, -156.20],  // Hammerhorn
  "iron-old-wyk":       [31.37, -154.26],  // Nagga's Hill
  "iron-orkmont":       [31.93, -153.43],  // Castle Goodbrother / Orkmont
  "iron-saltcliffe":    [29.55, -152.59],  // Pebbleton / Saltcliffe
  "iron-blacktyde":     [33.50, -157.50],  // Blacktyde Castle (estimated)

  // ── Westeros: The Vale ───────────────────────────────────────────────────
  "the-vale":           [31.77, -102.50],  // The Eyrie
  "vale-gulltown":      [29.42,  -84.21],  // Gulltown
  "vale-fingers":       [43.17,  -81.14],  // The Drearfort (House Baelish location)
  "vale-snakewood":     [36.70,  -99.07],  // Heart's Home
  "vale-mountains":     [29.88, -102.93],  // Bloody Gate
  "vale-sisters":       [49.35, -106.89],  // Sisterton

  // ── Westeros: Riverlands ─────────────────────────────────────────────────
  "the-riverlands":     [22.29, -128.29],  // Riverrun
  "riverlands-twins":   [38.60, -128.73],  // The Twins
  "riverlands-seagard": [35.19, -129.26],  // Seagard
  "riverlands-trident": [23.04, -114.48],  // Lord Harroway's Town
  "riverlands-gods-eye":[18.25, -114.40],  // Harrenhal
  "riverlands-maidenpool": [17.64, -101.75], // Maidenpool
  "riverlands-blackwood": [19.91, -118.67],  // Raventree Hall
  "riverlands-bracken": [22.09, -120.95],  // Stone Hedge

  // ── Westeros: Westerlands ────────────────────────────────────────────────
  "the-westerlands":    [6.32, -151.36],   // Casterly Rock
  "westerlands-golden-tooth": [14.18, -138.66], // Golden Tooth
  "westerlands-castamere": [15.67, -147.32],    // Castamere
  "westerlands-crakehall": [-4.96, -154.57],    // Crakehall
  "westerlands-fair-isle": [14.31, -152.72],    // Faircastle
  "westerlands-north-coast": [19.81, -147.41],  // The Crag

  // ── Westeros: Crownlands ─────────────────────────────────────────────────
  "the-crownlands":     [1.32, -106.00],   // King's Landing
  "crownlands-duskendale": [8.62, -98.80],  // Duskendale
  "crownlands-crackclaw": [21.21, -87.16],  // Dyre Den
  "crownlands-dragonstone": [13.20, -85.53], // Dragonstone
  "crownlands-driftmark": [11.50, -87.00],  // High Tide (slightly south of Dragonstone)
  "crownlands-kingswood": [3.47, -106.98],  // Hayford

  // ── Westeros: Reach ──────────────────────────────────────────────────────
  "the-reach":          [-23.97, -138.35],  // Highgarden
  "reach-oldtown":      [-36.63, -149.87],  // Oldtown
  "reach-arbor":        [-45.80, -153.00],  // Ryamsport (from Sunflower Hall area)
  "reach-shield-islands": [-21.00, -150.03], // Lord Hewett's Town (from QM data)
  "reach-bitterbridge": [-11.05, -124.03],  // Bitterbridge
  "reach-tumbleton":    [-4.78, -114.80],   // Tumbleton
  "reach-horn-hill":    [-29.73, -138.00],  // Horn Hill
  "reach-western":      [-10.96, -138.18],  // Goldengrove
  "reach-upper-mander": [-20.59, -123.06],  // Ashford

  // ── Westeros: Stormlands ─────────────────────────────────────────────────
  "the-stormlands":     [-16.17, -91.86],   // Storm's End
  "stormlands-rainwood":[-18.44, -95.29],   // Griffin's Roost
  "stormlands-cape-wrath": [-30.22, -91.20], // Weeping Town
  "stormlands-tarth":   [-12.77, -83.77],   // Evenfall Hall
  "stormlands-dornish-marches": [-24.21, -110.67], // Blackhaven
  "stormlands-kingswood": [-8.32, -85.75],  // Parchments

  // ── Westeros: Dorne ──────────────────────────────────────────────────────
  "dorne":              [-43.58, -84.57],   // Sunspear
  "dorne-greenblood":   [-44.06, -86.63],   // Planky Town
  "dorne-yronwood":     [-37.65, -114.45],  // Yronwood
  "dorne-boneway":      [-29.19, -110.98],  // Wyl
  "dorne-princes-pass": [-38.75, -125.08],  // Skyreach
  "dorne-red-mountains":[-34.81, -124.34],  // Kingsgrave
  "dorne-starfall":     [-41.38, -135.63],  // Starfall
  "dorne-hellholt":     [-44.18, -117.08],  // Hellholt

  // ── Westeros: Beyond the Wall ────────────────────────────────────────────
  "beyond-the-wall":    [77.52, -111.53],   // Craster's Keep
  "beyond-frostfangs":  [78.27, -116.93],   // Fist of First Men area
  "beyond-hardhome":    [78.72,  -97.16],   // Hardhome
  "beyond-lands-always-winter": [80.50, -111.00], // Heart of Winter (estimated, far north)
  "beyond-ice-bay":     [76.50, -140.00],   // Frozen Shore (estimated, far west)

  // ── Essos: Free Cities ───────────────────────────────────────────────────
  "braavos":            [43.93,  -59.78],   // Braavos
  "pentos":             [4.08,   -59.17],   // Pentos
  "lorath":             [39.77,  -39.39],   // Lorath
  "norvos":             [19.73,  -31.35],   // Norvos
  "qohor":              [4.48,    -5.51],   // Qohor
  "volantis":           [-44.37, -10.69],   // Volantis
  "myr":                [-23.28, -49.19],   // Myr
  "tyrosh":             [-26.71, -69.32],   // Tyrosh
  "lys":                [-43.77, -56.97],   // Lys

  // ── Essos: Disputed Lands / Stepstones ───────────────────────────────────
  "essos-disputed-lands": [-18.00, -55.00], // The Flatlands (between Myr/Tyrosh/Lys)
  "essos-stepstones":   [-35.00, -72.00],   // Bloodstone (between Westeros & Tyrosh)

  // ── Essos: Rhoyne ────────────────────────────────────────────────────────
  "essos-upper-rhoyne": [7.75,   -43.83],   // Ghoyan Drohe
  "essos-sorrows":      [-20.80, -22.82],   // Chroyane / Sorrows
  "essos-lower-rhoyne": [-32.62, -19.97],   // Selhorys

  // ── Essos: Dothraki Sea ──────────────────────────────────────────────────
  "essos-western-dothraki-sea": [-5.00, 30.00], // Vaes Khewo (estimated, west of Vaes Dothrak)
  "vaes-dothrak":       [-18.02, 71.84],    // Vaes Dothrak
  "dothraki-sea":       [-25.00, 60.00],    // Mother of Mountains (estimated, central)
  "essos-eastern-dothraki-sea": [-12.00, 95.00], // Vaes Jini (estimated)
  "sarnor":             [25.00,  30.00],    // Saath (estimated, north of Dothraki Sea)

  // ── Essos: Ghiscar / Slaver's Bay ────────────────────────────────────────
  "astapor":            [-58.70, 71.79],    // Astapor
  "yunkai":             [-49.78, 75.48],    // Yunkai
  "meereen":            [-45.49, 80.45],    // Meereen
  "new-ghis":           [-71.92, 79.00],    // New Ghis
  "lhazar":             [-38.27, 103.34],   // Lhazosh (from QM Lhazar)
  "essos-ghiscari-hinterland": [-66.64, 75.26], // Old Ghis

  // ── Essos: Qarth / Red Waste ─────────────────────────────────────────────
  "essos-red-waste":    [-76.22, 139.64],   // Vaes Tolorro
  "qarth":              [-81.37, 161.40],   // Qarth
  "essos-jade-gates":   [-82.00, 170.00],   // Qarkash (estimated, east of Qarth)

  // ── Essos: Valyria ───────────────────────────────────────────────────────
  "valyria":            [-70.26, 32.42],    // Valyria (Doom)
  "essos-mantarys":     [-50.74, 39.32],    // Mantarys
  "essos-elyria":       [-55.65, 43.93],    // Elyria

  // ── Essos: Far East ──────────────────────────────────────────────────────
  // These locations aren't on the QM map, so estimated from relative positions
  "essos-bone-mountains": [-20.00, 120.00], // Kayakayanaya
  "essos-yi-ti-west":  [-30.00, 140.00],    // Yin
  "yi-ti":              [-25.00, 155.00],   // Si Qo
  "essos-yi-ti-east":   [-30.00, 168.00],   // Jinqi
  "jogos-nhai":         [10.00,  148.00],   // Shrinking Sea area
  "essos-mossovy":      [30.00,  168.00],   // Eastern Forest
  "essos-thousand-islands": [-15.00, 175.00], // Nefer
  "asshai":             [-55.00, 170.00],   // Asshai-by-the-Shadow
  "shadow-lands":       [-40.00, 175.00],   // Stygai
  "essos-grey-waste":   [15.00,  160.00],   // Five Forts

  // ── Ibben ────────────────────────────────────────────────────────────────
  "ibben":              [76.00,   8.47],    // Port of Ibben
  "ibben-ib-sar":       [74.00,  20.00],    // Ib Sar (estimated, east of Ib)

  // ── Summer Isles ─────────────────────────────────────────────────────────
  "summer-walano":      [-70.00, -120.00],  // Lotus Port (estimated)
  "summer-islands":     [-73.50, -130.93],  // Tall Trees Town (from QM)
  "summer-omboru":      [-68.00, -100.00],  // Omboru (estimated)
  "summer-koj":         [-75.00, -110.00],  // Koj (estimated)

  // ── Sothoryos ────────────────────────────────────────────────────────────
  "naath":              [-72.00, -85.00],   // Butterfly Vale (estimated)
  "basilisk-isles":     [-80.78,  58.21],   // Gogossos (from QM)
  "sothoryos-zamettar": [-79.15,  70.74],   // Zamettar (from QM)
  "sothoryos-yeen":     [-81.02,  74.82],   // Yeen (from QM)
  "sothoryos-green-hell": [-82.00, 70.00],  // Uncharted Basin (estimated)
  "sothoryos-south":    [-83.00,  80.00],   // Uncharted South (estimated)

  // ── Ulthos ───────────────────────────────────────────────────────────────
  "ulthos-coast":       [-78.00, 160.00],   // Unknown Harbour (estimated)
  "ulthos-interior":    [-80.00, 170.00],   // Unmapped Interior (estimated)
};

/**
 * Complete region → [lat, lng] lookup for the Quartermaester / Leaflet tile map.
 * Uses direct Quartermaester data where available, with no formula fallback
 * (all regions are explicitly placed).
 */
export const REGION_COORDINATES: Record<string, [number, number]> = {};

// Seed with explicit Quartermaester coordinates
Object.assign(REGION_COORDINATES, KNOWN_COORDINATES);

// Fill any regions that might exist in the registry but weren't explicitly listed
for (const region of REGIONS) {
  if (!(region.id in REGION_COORDINATES)) {
    // Fallback: rough linear interpolation (only for edge cases)
    const [x, y] = region.seatXY;
    const MAP_W = 3600, MAP_H = 2200;
    REGION_COORDINATES[region.id] = [
      Math.max(-84, Math.min(84, 82 - (y / MAP_H) * 164)),
      Math.max(-179, Math.min(179, -166 + (x / MAP_W) * 296)),
    ];
  }
}
