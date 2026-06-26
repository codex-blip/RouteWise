"use client";

import React, { useEffect, useRef, useMemo, useState } from "react";
import Globe from "react-globe.gl";

interface City {
  name: string;
  lat: number;
  lng: number;
}

const CITIES: City[] = [
  { name: "NYC", lat: 40.7128, lng: -74.006 },
  { name: "LDN", lat: 51.5074, lng: -0.1278 },
  { name: "TYO", lat: 35.6762, lng: 139.6503 },
  { name: "BER", lat: 52.52, lng: 13.405 },
  { name: "PAR", lat: 48.8566, lng: 2.3522 },
  { name: "SFO", lat: 37.7749, lng: -122.4194 },
  { name: "SIN", lat: 1.3521, lng: 103.8198 },
  { name: "DXB", lat: 25.2048, lng: 55.2708 },
  { name: "SYD", lat: -33.8688, lng: 151.2093 },
  { name: "MEX", lat: 19.4326, lng: -99.1332 },
  { name: "BOM", lat: 19.076, lng: 72.8777 },
  { name: "GRU", lat: -23.5505, lng: -46.6333 },
];

interface RouteGlobeProps {
  size?: number;
}

const RouteGlobe = ({ size = 520 }: RouteGlobeProps) => {
  const globeRef = useRef<any>();
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const arcs = useMemo(() => {
    const data = [];
    for (let i = 0; i < CITIES.length; i++) {
      const start = CITIES[i];
      const end = CITIES[(i + 3) % CITIES.length];
      data.push({
        startLat: start.lat,
        startLng: start.lng,
        endLat: end.lat,
        endLng: end.lng,
        color: "#CCFF00",
      });
    }
    return data;
  }, []);

  const points = useMemo(
    () =>
      CITIES.map((c) => ({
        lat: c.lat,
        lng: c.lng,
        size: 0.4,
        color: "#FFFFFF",
        label: c.name,
      })),
    [],
  );

  useEffect(() => {
    if (!mounted) return;
    const t = setTimeout(() => {
      if (globeRef.current) {
        const controls = globeRef.current.controls();
        if (controls) {
          controls.autoRotate = true;
          controls.autoRotateSpeed = 0.6;
          controls.enableZoom = false;
        }
        globeRef.current.pointOfView({ lat: 22, lng: 8, altitude: 2.2 }, 0);
      }
    }, 50);
    return () => clearTimeout(t);
  }, [mounted]);

  if (!mounted) {
    return (
      <div 
        style={{ width: size, height: size, maxWidth: "100%" }} 
        className="flex items-center justify-center text-white/30 font-mono text-xs uppercase tracking-[0.2em]"
      >
        Loading globe…
      </div>
    );
  }

  return (
    <div data-testid="hero-3d-globe" style={{ width: size, height: size, maxWidth: "100%" }}>
      <Globe
        ref={globeRef}
        width={size}
        height={size}
        backgroundColor="rgba(0,0,0,0)"
        showAtmosphere={true}
        atmosphereColor="#CCFF00"
        atmosphereAltitude={0.12}
        globeImageUrl={null}
        showGlobe={true}
        globeMaterial={undefined}
        pointsData={points}
        pointAltitude={0.01}
        pointColor={(d: any) => d.color}
        pointRadius={0.6}
        arcsData={arcs}
        arcColor={(d: any) => d.color}
        arcDashLength={0.5}
        arcDashGap={0.25}
        arcDashAnimateTime={2200}
        arcStroke={0.4}
        arcAltitudeAutoScale={0.45}
        onGlobeReady={() => {
          if (globeRef.current) {
            try {
              const mat = globeRef.current.globeMaterial();
              if (mat) {
                mat.color.set("#0a0a0a");
                mat.emissive && mat.emissive.set("#000000");
              }
            } catch (_e) {
              /* noop */
            }
          }
        }}
      />
    </div>
  );
};

export default RouteGlobe;
