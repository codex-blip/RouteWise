/**
 * Shared TypeScript types for the Uber Clone frontend.
 *
 * These types mirror the Pydantic schemas from the FastAPI backend
 * to ensure type safety across the API boundary.
 */

// ==========================================
// User Types
// ==========================================

export type UserRole = 'rider' | 'driver' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
}

// ==========================================
// Location Types
// ==========================================

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

// ==========================================
// Ride Types
// ==========================================

export type RideStatus =
  | 'requested'
  | 'searching'
  | 'accepted'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface Ride {
  id: string;
  rider_id: string;
  driver_id?: string;
  status: RideStatus;
  pickup_lat: number;
  pickup_lng: number;
  pickup_address?: string;
  dropoff_lat: number;
  dropoff_lng: number;
  dropoff_address?: string;
  estimated_fare?: number;
  final_fare?: number;
  cancelled_by?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  accepted_at?: string;
  arrived_at?: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
}

export interface RideRequest {
  pickup: Location;
  dropoff: Location;
}

// Navigation types
export interface Suggestion {
  id: string;
  place_name: string;
  text?: string;
  center: [number, number]; // [lng, lat]
}

export interface RouteResponse {
  encoded_polyline: string;
  distance: number;
  duration: number;
  estimated_fare: number;
}

export interface DriverLocation {
  lat: number;
  lng: number;
}

export interface RideStreamMessage {
  lat?: number;
  lng?: number;
  status: 'EN_ROUTE' | 'ARRIVED';
}

export interface RideStatusUpdate {
  status: 'accepted' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';
  reason?: string;
  cancelled_by?: 'rider' | 'driver' | 'system';
}

// ==========================================
// Map Types
// ==========================================

/**
 * Viewport state for react-map-gl
 * Matches the ViewState type from react-map-gl
 */
export interface MapViewport {
  latitude: number;
  longitude: number;
  zoom: number;
  bearing?: number;
  pitch?: number;
  padding?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

// ==========================================
// API Response Types
// ==========================================

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  environment: string;
  version: string;
  services: {
    database: string;
    server: string;
  };
}

export interface ApiError {
  detail: string;
}

// ==========================================
// WebSocket Types (Step 2)
// ==========================================

// TODO Step 2: Define WebSocket message types
// export type WebSocketEvent =
//   | 'ride:requested'
//   | 'ride:status_updated'
//   | 'ride:driver_location'
//   | 'ride:rider_location'
//   | 'driver:location_updated'
//   | 'ping'
//   | 'pong';

// export interface WebSocketMessage<T = unknown> {
//   event: WebSocketEvent;
//   data: T;
//   timestamp: string;
// }

// export interface DriverLocationUpdate {
//   ride_id: string;
//   driver_id: string;
//   lat: number;
//   lng: number;
// }

// ==========================================
// Payment Types (Step 3)
// ==========================================

// TODO Step 3: Define payment-related types
// export interface PaymentIntent {
//   id: string;
//   client_secret: string;
//   amount: number;
//   currency: string;
//   status: string;
// }

// export interface CreatePaymentIntentRequest {
//   ride_id: string;
//   amount: number;
// }
