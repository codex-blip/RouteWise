import { useCallback, useRef, useEffect, useState } from 'react';
import ReactMapGL, {
  Marker,
  NavigationControl,
  GeolocateControl,
  FullscreenControl,
  ScaleControl,
  AttributionControl,
  Source,
  Layer,
  type MapRef,
} from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { decode } from '@mapbox/polyline';

import type { Location, MapViewport } from '@/types';

interface MapProps {
  viewport: MapViewport;
  onViewportChange: (viewport: MapViewport) => void;
  onMapClick?: (location: Location) => void;
  pickup?: Location;
  dropoff?: Location;
  routePolyline?: string | undefined;
  driverLocation?: Location | null;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';

function useSmoothLocation(targetLocation: Location | null | undefined, durationMs: number = 1000) {
  const [interpolatedLocation, setInterpolatedLocation] = useState<Location | null>(null);
  const [bearing, setBearing] = useState<number>(0);
  const animRef = useRef<number | null>(null);

  const currentPosRef = useRef<Location | null>(null);
  const targetPosRef = useRef<Location | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!targetLocation) {
      setInterpolatedLocation(null);
      setBearing(0);
      currentPosRef.current = null;
      targetPosRef.current = null;
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
      return;
    }

    if (!currentPosRef.current) {
      setInterpolatedLocation(targetLocation);
      currentPosRef.current = targetLocation;
      targetPosRef.current = targetLocation;
      return;
    }

    targetPosRef.current = targetLocation;
    startTimeRef.current = performance.now();

    const startLat = currentPosRef.current.lat;
    const startLng = currentPosRef.current.lng;
    const targetLat = targetPosRef.current.lat;
    const targetLng = targetPosRef.current.lng;

    // Calculate bearing if moving significantly
    const dLat = targetLat - startLat;
    const dLng = targetLng - startLng;
    if (Math.abs(dLat) > 0.000001 || Math.abs(dLng) > 0.000001) {
      const lat1 = (startLat * Math.PI) / 180;
      const lat2 = (targetLat * Math.PI) / 180;
      const dLngRad = (dLng * Math.PI) / 180;

      const y = Math.sin(dLngRad) * Math.cos(lat2);
      const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLngRad);
      let brng = Math.atan2(y, x);
      brng = (brng * 180) / Math.PI;
      const newBearing = (brng + 360) % 360;
      setBearing(newBearing);
    }

    const animate = (time: number) => {
      if (!startTimeRef.current || !currentPosRef.current || !targetPosRef.current) return;

      const elapsed = time - startTimeRef.current;
      const progress = Math.min(elapsed / durationMs, 1.0);

      const sLat = currentPosRef.current.lat;
      const sLng = currentPosRef.current.lng;
      const tLat = targetPosRef.current.lat;
      const tLng = targetPosRef.current.lng;

      const newLat = sLat + (tLat - sLat) * progress;
      const newLng = sLng + (tLng - sLng) * progress;

      setInterpolatedLocation({
        lat: newLat,
        lng: newLng,
        address: targetPosRef.current.address,
      });

      if (progress < 1.0) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        currentPosRef.current = targetPosRef.current;
        animRef.current = null;
      }
    };

    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
    }
    if (interpolatedLocation) {
      currentPosRef.current = interpolatedLocation;
    }
    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [targetLocation, durationMs]);

  return { location: interpolatedLocation, bearing };
}

export default function Map({
  viewport,
  onViewportChange,
  onMapClick,
  pickup,
  dropoff,
  routePolyline,
  driverLocation,
}: MapProps) {
  const mapRef = useRef<MapRef>(null);
  const smoothDriver = useSmoothLocation(driverLocation, 1000);

  const handleClick = useCallback(
    (event: mapboxgl.MapMouseEvent) => {
      if (!onMapClick) return;
      const { lng, lat } = event.lngLat;
      onMapClick({ lat, lng });
    },
    [onMapClick]
  );

  const handleViewportChange = useCallback(
    (newViewState: MapViewport) => onViewportChange(newViewState),
    [onViewportChange]
  );

  useEffect(() => {
    if (!MAPBOX_TOKEN) {
      console.error('[Map] Missing NEXT_PUBLIC_MAPBOX_TOKEN');
    }
  }, []);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="text-red-500 text-lg font-semibold mb-2">Map Configuration Error</div>
          <div className="text-gray-600 text-sm">
            Please set NEXT_PUBLIC_MAPBOX_TOKEN in your .env.local file.
            <br />
            Get a free token at{' '}
            <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
              Mapbox
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Decode polyline into GeoJSON if provided
  let routeGeojson: GeoJSON.Feature | null = null;
  if (routePolyline) {
    try {
      const coords = decode(routePolyline).map(([lat, lng]: [number, number]) => [lng, lat]);
      routeGeojson = {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: coords },
      } as any;
    } catch (err) {
      console.error('Failed to decode route polyline', err);
    }
  }

  return (
    <div className="absolute inset-0">
      <ReactMapGL
        ref={mapRef}
        {...viewport}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        onMove={(evt) => handleViewportChange(evt.viewState as MapViewport)}
        onClick={handleClick}
        dragPan
        dragRotate={false}
        scrollZoom
        doubleClickZoom
        touchZoomRotate
        reuseMaps
        antialias
        attributionControl={false}
      >
        <div className="absolute right-4 top-4 flex flex-col gap-2">
          <NavigationControl showCompass={false} visualizePitch={false} />
          <GeolocateControl positionOptions={{ enableHighAccuracy: true }} trackUserLocation showUserHeading />
          <FullscreenControl />
        </div>

        <div className="absolute left-4 bottom-8">
          <ScaleControl unit="metric" maxWidth={100} />
        </div>

        <div className="absolute right-4 bottom-8">
          <AttributionControl compact />
        </div>

        {pickup && (
          <Marker latitude={pickup.lat} longitude={pickup.lng} anchor="bottom" offset={[0, 0]}>
            <PickupMarker />
          </Marker>
        )}

        {dropoff && (
          <Marker latitude={dropoff.lat} longitude={dropoff.lng} anchor="bottom" offset={[0, 0]}>
            <DropoffMarker />
          </Marker>
        )}

        {smoothDriver.location && (
          <Marker latitude={smoothDriver.location.lat} longitude={smoothDriver.location.lng} anchor="bottom" offset={[0, 0]}>
            <DriverMarker bearing={smoothDriver.bearing} />
          </Marker>
        )}

        {routeGeojson && (
          <Source id="route" type="geojson" data={routeGeojson}>
            <Layer
              id="route-line"
              type="line"
              paint={{
                'line-color': '#276ef1',
                'line-width': 4,
                'line-opacity': 0.95,
              }}
            />
          </Source>
        )}

        {/* TODO Step 4: Render and animate a car marker using streaming driver coordinates. */}
      </ReactMapGL>
    </div>
  );
}

function PickupMarker() {
  return (
    <div className="relative">
      <div className="absolute -inset-2 bg-green-500 rounded-full opacity-30 animate-ping" />
      <div className="relative w-8 h-8 bg-green-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="3" />
        </svg>
      </div>
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className="bg-black text-white text-xs px-2 py-0.5 rounded shadow">Pickup</span>
      </div>
    </div>
  );
}

function DropoffMarker() {
  return (
    <div className="relative">
      <div className="w-8 h-8 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className="bg-black text-white text-xs px-2 py-0.5 rounded shadow">Dropoff</span>
      </div>
    </div>
  );
}

function DriverMarker({ bearing = 0 }: { bearing?: number }) {
  return (
    <div className="relative">
      <div className="absolute -inset-3 rounded-full bg-black/20 animate-ping" />
      <div 
        className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-black shadow-xl"
        style={{ transform: `rotate(${bearing}deg)`, transition: 'transform 0.15s ease-out' }}
      >
        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13l1-4h16l1 4" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13v4h14v-4" />
          <circle cx="7.5" cy="18.5" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="16.5" cy="18.5" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      </div>
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className="bg-black text-white text-xs px-2 py-0.5 rounded shadow">Car</span>
      </div>
    </div>
  );
}
