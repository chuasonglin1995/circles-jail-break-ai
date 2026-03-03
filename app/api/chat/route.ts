import {
  consumeStream,
  convertToModelMessages,
  streamText,
  UIMessage,
} from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { getChallengeById, evaluateResponse } from "@/lib/challenges"

export const maxDuration = 30

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: Request) {
  const {
    messages,
    challengeId,
  }: { messages: UIMessage[]; challengeId: string } = await req.json()

  const challenge = getChallengeById(challengeId)

  if (!challenge) {
    return new Response("Challenge not found", { status: 404 })
  }

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: challenge.systemPrompt,
    messages: await convertToModelMessages(messages),
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: async ({ messages: allMessages, isAborted }) => {
      if (isAborted) return
      const lastMessage = allMessages[allMessages.length - 1]
      if (lastMessage && lastMessage.role === "assistant") {
        const text = lastMessage.parts
          ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
          .map((p) => p.text)
          .join("") || ""
        const solved = evaluateResponse(text, challenge.targetPhrase)
        if (solved) {
          // The client will check for the phrase match as well
        }
      }
    },
    consumeSseStream: consumeStream,
  })
}
