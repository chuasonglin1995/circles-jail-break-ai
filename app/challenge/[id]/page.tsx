import { notFound } from "next/navigation"
import { getChallengeById, challenges } from "@/lib/challenges"
import { ChallengeChat } from "@/components/challenge-chat"
import type { Metadata } from "next"

export function generateStaticParams() {
  return challenges.map((c) => ({ id: c.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const challenge = getChallengeById(id)
  if (!challenge) return {}
  return {
    title: `${challenge.title} | Make It Say`,
    description: `Can you get ${challenge.botName} to say "${challenge.targetPhrase}"? ${challenge.tagline}`,
  }
}

export default async function ChallengePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const challenge = getChallengeById(id)

  if (!challenge) {
    notFound()
  }

  return <ChallengeChat challenge={challenge} />
}
