'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogoMark } from "@/components/logo-mark"
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
    <div className="min-h-screen bg-[#0a0c10] text-white selection:bg-primary/30">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 md:px-12"
      >
        <div className="flex items-center gap-2">
          <LogoMark size="md" />
          <span className="text-xl font-sans font-bold tracking-tight">QuoteReality</span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/sign-in?redirect_url=/dashboard">
            <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/5">
              Login
            </Button>
          </Link>
          <Link href="/sign-up?redirect_url=/dashboard">
            <Button className="bg-white text-black hover:bg-gray-200 rounded-full px-6">
              Get Started
            </Button>
          </Link>
        </div>
      </motion.nav>

      {/* Background Effects */}
      <div className="fixed inset-0 z-0">
        {/* Blue glow - top left */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.6, scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute top-[-30%] left-[-20%] w-[80%] h-[80%] bg-primary/15 rounded-full blur-[150px]"
        />
        {/* Subtle glow - bottom right */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.2, scale: 1 }}
          transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
          className="absolute bottom-[-30%] right-[-20%] w-[70%] h-[70%] bg-indigo-600/10 rounded-full blur-[150px]"
        />
        {/* Noise texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02]" />
      </div>

      {/* Hero Section - full viewport height, content centered */}
      <main className="relative z-10 h-screen flex flex-col px-4 py-16">
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-5xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-8 w-full flex flex-col items-center"
          >
            {/* Main Heading - fixed large size so it matches in all browsers */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="text-6xl sm:text-7xl md:text-8xl font-sans font-bold tracking-tighter leading-[0.95]"
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

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
              className="max-w-xl mx-auto text-base sm:text-lg md:text-xl text-gray-400 leading-relaxed"
            >
              Track your real hourly rate on quoted projects
              <br />
              and master your freelance business.
            </motion.p>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
              className="pt-4"
            >
              <Link href="/sign-up?redirect_url=/dashboard">
                <Button
                  size="lg"
                  className="h-14 px-8 rounded-full bg-white text-black hover:bg-gray-100 text-base sm:text-lg font-medium group transition-all shadow-2xl shadow-white/10 hover:shadow-white/20"
                >
                  Begin Tracking
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>

            {/* Scroll hint — directly under CTA */}
            <motion.button
              type="button"
              onClick={scrollToSteps}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="mt-6 flex flex-col items-center gap-1 text-gray-500 hover:text-gray-400 transition-colors"
              aria-label="Scroll to see how it works"
            >
              <span className="text-sm font-medium">See how it works</span>
              <motion.span
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <ChevronDown className="w-5 h-5" />
              </motion.span>
            </motion.button>
          </motion.div>
        </div>
      </main>

      {/* How it works — 3 steps */}
      <section
        id="how-it-works"
        className="relative z-10 scroll-mt-24 px-4 py-24 md:py-32"
      >
        <div className="max-w-5xl mx-auto">
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
                <p className="mt-2 text-gray-400 leading-relaxed">
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
