"use client"

import { useState, useEffect } from "react"
import { challenges } from "@/lib/challenges"
import { ChallengeCard } from "./challenge-card"
import { MessageSquare, Zap } from "lucide-react"

export function ChallengeHub() {
  const [completedChallenges, setCompletedChallenges] = useState<string[]>([])

  useEffect(() => {
    const saved = localStorage.getItem("makeitsay-completed")
    if (saved) {
      setCompletedChallenges(JSON.parse(saved))
    }
  }, [])

  const completedCount = completedChallenges.length

  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex flex-col items-center gap-6 px-4 pt-16 pb-12 text-center">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <MessageSquare className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl text-balance">
            Make It Say
          </h1>
        </div>
        <p className="max-w-md text-base leading-relaxed text-muted-foreground text-pretty">
          Can you outsmart an AI? Each bot has been told to never say a specific
          phrase. Your job is to make them slip up.
        </p>
        {completedCount > 0 && (
          <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary">
            <Zap className="h-4 w-4" />
            <span>
              {completedCount} of {challenges.length} completed
            </span>
          </div>
        )}
      </header>

      <section className="mx-auto grid w-full max-w-4xl gap-6 px-4 pb-16 md:grid-cols-3">
        {challenges.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            completed={completedChallenges.includes(challenge.id)}
          />
        ))}
      </section>
    </main>
  )
}
