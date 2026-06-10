import { useCallback, useRef, useEffect } from 'react';
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
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';

export default function Map({
  viewport,
  onViewportChange,
  onMapClick,
  pickup,
  dropoff,
  routePolyline,
}: MapProps) {
  const mapRef = useRef<MapRef>(null);

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
