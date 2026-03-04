"use client"

import Image from "next/image"
import Link from "next/link"
import { Lock, Shield, Brain, ArrowRight, Check } from "lucide-react"
import type { Challenge } from "@/lib/challenges"

const imageMap: Record<string, string> = {
  "sweet-talker": "/images/gloria.jpg",
  "secret-keeper": "/images/agent-x.jpg",
  "rule-breaker": "/images/oracle.jpg",
}

const difficultyConfig = {
  easy: { label: "Easy", className: "bg-chart-1/15 text-chart-1 border-chart-1/30" },
  medium: { label: "Medium", className: "bg-chart-2/15 text-chart-2 border-chart-2/30" },
  hard: { label: "Hard", className: "bg-chart-3/15 text-chart-3 border-chart-3/30" },
}

const iconMap = {
  "sweet-talker": Lock,
  "secret-keeper": Shield,
  "rule-breaker": Brain,
}

export function ChallengeCard({
  challenge,
  completed,
}: {
  challenge: Challenge
  completed: boolean
}) {
  const difficulty = difficultyConfig[challenge.difficulty]
  const Icon = iconMap[challenge.id as keyof typeof iconMap] || Lock

  const accentColors = {
    "sweet-talker": {
      border: "border-chart-1/20 hover:border-chart-1/50",
      glow: "hover:shadow-[0_0_40px_-12px] hover:shadow-chart-1/20",
      icon: "text-chart-1 bg-chart-1/10",
      phrase: "bg-chart-1/10 text-chart-1 border-chart-1/20",
    },
    "secret-keeper": {
      border: "border-chart-2/20 hover:border-chart-2/50",
      glow: "hover:shadow-[0_0_40px_-12px] hover:shadow-chart-2/20",
      icon: "text-chart-2 bg-chart-2/10",
      phrase: "bg-chart-2/10 text-chart-2 border-chart-2/20",
    },
    "rule-breaker": {
      border: "border-chart-3/20 hover:border-chart-3/50",
      glow: "hover:shadow-[0_0_40px_-12px] hover:shadow-chart-3/20",
      icon: "text-chart-3 bg-chart-3/10",
      phrase: "bg-chart-3/10 text-chart-3 border-chart-3/20",
    },
  }

  const colors = accentColors[challenge.id as keyof typeof accentColors] || accentColors["sweet-talker"]

  return (
    <Link href={`/challenge/${challenge.id}`}>
      <article
        className={`group relative flex flex-col gap-6 rounded-2xl border bg-card p-6 transition-all duration-300 ${colors.border} ${colors.glow}`}
      >
        {/* Challenge image */}
        <div className="relative -mx-6 -mt-6 mb-0 h-36 overflow-hidden rounded-t-2xl">
          <Image
            src={imageMap[challenge.id] || "/images/gary.jpg"}
            alt={`${challenge.botName} - ${challenge.botDescription}`}
            fill
            priority
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
        </div>

        {completed && (
          <div className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-full bg-success text-primary-foreground">
            <Check className="h-4 w-4" />
          </div>
        )}

        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${colors.icon}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono text-muted-foreground">
                {"#"}{challenge.number}
              </span>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${difficulty.className}`}
              >
                {difficulty.label}
              </span>
            </div>
            <h3 className="text-xl font-semibold tracking-tight text-foreground">
              {challenge.title}
            </h3>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {challenge.tagline}
        </p>

        <div
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 ${colors.phrase}`}
        >
          <span className="text-xs font-mono uppercase tracking-wider opacity-70">
            Target
          </span>
          <span className="font-mono text-sm font-semibold">
            {'"'}{challenge.displayPhrase || challenge.targetPhrase}{'"'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {challenge.botName} &middot; {challenge.botDescription}
          </span>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </article>
    </Link>
  )
}
