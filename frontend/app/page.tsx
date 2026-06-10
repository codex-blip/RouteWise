'use client';

/**
 * Home Page - Main Application Entry Point
 *
 * Displays a full-screen interactive map with a floating destination
 * input card. This is the primary screen riders see when opening the app.
 *
 * Architecture:
 * - Map component is abstracted to /components/Map.tsx for easy provider swap
 * - DestinationCard overlays the map for ride input
 * - Future: Add bottom sheet for ride options, driver tracking, etc.
 *
 * TODO Step 2: Add WebSocket listeners for real-time updates
 * TODO Step 2: Add driver location tracking overlay
 * TODO Step 3: Add payment sheet
 * TODO Step 4: Add user authentication state
 */

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import DestinationCard from '@/components/DestinationCard';
import type { Location, MapViewport, RouteResponse } from '@/types';

// Dynamically import Map component to avoid SSR issues with Mapbox
// Mapbox requires window object which is not available during SSR
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
      <div className="text-gray-500 text-sm">Loading map...</div>
    </div>
  ),
});

// Default viewport centered on San Francisco (Uber's hometown)
const DEFAULT_VIEWPORT: MapViewport = {
  latitude: 37.7749,
  longitude: -122.4194,
  zoom: 13,
};

export default function HomePage() {
  // Viewport state for map position and zoom
  const [viewport, setViewport] = useState<MapViewport>(DEFAULT_VIEWPORT);

  // Pickup and dropoff locations
  const [pickup, setPickup] = useState<Location | undefined>();
  const [dropoff, setDropoff] = useState<Location | undefined>();
  const [route, setRoute] = useState<RouteResponse | null>(null);

  // TODO Step 2: Track selected ride status
  // const [rideStatus, setRideStatus] = useState<RideStatus | null>(null);

  // TODO Step 2: Track nearby drivers for the map
  // const [nearbyDrivers, setNearbyDrivers] = useState<DriverLocation[]>([]);

  // TODO Step 2: WebSocket connection status
  // const [wsConnected, setWsConnected] = useState(false);

  /**
   * Handle viewport changes from the map component.
   */
  const handleViewportChange = useCallback((newViewport: MapViewport) => {
    setViewport(newViewport);
  }, []);

  /**
   * Handle destination selection from the floating card.
   * Updates dropoff location and centers map on the route.
   */
  const handleDestinationSelect = useCallback((location: Location | undefined) => {
    setDropoff(location);

    // TODO Step 2: Center map on pickup-to-dropoff route
    // TODO Step 2: Request route polyline from backend
    // TODO Step 3: Calculate and display fare estimate

    // For now, center the map on the dropoff location if provided
    if (location) {
      setViewport((prev) => ({
        ...prev,
        latitude: location.lat,
        longitude: location.lng,
        zoom: 15,
      }));
    }
  }, []);

  const handleRoute = useCallback((r: RouteResponse | null) => {
    setRoute(r);
  }, []);

  /**
   * Handle ride request submission.
   */
  const handleRequestRide = useCallback(async () => {
    if (!pickup || !dropoff) return;

    // TODO Step 2: Call API to request ride
    // const ride = await api.rides.request({ pickup, dropoff });
    // setRideStatus(ride.status);

    // TODO Step 2: Connect to WebSocket for ride updates
    // websocket.joinRideRoom(ride.id);

    // TODO Step 3: Initialize Stripe payment sheet

    console.log('Requesting ride:', { pickup, dropoff });
  }, [pickup, dropoff]);

  /**
   * Handle map click to set pickup location.
   */
  const handleMapClick = useCallback((location: Location) => {
    if (!pickup) {
      setPickup(location);
    } else if (!dropoff) {
      setDropoff(location);
    }
  }, [pickup, dropoff]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      {/* Full-screen interactive map */}
      <Map
        viewport={viewport}
        onViewportChange={handleViewportChange}
        onMapClick={handleMapClick}
        pickup={pickup}
        dropoff={dropoff}
        routePolyline={route?.encoded_polyline}
        // TODO Step 2: Pass nearby drivers
        // nearbyDrivers={nearbyDrivers}
        // TODO Step 2: Pass route polyline
        // routePolyline={routePolyline}
      />

      {/* Floating destination input card */}
      <DestinationCard
        pickup={pickup}
        dropoff={dropoff}
        onPickupChange={setPickup}
        onDropoffChange={handleDestinationSelect}
        onRequestRide={handleRequestRide}
        onRoute={handleRoute}
        // TODO Step 2: Show ride status
        // rideStatus={rideStatus}
        // TODO Step 3: Show fare estimate
        // estimatedFare={estimatedFare}
      />

      {/* TODO Step 2: Connection status indicator */}
      {/* <ConnectionStatus connected={wsConnected} /> */}

      {/* TODO Step 2: Active ride tracking overlay */}
      {/* {rideStatus && rideStatus !== 'completed' && (
        <RideTrackingOverlay rideId={activeRideId} />
      )} */}

      {/* TODO Step 4: User profile button */}
      {/* <ProfileButton /> */}
    </main>
  );
}
