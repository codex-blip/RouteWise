/**
 * Utility functions for the Uber Clone frontend.
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with proper precedence.
 * Combines clsx for conditional classes and tailwind-merge for deduplication.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a fare amount for display.
 * Converts cents/units to formatted currency string.
 */
export function formatFare(amount: number | undefined): string {
  if (amount === undefined || amount === null) return '--';
  // Assuming amount is in cents, convert to dollars
  return `$${(amount / 100).toFixed(2)}`;
}

/**
 * Format a timestamp to a readable time string.
 */
export function formatTime(timestamp: string | undefined): string {
  if (!timestamp) return '--';
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a timestamp to a readable date string.
 */
export function formatDate(timestamp: string | undefined): string {
  if (!timestamp) return '--';
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculate distance between two coordinates using Haversine formula.
 * Returns distance in kilometers.
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Generate a Mapbox static map URL for a given location.
 * Useful for fallback images or previews.
 */
export function getStaticMapUrl(
  lat: number,
  lng: number,
  zoom: number = 14,
  width: number = 600,
  height: number = 400
): string {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return '';

  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${lng},${lat},${zoom},0/${width}x${height}@2x?access_token=${token}`;
}

/**
 * Sleep utility for async operations (e.g., debouncing).
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Debounce function for search inputs.
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// ==========================================
// API Client Utilities
// ==========================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Generic API fetch wrapper with error handling.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Predefined API methods for common operations.
 */
export const api = {
  // Health check
  health: {
    check: () => apiFetch('/api/v1/health'),
    ping: () => apiFetch('/api/v1/health/ping'),
  },

  // Users
  users: {
    list: (skip = 0, limit = 20) =>
      apiFetch(`/api/v1/users?skip=${skip}&limit=${limit}`),
    get: (id: string) => apiFetch(`/api/v1/users/${id}`),
    create: (data: unknown) =>
      apiFetch('/api/v1/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: unknown) =>
      apiFetch(`/api/v1/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiFetch(`/api/v1/users/${id}`, { method: 'DELETE' }),
  },

  // Rides
  rides: {
    list: (params?: { status?: string; rider_id?: string; driver_id?: string }) => {
      const query = new URLSearchParams(params || {}).toString();
      return apiFetch(`/api/v1/rides${query ? `?${query}` : ''}`);
    },
    get: (id: string) => apiFetch(`/api/v1/rides/${id}`),
    request: (data: unknown) =>
      apiFetch('/api/v1/rides', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateStatus: (id: string, data: unknown) =>
      apiFetch(`/api/v1/rides/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    accept: (id: string) =>
      apiFetch(`/api/v1/rides/${id}/accept`, { method: 'POST' }),
  },
};
