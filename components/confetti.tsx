"use client"

import { useEffect, useState } from "react"

interface Particle {
  id: number
  x: number
  y: number
  rotation: number
  color: string
  size: number
  speedX: number
  speedY: number
  rotationSpeed: number
  opacity: number
}

const COLORS = [
  "oklch(0.75 0.18 155)",
  "oklch(0.7 0.2 35)",
  "oklch(0.7 0.15 185)",
  "oklch(0.65 0.18 280)",
  "oklch(0.85 0.15 90)",
]

export function Confetti({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (!active) return

    const newParticles: Particle[] = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      rotation: Math.random() * 360,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 6 + Math.random() * 8,
      speedX: (Math.random() - 0.5) * 3,
      speedY: 2 + Math.random() * 4,
      rotationSpeed: (Math.random() - 0.5) * 10,
      opacity: 1,
    }))

    setParticles(newParticles)

    const timeout = setTimeout(() => {
      setParticles([])
    }, 4000)

    return () => clearTimeout(timeout)
  }, [active])

  if (particles.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size * 0.6}px`,
            backgroundColor: p.color,
            borderRadius: "2px",
            transform: `rotate(${p.rotation}deg)`,
            animationDelay: `${p.id * 30}ms`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        />
      ))}
    </div>
  )
}
