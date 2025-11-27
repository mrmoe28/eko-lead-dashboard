"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, MeshDistortMaterial } from "@react-three/drei";
import { Suspense, useRef, useEffect, useState } from "react";
import type { Mesh } from "three";

function AnimatedSphere() {
  const meshRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <Sphere ref={meshRef} args={[1, 100, 200]} scale={2.4}>
      <MeshDistortMaterial
        color="#3b82f6"
        attach="material"
        distort={0.5}
        speed={2}
        roughness={0.2}
        metalness={0.8}
      />
    </Sphere>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -10]} color="#8b5cf6" intensity={0.5} />
      <Suspense fallback={null}>
        <AnimatedSphere />
      </Suspense>
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
    </>
  );
}

function LoadingFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <p className="text-xs text-muted-foreground">Loading 3D scene…</p>
      </div>
    </div>
  );
}

function WebGLNotSupported() {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-border/60 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
      <div className="flex flex-col items-center gap-3 px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
          <svg
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-foreground">3D Preview Unavailable</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          Your device doesn't support WebGL. The experience continues to work perfectly.
        </p>
      </div>
    </div>
  );
}

export function HeroOrbit() {
  const [isWebGLSupported, setIsWebGLSupported] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) {
        setIsWebGLSupported(false);
      }
    } catch (e) {
      console.error("WebGL support check failed:", e);
      setIsWebGLSupported(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (!isWebGLSupported) {
    return <WebGLNotSupported />;
  }

  return (
    <div className="h-full w-full overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-background to-background/40">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
