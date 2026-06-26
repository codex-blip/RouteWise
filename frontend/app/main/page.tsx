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

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';
import { decode } from '@mapbox/polyline';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripePaymentForm from '@/components/StripePaymentForm';
import DestinationCard from '@/components/DestinationCard';
import type { DriverLocation, Location, MapViewport, RideStreamMessage, RouteResponse } from '@/types';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51MockKeyMockKeyMockKeyMockKeyMockKeyMockKeyMockKeyMockKeyMockKeyMockKeyMockKeyMockKeyMockKey00MockKeyMockKey');

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
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/signin');
    }
  }, [user, loading, router]);

  type RidePhase = 'idle' | 'driver_en_route' | 'waiting_for_otp' | 'in_trip' | 'completed';

  // Viewport state for map position and zoom
  const [viewport, setViewport] = useState<MapViewport>(DEFAULT_VIEWPORT);

  // Pickup and dropoff locations
  const [pickup, setPickup] = useState<Location | undefined>();
  const [dropoff, setDropoff] = useState<Location | undefined>();
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [activeRideId, setActiveRideId] = useState<string | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [vehicleLocation, setVehicleLocation] = useState<DriverLocation | null>(null);
  const [rideStatusMessage, setRideStatusMessage] = useState<string | null>(null);
  const [ridePhase, setRidePhase] = useState<RidePhase>('idle');
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);

  // Stripe Payment State
  const [paymentIntentData, setPaymentIntentData] = useState<{ clientSecret: string; amount: number; rideId: string } | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const tripAnimationRef = useRef<number | null>(null);

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

  const routeCoordinates = useMemo(() => {
    if (!route?.encoded_polyline) return [];

    try {
      return decode(route.encoded_polyline).map(([lat, lng]: [number, number]) => ({ lat, lng }));
    } catch (err) {
      console.error('Failed to decode route polyline in page', err);
      return [];
    }
  }, [route?.encoded_polyline]);

  const clearTripAnimation = useCallback(() => {
    if (tripAnimationRef.current !== null) {
      window.clearInterval(tripAnimationRef.current);
      tripAnimationRef.current = null;
    }
  }, []);

  const disconnectRideSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  /**
   * Handle ride request submission.
   */
  const handleRequestRide = useCallback(async () => {
    if (!pickup || !dropoff || !route?.encoded_polyline) return;

    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    setRideStatusMessage('Initializing ride request...');
    setOtpInput('');
    setOtpError(null);

    try {
      // Step 1: Initialize ride request in backend (calculates fare and generates PaymentIntent)
      const res = await fetch(`${base}/api/v1/rides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup: {
            lat: pickup.lat,
            lng: pickup.lng,
            address: pickup.address,
          },
          dropoff: {
            lat: dropoff.lat,
            lng: dropoff.lng,
            address: dropoff.address,
          },
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to request ride');
      }

      const rideResponse = await res.json();
      console.log('Ride requested successfully:', rideResponse);

      // Step 2: Display the Stripe checkout modal
      setPaymentIntentData({
        clientSecret: rideResponse.client_secret || `pi_mock_${crypto.randomUUID().replaceAll('-', '')}`,
        amount: Math.round((rideResponse.estimated_fare || 15.0) * 100),
        rideId: rideResponse.id,
      });

    } catch (err) {
      console.error('Requesting ride failed:', err);
      setRideStatusMessage('Failed to initialize ride request. Please try again.');
    }
  }, [pickup, dropoff, route]);

  const handlePaymentSuccess = useCallback(async (paymentIntentId: string) => {
    if (!paymentIntentData || !pickup || !dropoff || !route?.encoded_polyline) return;

    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const wsBase = base.replace(/^http/, 'ws').replace(/\/$/, '');
    const { rideId } = paymentIntentData;

    setPaymentIntentData(null);
    disconnectRideSocket();
    setActiveRideId(rideId);
    setDriverLocation(null);
    setVehicleLocation(null);
    setRideStatusMessage('Payment authorized! Driver is on the way...');
    setRidePhase('driver_en_route');

    try {
      // Step 3: Trigger driver simulation to pickup
      const res = await fetch(`${base}/api/v1/rides/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ride_id: rideId,
          encoded_polyline: route.encoded_polyline,
          pickup_lat: pickup.lat,
          pickup_lng: pickup.lng,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to confirm ride');
      }

      const socket = new WebSocket(`${wsBase}/ws/ride/${encodeURIComponent(rideId)}`);
      wsRef.current = socket;

      socket.onmessage = (event) => {
        try {
          const message: RideStreamMessage = JSON.parse(event.data);
          console.log('Driver stream update:', message);

          if (
            message.status === 'EN_ROUTE' &&
            typeof message.lat === 'number' &&
            typeof message.lng === 'number'
          ) {
            setDriverLocation({ lat: message.lat, lng: message.lng });
            setVehicleLocation({ lat: message.lat, lng: message.lng });
            return;
          }

          if (message.status === 'ARRIVED') {
            setRideStatusMessage('Driver arrived. Enter OTP to start the ride.');
            setRidePhase('waiting_for_otp');
            setVehicleLocation((current) => current || driverLocation);
            disconnectRideSocket();
          }
        } catch (err) {
          console.error('Invalid WebSocket payload', err);
        }
      };

      socket.onerror = (event) => {
        console.error('WebSocket error:', event);
      };

      socket.onclose = () => {
        wsRef.current = null;
      };
    } catch (err) {
      console.error('Confirming ride failed:', err);
      setRideStatusMessage('Failed to start driver simulation. Please try again.');
      disconnectRideSocket();
    }
  }, [paymentIntentData, pickup, dropoff, route, disconnectRideSocket, driverLocation]);

  const handlePaymentCancel = useCallback(async () => {
    if (!paymentIntentData) return;
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const { rideId } = paymentIntentData;

    setPaymentIntentData(null);
    setRideStatusMessage('Ride cancelled.');
    setRidePhase('idle');

    try {
      await fetch(`${base}/api/v1/rides/${rideId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'cancelled',
          reason: 'User cancelled during payment authorization',
          cancelled_by: 'rider',
        }),
      });
    } catch (err) {
      console.error('Failed to cancel ride in backend:', err);
    }
  }, [paymentIntentData]);

  const handleStartRide = useCallback(() => {
    const expectedOtp = '1234';
    if (otpInput.trim() !== expectedOtp) {
      setOtpError('Enter OTP 1234 to continue.');
      return;
    }

    if (!routeCoordinates.length || !activeRideId) {
      setOtpError('Route is missing. Please select a destination again.');
      return;
    }

    setOtpError(null);
    setRidePhase('in_trip');
    setRideStatusMessage('Ride started. Heading to destination...');

    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    // Set status to in_progress in backend
    fetch(`${base}/api/v1/rides/${activeRideId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'in_progress' }),
    }).catch((err) => console.error('Failed to start ride on backend:', err));

    clearTripAnimation();
    let index = 0;
    setVehicleLocation(routeCoordinates[0]);

    tripAnimationRef.current = window.setInterval(() => {
      index += 1;
      if (index >= routeCoordinates.length) {
        clearTripAnimation();
        setRidePhase('completed');
        setRideStatusMessage('You have arrived at your destination.');
        setVehicleLocation(routeCoordinates[routeCoordinates.length - 1] || null);

        // Set status to completed in backend to trigger Stripe capture
        fetch(`${base}/api/v1/rides/${activeRideId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' }),
        }).catch((err) => console.error('Failed to complete ride on backend:', err));
        return;
      }

      setVehicleLocation(routeCoordinates[index]);
    }, 1000);
  }, [clearTripAnimation, otpInput, routeCoordinates, activeRideId]);

  useEffect(() => {
    return () => {
      clearTripAnimation();
      disconnectRideSocket();
    };
  }, [clearTripAnimation, disconnectRideSocket]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white/50 font-mono text-xs uppercase tracking-[0.2em]">
        Authenticating…
      </div>
    );
  }

  if (!user) {
    return null;
  }

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
        driverLocation={vehicleLocation || driverLocation}
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
        rideStatusMessage={rideStatusMessage || undefined}
        ridePhase={ridePhase}
        otpValue={otpInput}
        otpError={otpError || undefined}
        onOtpChange={setOtpInput}
        onStartRide={handleStartRide}
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

      {/* Stripe Checkout Modal Overlay */}
      {paymentIntentData && (
        <Elements stripe={stripePromise}>
          <StripePaymentForm
            clientSecret={paymentIntentData.clientSecret}
            amount={paymentIntentData.amount}
            onSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
          />
        </Elements>
      )}
    </main>
  );
}
