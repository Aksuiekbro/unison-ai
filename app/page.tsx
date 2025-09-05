"use client";

import { Hero } from "@/components/hero"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header-landing"
import { UniModules } from "@/components/uni-modules-landing"
import { Features } from "@/components/features-landing"
import Image from "next/image"
import { motion } from "framer-motion"

export default function LandingPage() {
  return (
    <div className="bg-white text-gray-800">
      <Header />
      <main>
        <Hero />
        <video
          src="/Main_1.mp4"
          className="w-full h-auto"
          controls
        />
        <Features />
        <UniModules />
        <div className="w-full flex flex-col items-center gap-2 my-2">
          <motion.div
            id="tools"
            className="w-full flex justify-center scroll-mt-16"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <Image
              src="/tools (3).png"
              alt="Tools"
              width={1920}
              height={900}
              className="w-full max-w-7xl h-auto object-contain"
              priority
            />
          </motion.div>
          <motion.div
            id="pricing"
            className="w-full flex justify-center scroll-mt-16"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <Image
              src="/price (2).png"
              alt="Pricing"
              width={1920}
              height={900}
              className="w-full max-w-7xl h-auto object-contain"
              priority
            />
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  )
}