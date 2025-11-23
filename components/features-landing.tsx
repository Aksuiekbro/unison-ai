"use client";

import Image from "next/image";
import { motion, easeInOut } from "framer-motion";
import { useI18n } from "@/components/i18n/I18nProvider";

const fadeInUp = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.15, duration: 0.6, ease: easeInOut },
  }),
};

export function Features() {
  const { t } = useI18n();
  const aiBlocks = [
    {
      title: t("landing.features.aiHiringTitle"),
      desc: t("landing.features.aiHiringDesc"),
      src: "/ai worker suggestions.png",
      alt: "AI Worker Suggestions",
      width: 1300,
      height: 900,
    },
    {
      title: t("landing.features.smartTeamTitle"),
      desc: t("landing.features.smartTeamDesc"),
      src: "/team management.png",
      alt: "Team Management",
      width: 1800,
      height: 900,
    },
  ];

  const crmBlocks = [
    {
      title: t("landing.features.crmTitle"),
      desc: t("landing.features.crmDesc"),
      src: "/uni crm tasks.png",
      alt: "CRM Analytics Chart",
      width: 1300,
      height: 900,
    },
    {
      title: t("landing.features.automationTitle"),
      desc: t("landing.features.automationDesc"),
      src: "/ai assistant insights.png",
      alt: "AI Assistant Insights",
      width: 1300,
      height: 900,
    },
  ];

  return (
    <section id="features" className="bg-white py-12 md:py-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 space-y-20">
        {/* Unified Digital Platform */}
        <motion.div
          className="grid lg:grid-cols-2 gap-12 items-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          custom={0}
        >
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
              {t("landing.features.unifiedTitle")}
            </h2>
            <p className="text-base md:text-lg text-gray-700">
              {t("landing.features.unifiedDesc")}
            </p>
          </div>
          <div className="px-2">
            <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.3 }}>
              <Image
                src="/unified digital platform2.png"
                alt="Project Overview Dashboard"
                width={1600}
                height={1100}
                className="w-full h-auto mx-auto"
                priority
                draggable={false}
              />
            </motion.div>
          </div>
        </motion.div>

        {/* AI-Powered Features */}
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {aiBlocks.map((block, i) => (
            <motion.div
              key={block.title}
              className="space-y-6 p-10 bg-white rounded-3xl"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              custom={i + 1}
            >
              <h3 className="text-xl md:text-2xl font-bold">{block.title}</h3>
              <p className="text-sm md:text-base text-gray-700">{block.desc}</p>
              <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.3 }}>
                <Image
                  src={block.src}
                  alt={block.alt}
                  width={block.width}
                  height={block.height}
                  className={`mx-auto h-auto ${block.src === "/team management.png" ? "w-full max-w-[98vw]" : "w-full"}`}
                />
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* CRM Analytics & AI Automation */}
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {crmBlocks.map((block, i) => (
            <motion.div
              key={block.title}
              className="space-y-6 p-10 bg-white rounded-3xl"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              custom={i + 3}
            >
              <h3 className="text-xl md:text-2xl font-bold">{block.title}</h3>
              <p className="text-sm md:text-base text-gray-700">{block.desc}</p>
              <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.3 }}>
                <Image
                  src={block.src}
                  alt={block.alt}
                  width={block.width}
                  height={block.height}
                  className="w-full h-auto mx-auto"
                />
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Transparent Audit & Trust */}
        <motion.div
          className="text-center space-y-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          custom={5}
        >
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
            {t("landing.features.auditTitle")}
          </h2>
          <p className="mx-auto max-w-2xl text-base md:text-lg text-gray-700">
            {t("landing.features.auditDesc")}
          </p>
          <div className="px-2">
            <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.3 }}>
              <Image
                src="/team management.png"
                alt="Team Management Dashboard"
                width={1800}
                height={900}
                className="w-full max-w-[98vw] h-auto mx-auto"
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Continuous Growth Engine */}
        <motion.div
          className="text-center space-y-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          custom={6}
        >
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
            {t("landing.features.growthTitle")}
          </h2>
          <p className="mx-auto max-w-2xl text-base md:text-lg text-gray-700">
            {t("landing.features.growthDesc")}
          </p>
          <div className="px-2">
            <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.3 }}>
              <Image
                src="/team productivity trend.png"
                alt="Team Productivity Trend Graph"
                width={1800}
                height={600}
                className="w-full max-w-[98vw] h-auto mx-auto"
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
