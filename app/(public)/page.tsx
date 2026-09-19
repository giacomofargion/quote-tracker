'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, ChevronDown, FolderPlus, Timer, BarChart2 } from "lucide-react"
import { motion } from "framer-motion"

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

const stepContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
}

const stepItem = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

export default function LandingPage() {
  const scrollToSteps = () => {
    document.getElementById("how-it-works")?.scrollIntoView({
      behavior: "smooth",
    })
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-[#0a0c10] text-white selection:bg-primary/30">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between px-6 py-5 md:px-12"
      >
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
      </motion.nav>

      {/* Background Effects — clipped so the blurred orbs cannot widen the page */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.6, scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute top-[-30%] left-[-20%] h-[80%] w-[80%] rounded-full bg-primary/15 blur-[150px]"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.2, scale: 1 }}
          transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
          className="absolute right-[-20%] bottom-[-30%] h-[70%] w-[70%] rounded-full bg-indigo-600/10 blur-[150px]"
        />
      </div>

      {/* Hero Section - full viewport height, content centered */}
      <main className="relative z-10 flex h-screen flex-col px-4 py-16">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex w-full flex-col items-center space-y-8"
          >
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="font-sans text-6xl leading-[0.95] font-bold tracking-tighter sm:text-7xl md:text-8xl"
              style={{ fontSize: "clamp(3rem, 10vw, 6rem)" }}
            >
              <span className="block">Where quotes</span>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.6 }}
                className="block bg-linear-to-r from-white via-white/80 to-white/30 bg-clip-text text-transparent"
              >
                become reality.
              </motion.span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
              className="mx-auto max-w-xl text-base leading-relaxed text-gray-400 sm:text-lg md:text-xl"
            >
              Track your real hourly rate on quoted projects
              <br />
              and master your freelance business.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
              className="pt-4"
            >
              <Link href="/sign-up?redirect_url=/dashboard">
                <Button
                  size="lg"
                  className="group h-14 rounded-full bg-white px-8 text-base font-medium text-black shadow-2xl shadow-white/10 transition-all hover:bg-gray-100 hover:shadow-white/20 sm:text-lg"
                >
                  Begin Tracking
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </motion.div>

            <motion.button
              type="button"
              onClick={scrollToSteps}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="mt-6 flex flex-col items-center gap-1 text-gray-500 transition-colors hover:text-gray-400"
              aria-label="Scroll to see how it works"
            >
              <span className="text-sm font-medium">See how it works</span>
              <motion.span
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <ChevronDown className="h-5 w-5" />
              </motion.span>
            </motion.button>
          </motion.div>
        </div>
      </main>

      <section
        id="how-it-works"
        className="relative z-10 scroll-mt-24 px-4 py-24 md:py-32"
      >
        <div className="mx-auto max-w-5xl">
          <motion.div
            variants={stepContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid gap-12 md:grid-cols-3 md:gap-8"
          >
            {STEPS.map(({ icon: Icon, title, description }) => (
              <motion.div
                key={title}
                variants={stepItem}
                className="flex flex-col"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-sans text-lg font-bold text-white md:text-xl">
                  {title}
                </h3>
                <p className="mt-2 leading-relaxed text-gray-400">
                  {description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  )
}
