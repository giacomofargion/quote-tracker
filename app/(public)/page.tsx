import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, ChevronDown, FolderPlus, Timer, BarChart2 } from "lucide-react"

const STEPS = [
  {
    icon: FolderPlus,
    title: "Create a project",
    description:
      "Set your quote and scope. One project per client or deliverable.",
  },
  {
    icon: Timer,
    title: "Log your time",
    description:
      "Track sessions with the stopwatch or add time manually. Precision built for fixed-price workflows.",
  },
  {
    icon: BarChart2,
    title: "See your rate",
    description:
      "Your effective hourly rate appears instantly. Spot over-delivery and adjust.",
  },
] as const

export default function LandingPage() {
  return (
    <div className="min-h-screen scroll-smooth bg-[#0a0c10] text-white selection:bg-primary/30">
      {/* Navigation */}
      <nav className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between px-6 py-5 md:px-12">
        <span className="font-sans text-xl font-bold tracking-tight">QuoteReality</span>

        <div className="flex items-center gap-4">
          <Link href="/sign-in?redirect_url=/dashboard">
            <Button variant="ghost" className="text-gray-300 hover:bg-white/5 hover:text-white">
              Login
            </Button>
          </Link>
          <Link href="/sign-up?redirect_url=/dashboard">
            <Button className="rounded-full bg-white px-6 text-black hover:bg-gray-200">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Background Effects */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-30%] left-[-20%] h-[80%] w-[80%] rounded-full bg-primary/15 blur-[150px]" />
        <div className="absolute right-[-20%] bottom-[-30%] h-[70%] w-[70%] rounded-full bg-indigo-600/10 blur-[150px]" />
      </div>

      {/* Hero Section - full viewport height, content centered */}
      <main className="relative z-10 flex h-screen flex-col px-4 py-16">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center text-center">
          <div className="flex w-full flex-col items-center space-y-8">
            <h1
              className="font-sans text-6xl leading-[0.95] font-bold tracking-tighter sm:text-7xl md:text-8xl"
              style={{ fontSize: "clamp(3rem, 10vw, 6rem)" }}
            >
              <span className="block">Where quotes</span>
              <span className="block bg-linear-to-r from-white via-white/80 to-white/30 bg-clip-text text-transparent">
                become reality.
              </span>
            </h1>

            <p className="mx-auto max-w-xl text-base leading-relaxed text-gray-400 sm:text-lg md:text-xl">
              Track your real hourly rate on quoted projects
              <br />
              and master your freelance business.
            </p>

            <div className="pt-4">
              <Link href="/sign-up?redirect_url=/dashboard">
                <Button
                  size="lg"
                  className="group h-14 rounded-full bg-white px-8 text-base font-medium text-black shadow-2xl shadow-white/10 transition-all hover:bg-gray-100 hover:shadow-white/20 sm:text-lg"
                >
                  Begin Tracking
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>

            <a
              href="#how-it-works"
              className="mt-6 flex flex-col items-center gap-1 text-gray-500 transition-colors hover:text-gray-400"
            >
              <span className="text-sm font-medium">See how it works</span>
              <ChevronDown className="h-5 w-5" />
            </a>
          </div>
        </div>
      </main>

      <section
        id="how-it-works"
        className="relative z-10 scroll-mt-24 px-4 py-24 md:py-32"
      >
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-12 md:grid-cols-3 md:gap-8">
            {STEPS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex flex-col">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-sans text-lg font-bold text-white md:text-xl">
                  {title}
                </h3>
                <p className="mt-2 leading-relaxed text-gray-400">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
