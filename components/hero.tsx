"use client";
import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, PlayCircle } from "lucide-react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Typewriter } from "@/components/ui/typewriter"
import { useI18n } from "@/components/i18n/I18nProvider"
import Link from "next/link"

export function Hero() {
  const { t } = useI18n()
  const phrases = useMemo(
    () => [
      t("landing.hero.phrase1"),
      t("landing.hero.phrase2"),
      t("landing.hero.phrase3"),
      t("landing.hero.phrase4"),
      t("landing.hero.phrase5"),
    ],
    [t]
  )

  const scrollToVideo = () => {
    const videoElement = document.querySelector('video')
    if (videoElement) {
      videoElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Auto-play the video after scrolling
      setTimeout(() => {
        videoElement.play()
      }, 500)
    }
  }

  return (
    <section className="relative bg-gray-50 overflow-hidden">
      <motion.div
        className="container mx-auto px-4 py-20 text-center md:px-6 md:py-32 relative z-10"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.1 }}
      >
        <div className="mx-auto max-w-3xl">
          <h1 className="text-5xl font-extrabold tracking-tighter sm:text-6xl md:text-7xl lg:text-6xl">
            {t("landing.hero.titlePrefix")}{" "}
            <Typewriter
              phrases={phrases}
              typingSpeedMs={40}
              deletingSpeedMs={20}
              pauseMs={1200}
              loop
              className="inline-block"
            />
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-2xl md:text-3xl text-gray-600">
            {t("landing.hero.subtitle")}
          </p>
          <div className="mt-10 flex justify-center gap-6">
            <Link href="/auth/signup">
              <Button size="lg" className="text-xl px-8 py-4">
                {t("landing.hero.ctaPrimary")} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-xl px-8 py-4"
              onClick={scrollToVideo}
            >
              <PlayCircle className="mr-2 h-5 w-5" />
              {t("landing.hero.ctaSecondary")}
            </Button>
          </div>
        </div>
      </motion.div>
      <div className="container mx-auto px-4 pb-20 md:px-6 md:pb-32 relative z-10 flex flex-col items-center gap-8">
        {/* Hero image card, no container, no shadow, no ring, no blur */}
        <Image
          src="/hero page find your next role1.png"
          alt={t("landing.hero.heroAlt")}
          width={1920}
          height={600}
          className="w-[98vw] max-w-[1920px] mx-auto rounded-2xl"
          priority
          draggable={false}
          style={{
            width: "98vw",
            maxWidth: "1920px",
            height: "auto",
            display: "block",
            marginLeft: "auto",
            marginRight: "auto",
            borderRadius: "1.5rem",
          }}
        />
        {/* Video with play button overlay */}
      </div>
    </section>
  )
}
