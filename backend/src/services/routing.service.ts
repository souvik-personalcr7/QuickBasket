/**
 * Road Routing & ETA Service
 * Computes road route polylines and true ETA / distance using OpenStreetMap / OSRM
 */

export interface RouteResult {
  coordinates: [number, number][]; // Array of [longitude, latitude]
  distanceKm: number;
  durationMinutes: number;
  etaText: string;
  source: 'osrm' | 'fallback';
}

// In-memory route cache to prevent spamming external servers (keyed by rounded coords)
const routeCache = new Map<string, { result: RouteResult; timestamp: number }>();
const CACHE_TTL_MS = 30000; // 30 seconds

export async function calculateRoadRoute(
  startLng: number,
  startLat: number,
  endLng: number,
  endLat: number
): Promise<RouteResult> {
  const cacheKey = `${startLng.toFixed(4)},${startLat.toFixed(4)}->${endLng.toFixed(4)},${endLat.toFixed(4)}`;
  const cached = routeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.result;
  }

  // Primary: OSRM Routing Engine (OpenStreetMap data)
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=false`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(osrmUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'QuickBasket/1.0 (Hyperlocal Delivery Tracking)',
      },
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
        const durationMinutes = Math.max(1, Math.round(route.duration / 60));
        const coordinates = route.geometry.coordinates as [number, number][];

        const result: RouteResult = {
          coordinates,
          distanceKm,
          durationMinutes,
          etaText: `${durationMinutes} min${durationMinutes === 1 ? '' : 's'} (${distanceKm} km)`,
          source: 'osrm',
        };

        routeCache.set(cacheKey, { result, timestamp: Date.now() });
        return result;
      }
    }
  } catch (err) {
    // Graceful fallback to geodesic road approximation if external service is temporarily unreachable
  }

  // Resilient fallback using Haversine formula + urban tortuosity factor (1.35x for city streets)
  const fallback = calculateGeodesicFallback(startLng, startLat, endLng, endLat);
  routeCache.set(cacheKey, { result: fallback, timestamp: Date.now() });
  return fallback;
}

function calculateGeodesicFallback(
  lng1: number,
  lat1: number,
  lng2: number,
  lat2: number
): RouteResult {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightDistanceKm = R * c;

  // City road factor: Roads are ~1.35x longer than straight-line distance
  const distanceKm = Math.max(0.1, Math.round(straightDistanceKm * 1.35 * 10) / 10);

  // Hyperlocal scooter/bike average urban delivery speed: 22 km/h + 2 min pickup buffer
  const travelMinutes = (distanceKm / 22) * 60;
  const durationMinutes = Math.max(1, Math.round(travelMinutes));

  // Generate intermediate points along the path for smooth polyline rendering
  const steps = 8;
  const coordinates: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const fraction = i / steps;
    const lat = lat1 + (lat2 - lat1) * fraction;
    const lng = lng1 + (lng2 - lng1) * fraction;
    coordinates.push([lng, lat]);
  }

  return {
    coordinates,
    distanceKm,
    durationMinutes,
    etaText: `${durationMinutes} mins (${distanceKm} km)`,
    source: 'fallback',
  };
}

