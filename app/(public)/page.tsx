'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogoMark } from "@/components/logo-mark"
import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0c10] text-white selection:bg-primary/30 overflow-hidden">
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
      <main className="relative z-10 h-screen flex flex-col items-center justify-center text-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-5xl mx-auto space-y-8 w-full flex flex-col items-center"
        >
          {/* Main Heading - fixed large size so it matches in all browsers */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="text-6xl sm:text-7xl md:text-8xl font-sans font-bold tracking-tighter leading-[0.95]"
            style={{ fontSize: 'clamp(3rem, 10vw, 6rem)' }}
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
            <br className="hidden sm:block" />
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
        </motion.div>
      </main>
    </div>
  )
}
