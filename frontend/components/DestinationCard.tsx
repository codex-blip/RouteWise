import { useState, useCallback, useRef, useEffect } from 'react';
import type { Location } from '@/types';
import type { Suggestion, RouteResponse } from '@/types';
import { cn } from '@/lib/utils';

interface DestinationCardProps {
  pickup?: Location;
  dropoff?: Location;
  onPickupChange: (location: Location | undefined) => void;
  onDropoffChange: (location: Location | undefined) => void;
  onRequestRide: () => void;
  onRoute?: (route: RouteResponse | null) => void;
  rideStatusMessage?: string;
  ridePhase?: 'idle' | 'driver_en_route' | 'waiting_for_otp' | 'in_trip' | 'completed';
  otpValue?: string;
  otpError?: string;
  onOtpChange?: (value: string) => void;
  onStartRide?: () => void;
}

export default function DestinationCard({
  pickup,
  dropoff,
  onPickupChange,
  onDropoffChange,
  onRequestRide,
  onRoute,
  rideStatusMessage,
  ridePhase = 'idle',
  otpValue = '',
  otpError,
  onOtpChange,
  onStartRide,
}: DestinationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [pickupQuery, setPickupQuery] = useState('');
  const [dropoffQuery, setDropoffQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteResponse | null>(null);
  const hasRouteMetrics =
    routeInfo &&
    Number.isFinite(routeInfo.estimated_fare) &&
    Number.isFinite(routeInfo.distance) &&
    Number.isFinite(routeInfo.duration);

  const pickupInputRef = useRef<HTMLInputElement>(null);
  const dropoffInputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    const query = !pickup ? pickupQuery : dropoffQuery;
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    const t = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${base}/api/v1/navigation/search?q=${encodeURIComponent(query)}&limit=5`);
        const data = await res.json();
        if (!cancelled) setSuggestions(data.results || []);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        if (!cancelled) setLoadingSuggestions(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [pickupQuery, dropoffQuery, pickup]);

  const handleSearchFocus = useCallback(() => {
    setIsExpanded(true);
    setShowSuggestions(true);
  }, []);

  const handleSelectSuggestion = useCallback(
    async (s: Suggestion) => {
      const location: Location = {
        lat: s.center[1],
        lng: s.center[0],
        address: s.place_name,
      };

      if (!pickup) {
        onPickupChange(location);
        setPickupQuery('');
        setTimeout(() => dropoffInputRef.current?.focus(), 50);
      } else {
        onDropoffChange(location);
        setDropoffQuery(s.place_name || '');
        setShowSuggestions(false);
        setIsExpanded(false);
      }

      const currentPickup = !pickup ? location : pickup;
      const currentDropoff = pickup ? location : dropoff;
      if (currentPickup && currentDropoff) {
        try {
          const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          const res = await fetch(`${base}/api/v1/navigation/route`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pickup_lat: currentPickup.lat,
              pickup_lng: currentPickup.lng,
              dropoff_lat: currentDropoff.lat,
              dropoff_lng: currentDropoff.lng,
            }),
          });
          if (!res.ok) {
            setRouteInfo(null);
            if (onRoute) onRoute(null);
            return;
          }

          const data = (await res.json()) as Partial<RouteResponse>;
          const normalized: RouteResponse | null =
            typeof data.encoded_polyline === 'string' &&
            typeof data.distance === 'number' &&
            typeof data.duration === 'number' &&
            typeof data.estimated_fare === 'number'
              ? {
                  encoded_polyline: data.encoded_polyline,
                  distance: data.distance,
                  duration: data.duration,
                  estimated_fare: data.estimated_fare,
                }
              : null;

          setRouteInfo(normalized);
          if (onRoute) onRoute(normalized);
        } catch (err) {
          setRouteInfo(null);
          if (onRoute) onRoute(null);
          console.error('Route error', err);
        }
      }
    },
    [pickup, dropoff, onPickupChange, onDropoffChange, onRoute]
  );

  const handleRequestRide = useCallback(() => {
    if (!pickup || !dropoff) return;
    onRequestRide();
  }, [pickup, dropoff, onRequestRide]);

  const handleUseCurrentLocation = useCallback(() => {
    onPickupChange({
      lat: 37.7749,
      lng: -122.4194,
      address: 'Current Location, San Francisco, CA',
    });
  }, [onPickupChange]);

  const handleClear = useCallback(() => {
    onPickupChange(undefined);
    onDropoffChange(undefined);
    setPickupQuery('');
    setDropoffQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setRouteInfo(null);
    if (onRoute) onRoute(null);
  }, [onPickupChange, onRoute]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.destination-card')) {
        setShowSuggestions(false);
        if (!dropoff) {
          setIsExpanded(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropoff]);

  const hasPickup = !!pickup;
  const hasDropoff = !!dropoff;
  const canRequestRide = hasPickup && hasDropoff;

  return (
    <div
      className={cn(
        'destination-card absolute left-4 right-4 bottom-6 md:left-6 md:right-auto md:w-[400px] md:top-6 md:bottom-auto',
        'transition-all duration-300 ease-out'
      )}
    >
      <div
        className={cn(
          'bg-white rounded-2xl shadow-floating overflow-hidden',
          'transition-all duration-300',
          isExpanded ? 'max-h-[600px]' : 'max-h-[200px]'
        )}
      >
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {!hasPickup ? 'Set pickup location' : !hasDropoff ? 'Where to?' : 'Ready to ride'}
            </h2>
            {(hasPickup || hasDropoff) && (
              <button onClick={handleClear} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                Reset
              </button>
            )}
          </div>
        </div>

        {hasPickup && (
          <div className="px-5 py-3 bg-gray-50 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Pickup</div>
              <div className="text-sm text-gray-900 truncate">{pickup.address || `${pickup.lat.toFixed(4)}, ${pickup.lng.toFixed(4)}`}</div>
            </div>
          </div>
        )}

        <div className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div className={cn('w-2 h-2 rounded-full flex-shrink-0', !hasPickup ? 'bg-green-500' : 'bg-blue-500')} />

            <input
              ref={pickupInputRef}
              type="text"
              value={pickup ? pickup.address || '' : pickupQuery}
              onChange={(e) => setPickupQuery(e.target.value)}
              onFocus={handleSearchFocus}
              placeholder={'Search pickup location...'}
              className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-base"
            />

            {!hasPickup && (
              <button onClick={handleUseCurrentLocation} className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors" title="Use current location">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
          </div>

          <div className="mt-3">
            <input
              ref={dropoffInputRef}
              type="text"
              value={dropoff ? dropoff.address || '' : dropoffQuery}
              onChange={(e) => setDropoffQuery(e.target.value)}
              onFocus={handleSearchFocus}
              placeholder={'Enter destination...'}
              className="w-full bg-transparent text-gray-900 placeholder-gray-400 outline-none text-base"
            />
          </div>
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="border-t border-gray-100 max-h-[300px] overflow-y-auto">
            <div className="px-5 py-2 text-xs text-gray-500 uppercase tracking-wide bg-gray-50">Search results</div>
            {suggestions.map((s) => (
              <button key={s.id} onClick={() => handleSelectSuggestion(s)} className="w-full px-5 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left">
                <div className="mt-0.5 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{s.text || s.place_name}</div>
                  <div className="text-xs text-gray-500 truncate">{s.place_name}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Summary + Action */}
        {routeInfo && (
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-600">Estimated fare</div>
                <div className="text-lg font-semibold text-gray-900">
                  {hasRouteMetrics ? `$${routeInfo.estimated_fare.toFixed(2)}` : '--'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-600">Distance</div>
                <div className="text-sm text-gray-900">
                  {hasRouteMetrics ? `${(routeInfo.distance / 1000).toFixed(2)} km` : '--'}
                </div>
                <div className="text-xs text-gray-600">Duration</div>
                <div className="text-sm text-gray-900">
                  {hasRouteMetrics ? `${Math.round(routeInfo.duration / 60)} min` : '--'}
                </div>
              </div>
            </div>
            <div className="mt-3">
              <button onClick={handleRequestRide} className="w-full py-3.5 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 active:bg-gray-900 transition-colors duration-200">Confirm Ride</button>
            </div>
            {rideStatusMessage && (
              <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                {rideStatusMessage}
              </div>
            )}

            {ridePhase === 'waiting_for_otp' && (
              <div className="mt-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">OTP verification</div>
                <div className="mt-1 text-sm text-gray-700">Demo code: <span className="font-semibold text-gray-900">1234</span></div>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    value={otpValue}
                    onChange={(e) => onOtpChange?.(e.target.value)}
                    inputMode="numeric"
                    placeholder="Enter OTP"
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-black"
                  />
                  <button
                    onClick={onStartRide}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700"
                  >
                    Start Ride
                  </button>
                </div>
                {otpError && <div className="mt-2 text-sm text-red-600">{otpError}</div>}
              </div>
            )}

            {ridePhase === 'in_trip' && (
              <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                Ride in progress. Follow the moving car on the map.
              </div>
            )}

            {ridePhase === 'completed' && (
              <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                Trip completed.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
