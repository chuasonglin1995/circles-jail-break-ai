import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <h1 className="text-4xl font-bold text-foreground">Challenge Not Found</h1>
      <p className="text-muted-foreground">
        {"That challenge doesn't exist. Head back to the hub and pick one."}
      </p>
      <Link
        href="/"
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Challenges
      </Link>
    </main>
  )
}
