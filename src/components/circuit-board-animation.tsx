"use client";

import { useEffect, useRef, useState } from "react";

interface CircuitNode {
  id: string;
  x: number;
  y: number;
  connections: string[];
}

interface Spark {
  id: string;
  from: string;
  to: string;
  progress: number;
  delay: number;
}

export function CircuitBoardAnimation() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const animationFrameRef = useRef<number>();

  // Define circuit nodes in a loop pattern
  const nodes: CircuitNode[] = [
    { id: "node1", x: 20, y: 20, connections: ["node2"] },
    { id: "node2", x: 50, y: 20, connections: ["node3"] },
    { id: "node3", x: 80, y: 20, connections: ["node4"] },
    { id: "node4", x: 80, y: 50, connections: ["node5"] },
    { id: "node5", x: 80, y: 80, connections: ["node6"] },
    { id: "node6", x: 50, y: 80, connections: ["node7"] },
    { id: "node7", x: 20, y: 80, connections: ["node8"] },
    { id: "node8", x: 20, y: 50, connections: ["node1"] },
  ];

  // Calculate paths between nodes
  const paths = nodes.flatMap((node) =>
    node.connections.map((targetId) => {
      const target = nodes.find((n) => n.id === targetId);
      if (!target) return null;
      return {
        from: node,
        to: target,
        id: `${node.id}-${targetId}`,
      };
    })
  ).filter(Boolean) as Array<{ from: CircuitNode; to: CircuitNode; id: string }>;

  useEffect(() => {
    // Initialize sparks
    const initialSparks: Spark[] = paths.map((path, index) => ({
      id: `spark-${path.id}`,
      from: path.from.id,
      to: path.to.id,
      progress: 0,
      delay: index * 0.3, // Stagger the sparks
    }));

    setSparks(initialSparks);

    // Animation loop
    const animate = () => {
      setSparks((prevSparks) =>
        prevSparks.map((spark) => {
          let newProgress = spark.progress;
          let newDelay = spark.delay;

          if (newDelay > 0) {
            newDelay -= 0.02;
          } else {
            newProgress += 0.015; // Speed of electricity
            if (newProgress >= 1) {
              newProgress = 0;
              newDelay = 0;
            }
          }

          return {
            ...spark,
            progress: newProgress,
            delay: newDelay,
          };
        })
      );

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Convert percentage to SVG coordinates
  const getPointOnPath = (
    from: CircuitNode,
    to: CircuitNode,
    progress: number
  ) => {
    const x = from.x + (to.x - from.x) * progress;
    const y = from.y + (to.y - from.y) * progress;
    return { x, y };
  };

  return (
    <div className="h-full w-full overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative">
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-cyan-500/5" />
      
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Circuit board background pattern */}
        <defs>
          <pattern
            id="circuitPattern"
            x="0"
            y="0"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <rect width="10" height="10" fill="rgba(30, 41, 59, 0.3)" />
            <circle cx="5" cy="5" r="0.5" fill="rgba(59, 130, 246, 0.2)" />
          </pattern>

          {/* Glow filter for nodes */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="1" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Electric spark gradient */}
          <linearGradient id="electricGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#a78bfa" stopOpacity="1" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Background pattern */}
        <rect width="100" height="100" fill="url(#circuitPattern)" />

        {/* Circuit paths */}
        {paths.map((path) => {
          const from = path.from;
          const to = path.to;
          return (
            <g key={path.id}>
              {/* Main path line */}
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="rgba(59, 130, 246, 0.2)"
                strokeWidth="0.3"
                strokeLinecap="round"
              />
              {/* Glowing path with electric flow */}
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="rgba(59, 130, 246, 0.3)"
                strokeWidth="0.6"
                strokeLinecap="round"
                className="animate-electric-pulse"
              />
              {/* Electric flow animation */}
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="rgba(96, 165, 250, 0.6)"
                strokeWidth="0.4"
                strokeLinecap="round"
                className="animate-electric-flow"
              />
            </g>
          );
        })}

        {/* Circuit nodes */}
        {nodes.map((node) => (
          <g key={node.id}>
            {/* Outer glow ring */}
            <circle
              cx={node.x}
              cy={node.y}
              r="2.5"
              fill="rgba(59, 130, 246, 0.15)"
              className="animate-electric-pulse"
            />
            {/* Node circle */}
            <circle
              cx={node.x}
              cy={node.y}
              r="1.5"
              fill="rgba(59, 130, 246, 0.5)"
              filter="url(#glow)"
              className="animate-circuit-node"
            />
            {/* Inner core */}
            <circle
              cx={node.x}
              cy={node.y}
              r="0.8"
              fill="#60a5fa"
              className="animate-electric-pulse"
            />
          </g>
        ))}

        {/* Electric sparks */}
        {sparks.map((spark) => {
          if (spark.delay > 0) return null;

          const fromNode = nodes.find((n) => n.id === spark.from);
          const toNode = nodes.find((n) => n.id === spark.to);

          if (!fromNode || !toNode) return null;

          const position = getPointOnPath(fromNode, toNode, spark.progress);

          return (
            <g key={spark.id}>
              {/* Main spark with enhanced glow */}
              <circle
                cx={position.x}
                cy={position.y}
                r="1.5"
                fill="url(#electricGradient)"
                opacity="1"
                className="animate-spark-glow"
              >
                <animate
                  attributeName="r"
                  values="1.2;2;1.2"
                  dur="0.25s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="1;0.7;1"
                  dur="0.25s"
                  repeatCount="indefinite"
                />
              </circle>
              {/* Spark trail */}
              <circle
                cx={position.x}
                cy={position.y}
                r="0.8"
                fill="#60a5fa"
                opacity="0.9"
              />
              {/* Outer glow effect */}
              <circle
                cx={position.x}
                cy={position.y}
                r="2.5"
                fill="#60a5fa"
                opacity="0.4"
                className="animate-ping"
              />
              {/* Additional spark particles */}
              <circle
                cx={position.x}
                cy={position.y}
                r="0.4"
                fill="#a78bfa"
                opacity="0.6"
              >
                <animate
                  attributeName="r"
                  values="0.3;0.6;0.3"
                  dur="0.2s"
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          );
        })}

        {/* Additional decorative circuit elements */}
        {nodes.map((node, index) => {
          if (index % 2 === 0) return null;
          return (
            <g key={`decor-${node.id}`}>
              <rect
                x={node.x - 1}
                y={node.y - 0.5}
                width="2"
                height="1"
                fill="rgba(59, 130, 246, 0.2)"
                rx="0.2"
                className="animate-pulse"
                style={{ animationDelay: `${index * 0.2}s` }}
              />
            </g>
          );
        })}
      </svg>

      {/* Overlay gradient for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent pointer-events-none" />
    </div>
  );
}

