"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft,
  Send,
  RotateCcw,
  Trophy,
  MessageSquare,
  User,
  Lock,
  Shield,
  Brain,
  Coins,
} from "lucide-react"
import type { Challenge } from "@/lib/challenges"
import { evaluateResponse } from "@/lib/challenges"
import { Confetti } from "./confetti"
import { Button } from "@/components/ui/button"
import { PaymentGate } from "./payment-gate"

const botIcons: Record<string, typeof Lock> = {
  "sweet-talker": Lock,
  "secret-keeper": Shield,
  "rule-breaker": Brain,
}

const imageMap: Record<string, string> = {
  "sweet-talker": "/images/gloria.jpg",
  "secret-keeper": "/images/agent-x.jpg",
  "rule-breaker": "/images/oracle.jpg",
}

const accentMap: Record<string, { bg: string; text: string; border: string; bubble: string }> = {
  "sweet-talker": {
    bg: "bg-chart-1/10",
    text: "text-chart-1",
    border: "border-chart-1/30",
    bubble: "bg-chart-1/5 border-chart-1/15",
  },
  "secret-keeper": {
    bg: "bg-chart-2/10",
    text: "text-chart-2",
    border: "border-chart-2/30",
    bubble: "bg-chart-2/5 border-chart-2/15",
  },
  "rule-breaker": {
    bg: "bg-chart-3/10",
    text: "text-chart-3",
    border: "border-chart-3/30",
    bubble: "bg-chart-3/5 border-chart-3/15",
  },
}

function getUIMessageText(msg: { parts?: Array<{ type: string; text?: string }> }): string {
  if (!msg.parts || !Array.isArray(msg.parts)) return ""
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
}

export function ChallengeChat({ challenge }: { challenge: Challenge }) {
  const [input, setInput] = useState("")
  const [solved, setSolved] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [messageCount, setMessageCount] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Payment state
  const [showPaymentGate, setShowPaymentGate] = useState(false)
  const [pendingMessage, setPendingMessage] = useState("")

  // Message credits and claimed transactions
  const [messagesRemaining, setMessagesRemaining] = useState(0)
  const [claimedTxHashes, setClaimedTxHashes] = useState<Set<string>>(new Set())
  const [isHydrated, setIsHydrated] = useState(false)

  const accent = accentMap[challenge.id] || accentMap["sweet-talker"]
  const BotIcon = botIcons[challenge.id] || Lock

  const transport = useRef(
    new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ id, messages }) => ({
        body: {
          id,
          messages,
          challengeId: challenge.id,
        },
      }),
    })
  )

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: transport.current,
  })

  const isLoading = status === "streaming" || status === "submitted"

  // Load from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem(`jailbreak-messages-${challenge.id}`)
    const savedClaimed = localStorage.getItem(`jailbreak-claimed-${challenge.id}`)

    if (savedMessages) {
      setMessagesRemaining(parseInt(savedMessages, 10))
    }
    if (savedClaimed) {
      try {
        setClaimedTxHashes(new Set(JSON.parse(savedClaimed)))
      } catch {
        // Invalid JSON, ignore
      }
    }
    setIsHydrated(true)
  }, [challenge.id])

  // Save messagesRemaining to localStorage
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(`jailbreak-messages-${challenge.id}`, String(messagesRemaining))
    }
  }, [messagesRemaining, challenge.id, isHydrated])

  // Save claimedTxHashes to localStorage
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(`jailbreak-claimed-${challenge.id}`, JSON.stringify([...claimedTxHashes]))
    }
  }, [claimedTxHashes, challenge.id, isHydrated])

  // Check for solved state
  useEffect(() => {
    if (solved) return
    const lastMsg = messages[messages.length - 1]
    if (lastMsg && lastMsg.role === "assistant") {
      const text = getUIMessageText(lastMsg)
      if (evaluateResponse(text, challenge.targetPhrase)) {
        setSolved(true)
        setShowConfetti(true)
        // Save completion
        const saved = localStorage.getItem("makeitsay-completed")
        const completed: string[] = saved ? JSON.parse(saved) : []
        if (!completed.includes(challenge.id)) {
          completed.push(challenge.id)
          localStorage.setItem("makeitsay-completed", JSON.stringify(completed))
        }
        // Save score
        const scores = localStorage.getItem("makeitsay-scores")
        const scoreMap: Record<string, number> = scores ? JSON.parse(scores) : {}
        if (!scoreMap[challenge.id] || messageCount < scoreMap[challenge.id]) {
          scoreMap[challenge.id] = messageCount
          localStorage.setItem("makeitsay-scores", JSON.stringify(scoreMap))
        }
      }
    }
  }, [messages, solved, challenge.targetPhrase, challenge.id, messageCount])

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Check initial completion
  useEffect(() => {
    const saved = localStorage.getItem("makeitsay-completed")
    if (saved) {
      const completed: string[] = JSON.parse(saved)
      if (completed.includes(challenge.id)) {
        // Already completed before, but allow replay
      }
    }
  }, [challenge.id])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!input.trim() || isLoading) return

      if (messagesRemaining > 0) {
        // Has credits - send directly
        setMessagesRemaining((m) => m - 1)
        setMessageCount((c) => c + 1)
        sendMessage({ text: input })
        setInput("")
      } else {
        // No credits - show payment gate
        setPendingMessage(input)
        setShowPaymentGate(true)
      }
    },
    [input, isLoading, messagesRemaining, sendMessage]
  )

  const handlePaymentConfirmed = useCallback((txHash: string) => {
    // Mark transaction as claimed
    setClaimedTxHashes((prev) => new Set([...prev, txHash]))

    setShowPaymentGate(false)
    setMessagesRemaining(2) // 3 total, 1 being sent now
    setMessageCount((c) => c + 1)
    sendMessage({ text: pendingMessage })
    setInput("")
    setPendingMessage("")
  }, [pendingMessage, sendMessage])

  const handlePaymentCancel = useCallback(() => {
    setShowPaymentGate(false)
    setPendingMessage("")
  }, [])

  const handleReset = useCallback(() => {
    setMessages([])
    setInput("")
    setSolved(false)
    setShowConfetti(false)
    setMessageCount(0)
    inputRef.current?.focus()
  }, [setMessages])

  return (
    <div className="flex h-dvh flex-col bg-background">
      <Confetti active={showConfetti} />

      {/* Payment Gate Modal */}
      {showPaymentGate && (
        <PaymentGate
          claimedTxHashes={claimedTxHashes}
          onPaymentConfirmed={handlePaymentConfirmed}
          onCancel={handlePaymentCancel}
        />
      )}

      {/* Header */}
      <header className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back to challenges</span>
        </Link>

        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent.bg}`}>
          <BotIcon className={`h-5 w-5 ${accent.text}`} />
        </div>

        <div className="flex flex-1 flex-col">
          <h1 className="text-base font-semibold text-foreground">{challenge.title}</h1>
          <p className="text-sm text-muted-foreground">{challenge.botName}</p>
        </div>

        <div className={`hidden items-center gap-2 rounded-lg border px-3 py-1.5 sm:flex ${accent.bg} ${accent.border}`}>
          <span className={`text-sm font-mono uppercase tracking-wider ${accent.text} opacity-70`}>
            Target
          </span>
          <span className={`font-mono text-sm font-semibold ${accent.text}`}>
            {'"'}{challenge.displayPhrase || challenge.targetPhrase}{'"'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            {messageCount}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="sr-only">Reset conversation</span>
          </Button>
        </div>
      </header>

      {/* Mobile target bar */}
      <div className={`flex items-center gap-2 border-b border-border px-4 py-2 sm:hidden ${accent.bg}`}>
        <span className={`text-sm font-mono uppercase tracking-wider ${accent.text} opacity-70`}>
          Target
        </span>
        <span className={`font-mono text-sm font-semibold ${accent.text}`}>
          {'"'}{challenge.displayPhrase || challenge.targetPhrase}{'"'}
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <div className="relative h-24 w-24 overflow-hidden rounded-2xl">
                <Image
                  src={imageMap[challenge.id] || "/images/gloria.jpg"}
                  alt={challenge.botName}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-semibold text-foreground">
                  Chat with {challenge.botName}
                </h2>
                <p className="max-w-sm text-base leading-relaxed text-muted-foreground">
                  {challenge.botDescription}. Try to get them to say{" "}
                  <span className={`font-mono font-semibold ${accent.text}`}>
                    {'"'}{challenge.displayPhrase || challenge.targetPhrase}{'"'}
                  </span>
                </p>
              </div>
            </div>
          )}

          {messages.map((message) => {
            const text = getUIMessageText(message)
            const isUser = message.role === "user"
            const containsTarget =
              !isUser && evaluateResponse(text, challenge.targetPhrase)

            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    isUser ? "bg-secondary" : accent.bg
                  }`}
                >
                  {isUser ? (
                    <User className="h-4 w-4 text-foreground" />
                  ) : (
                    <BotIcon className={`h-4 w-4 ${accent.text}`} />
                  )}
                </div>
                <div
                  className={`relative max-w-[80%] rounded-2xl border px-4 py-3 ${
                    isUser
                      ? "bg-secondary border-border text-foreground"
                      : `${accent.bubble} text-foreground`
                  } ${containsTarget ? "ring-2 ring-success ring-offset-2 ring-offset-background" : ""}`}
                >
                  <p className="text-base leading-relaxed whitespace-pre-wrap">
                    {text}
                  </p>
                  {containsTarget && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-success">
                      <Trophy className="h-3.5 w-3.5" />
                      Target phrase detected!
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-3">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${accent.bg}`}>
                <BotIcon className={`h-4 w-4 ${accent.text}`} />
              </div>
              <div className={`rounded-2xl border px-4 py-3 ${accent.bubble}`}>
                <div className="flex gap-1.5">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Success banner */}
      {solved && (
        <div className="flex items-center justify-center gap-3 border-t border-success/30 bg-success/10 px-4 py-3">
          <Trophy className="h-5 w-5 text-success" />
          <span className="text-base font-semibold text-success">
            Challenge Complete! You did it in {messageCount} message{messageCount !== 1 ? "s" : ""}.
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="ml-2 h-7 border-success/30 text-success hover:bg-success/10 hover:text-success"
          >
            Play Again
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 border-t border-border bg-background px-4 py-3">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-2xl items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              solved
                ? "Challenge complete! Reset to play again..."
                : `Message ${challenge.botName}...`
            }
            disabled={isLoading}
            className="h-11 flex-1 rounded-xl border border-border bg-secondary px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
          />

          {/* Message credits indicator */}
          {isHydrated && (
            <div
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                messagesRemaining > 0
                  ? "bg-success/10 text-success"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Coins className="h-3.5 w-3.5" />
              <span>{messagesRemaining}</span>
            </div>
          )}

          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="h-11 w-11 shrink-0 rounded-xl"
          >
            <Send className="h-5 w-5" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </div>
    </div>
  )
}
