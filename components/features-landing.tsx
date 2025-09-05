"use client";

import Image from "next/image";
import { motion, easeInOut } from "framer-motion";

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
                          Unified digital platform
                        </h2>
                        <p className="text-base md:text-lg text-gray-700">
              All-in-one business solution to manage people, projects, and documents. A single working environment that unites the entire team and creates a common information space.
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
          {[
            {
              title: "AI-Powered Hiring with HR Capital Precision",
              desc: "Automate your recruitment process and reduce risks.",
              src: "/ai worker suggestions.png",
              alt: "AI Worker Suggestions",
            },
            {
              title: "Smart Team Assembly",
              desc: "AI builds project teams based on skills, workload, and project requirements.",
              src: "/team management.png",
              alt: "Team Management",
            },
          ].map((block, i) => (
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
                  width={block.src === "/team management.png" ? 1800 : 1300}
                  height={block.src === "/team management.png" ? 900 : 900}
                  className={`mx-auto h-auto ${block.src === "/team management.png" ? "w-full max-w-[98vw]" : "w-full"}`}
                />
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* CRM Analytics & AI Automation */}
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {[
            {
              title: "24/7 CRM-Driven Analytics",
              desc: "Sales, tasks, and workload reports for data-driven insights.",
              src: "/uni crm tasks.png",
              alt: "CRM Analytics Chart",
            },
            {
              title: "End-to-End AI Automation",
              desc: "AI handles routine data entry, task assignments, and progress reports to keep projects moving.",
              src: "/ai assistant insights.png",
              alt: "AI Assistant Insights",
            },
          ].map((block, i) => (
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
                  width={1300}
                  height={900}
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
                      Transparent Audit & Trust
                    </h2>
                    <p className="mx-auto max-w-2xl text-base md:text-lg text-gray-700">
            Full transparency of factors, tracking HR processes via web3, and anti-ghost protocols.
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
                      Continuous Growth Engine
                    </h2>
                    <p className="mx-auto max-w-2xl text-base md:text-lg text-gray-700">
            Use Profile as a main growth driver for employees. AI analyzes skills, defines goals, and builds progress back into productivity and deal success.
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
