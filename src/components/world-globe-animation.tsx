"use client";

import { useRef } from "react";

interface Country {
  id: string;
  name: string;
  x: number; // Longitude-based position (0-100)
  y: number; // Latitude-based position (0-100)
}

export function WorldGlobeAnimation() {
  const svgRef = useRef<SVGSVGElement>(null);

  // Major countries with their positions (normalized to 0-100 for SVG)
  // Positions approximate world map coordinates
  const countries: Country[] = [
    { id: "usa", name: "USA", x: 25, y: 45 },
    { id: "uk", name: "UK", x: 48, y: 30 },
    { id: "france", name: "France", x: 48, y: 35 },
    { id: "germany", name: "Germany", x: 50, y: 32 },
    { id: "japan", name: "Japan", x: 85, y: 40 },
    { id: "china", name: "China", x: 75, y: 38 },
    { id: "india", name: "India", x: 68, y: 50 },
    { id: "uae", name: "UAE", x: 60, y: 48 },
    { id: "australia", name: "Australia", x: 82, y: 75 },
    { id: "spain", name: "Spain", x: 46, y: 38 },
    { id: "brazil", name: "Brazil", x: 32, y: 65 },
    { id: "canada", name: "Canada", x: 25, y: 25 },
  ];

  // Generate latitude lines (parallels) - horizontal ellipses that wrap around
  const generateLatitudeLines = () => {
    const lines = [];
    const centerX = 50;
    const centerY = 50;
    const radius = 45;
    
    // Create latitude lines at different latitudes
    const latitudes = [-75, -60, -45, -30, -15, 0, 15, 30, 45, 60, 75]; // Degrees
    
    latitudes.forEach((lat) => {
      // Convert latitude to y position (0-100)
      const latRad = (lat * Math.PI) / 180;
      const yPos = centerY - Math.sin(latRad) * radius;
      
      // Calculate ellipse width based on latitude
      // Lines get smaller as they approach the poles (cosine of latitude)
      const cosLat = Math.cos(latRad);
      const ellipseWidth = Math.abs(cosLat) * radius * 2;
      
      // Only draw if within the visible globe area
      if (yPos > centerY - radius && yPos < centerY + radius && ellipseWidth > 5) {
        lines.push(
          <ellipse
            key={`lat-${lat}`}
            cx={centerX}
            cy={yPos}
            rx={ellipseWidth / 2}
            ry={0.5}
            fill="none"
            stroke="rgba(59, 130, 246, 0.4)"
            strokeWidth="0.3"
          />
        );
      }
    });
    
    return lines;
  };

  // Generate longitude lines (meridians) - vertical curves that wrap around the globe
  const generateLongitudeLines = () => {
    const lines = [];
    const centerX = 50;
    const centerY = 50;
    const radius = 45;
    
    // Create longitude lines at different longitudes
    const longitudes = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150]; // Degrees
    
    longitudes.forEach((lon) => {
      // Create a curved path that wraps around the globe
      // Longitude lines are great circles (meridians)
      const points: string[] = [];
      const numPoints = 100;
      
      for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        const phi = t * Math.PI; // 0 to π (from top to bottom)
        
        // Convert spherical coordinates to 2D projection
        const lonRad = (lon * Math.PI) / 180;
        
        // Calculate position on the sphere surface
        const x = centerX + radius * Math.sin(phi) * Math.cos(lonRad);
        const y = centerY - radius * Math.cos(phi);
        
        // Only include points within the visible circle
        const distFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        if (distFromCenter <= radius + 1) {
          if (i === 0 || points.length === 0) {
            points.push(`M ${x} ${y}`);
          } else {
            points.push(`L ${x} ${y}`);
          }
        }
      }
      
      if (points.length > 1) {
        lines.push(
          <path
            key={`lon-${lon}`}
            d={points.join(" ")}
            fill="none"
            stroke="rgba(59, 130, 246, 0.4)"
            strokeWidth="0.3"
          />
        );
      }
    });
    
    return lines;
  };

  return (
    <div className="h-full w-full overflow-hidden rounded-2xl border border-border/60 bg-black relative">
      {/* Background stars effect */}
      <div className="absolute inset-0 opacity-30">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Subtle background glow effect - minimal for black background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-cyan-500/5 to-purple-500/5" />
      
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Globe gradient */}
          <radialGradient id="globeGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.3)" />
            <stop offset="50%" stopColor="rgba(30, 58, 138, 0.2)" />
            <stop offset="100%" stopColor="rgba(15, 23, 42, 0.4)" />
          </radialGradient>

          {/* Glow filter for countries */}
          <filter id="countryGlow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Solid black background circle behind globe */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="#000000"
        />


        {/* Longitude lines (meridians) - vertical curves wrapping around the globe */}
        {generateLongitudeLines()}

        {/* Latitude lines (parallels) - horizontal ellipses */}
        {generateLatitudeLines()}

        {/* Country outlines and markers */}
        {countries.map((country) => {
          // Simplified country outline shapes
          const getCountryOutline = (countryId: string) => {
            const baseSize = 3;
            switch (countryId) {
              case "usa":
                return <ellipse cx={country.x} cy={country.y} rx={baseSize * 2.5} ry={baseSize * 1.5} fill="none" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="0.3" />;
              case "uk":
                return <ellipse cx={country.x} cy={country.y} rx={baseSize * 0.8} ry={baseSize * 1.2} fill="none" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="0.3" />;
              case "france":
                return <rect x={country.x - baseSize * 1.2} y={country.y - baseSize * 1.5} width={baseSize * 2.4} height={baseSize * 3} fill="none" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="0.3" rx="0.5" />;
              case "germany":
                return <rect x={country.x - baseSize * 1.5} y={country.y - baseSize * 1.2} width={baseSize * 3} height={baseSize * 2.4} fill="none" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="0.3" rx="0.5" />;
              case "japan":
                return <ellipse cx={country.x} cy={country.y} rx={baseSize * 1.2} ry={baseSize * 1.8} fill="none" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="0.3" />;
              case "china":
                return <ellipse cx={country.x} cy={country.y} rx={baseSize * 3} ry={baseSize * 2.5} fill="none" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="0.3" />;
              case "india":
                return <ellipse cx={country.x} cy={country.y} rx={baseSize * 2} ry={baseSize * 2.5} fill="none" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="0.3" />;
              case "uae":
                return <rect x={country.x - baseSize * 0.8} y={country.y - baseSize * 0.6} width={baseSize * 1.6} height={baseSize * 1.2} fill="none" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="0.3" rx="0.3" />;
              case "australia":
                return <ellipse cx={country.x} cy={country.y} rx={baseSize * 2.5} ry={baseSize * 2} fill="none" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="0.3" />;
              case "spain":
                return <rect x={country.x - baseSize * 1} y={country.y - baseSize * 1.2} width={baseSize * 2} height={baseSize * 2.4} fill="none" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="0.3" rx="0.4" />;
              case "brazil":
                return <ellipse cx={country.x} cy={country.y} rx={baseSize * 2} ry={baseSize * 2.8} fill="none" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="0.3" />;
              case "canada":
                return <ellipse cx={country.x} cy={country.y} rx={baseSize * 2.5} ry={baseSize * 3} fill="none" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="0.3" />;
              default:
                return <circle cx={country.x} cy={country.y} r={baseSize} fill="none" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="0.3" />;
            }
          };

          return (
            <g key={country.id}>
              {/* Country outline */}
              {getCountryOutline(country.id)}
              {/* Outer glow ring */}
              <circle
                cx={country.x}
                cy={country.y}
                r="2.5"
                fill="rgba(59, 130, 246, 0.2)"
                className="animate-electric-pulse"
              />
              {/* Country marker */}
              <circle
                cx={country.x}
                cy={country.y}
                r="1.8"
                fill="#60a5fa"
                filter="url(#countryGlow)"
                className="animate-circuit-node"
              />
              {/* Inner core */}
              <circle
                cx={country.x}
                cy={country.y}
                r="1"
                fill="#34d399"
                className="animate-electric-pulse"
              />
            </g>
          );
        })}
      </svg>

      {/* Minimal overlay for depth on black background */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
    </div>
  );
}

