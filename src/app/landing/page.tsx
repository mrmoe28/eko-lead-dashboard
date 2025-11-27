"use client";

import { motion } from "framer-motion";
import { HeroOrbit } from "@/components/hero-orbit";
import { SmoothScrollProvider } from "@/components/smooth-scroll-provider";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Button } from "@/components/ui/button";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import { Sparkles, Zap, Shield, Rocket, Brain, Target } from "lucide-react";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const features = [
  {
    icon: Brain,
    title: "AI-Powered Intelligence",
    description: "Advanced algorithms that learn and adapt to your business needs in real-time.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimized performance delivering results in milliseconds, not seconds.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-level encryption and compliance with industry-leading standards.",
    gradient: "from-orange-500 to-red-500",
  },
  {
    icon: Rocket,
    title: "Scale Infinitely",
    description: "Built to handle millions of operations without breaking a sweat.",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Target,
    title: "Precision Targeting",
    description: "Reach the right customers at the right time with intelligent segmentation.",
    gradient: "from-indigo-500 to-blue-500",
  },
  {
    icon: Sparkles,
    title: "Magical UX",
    description: "Delightful interfaces that users love, powered by cutting-edge design.",
    gradient: "from-pink-500 to-rose-500",
  },
];

export default function LandingPage() {
  return (
    <SmoothScrollProvider>
      <div className="relative">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8">
          {/* Background gradient orbs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <motion.div
              initial="initial"
              animate="animate"
              variants={stagger}
              className="space-y-8"
            >
              {/* Badge */}
              <motion.div variants={fadeIn}>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
                  <Sparkles className="w-4 h-4" />
                  Built with the Gemini Stack
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeIn}
                className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight text-balance"
              >
                Transform Your Business with{" "}
                <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  AI-Powered
                </span>{" "}
                Solutions
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                variants={fadeIn}
                className="text-lg sm:text-xl text-muted-foreground max-w-2xl"
              >
                Experience the future of software with cutting-edge design, blazing-fast
                performance, and intelligence that scales with your ambitions.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div variants={fadeIn} className="flex flex-wrap gap-4">
                <Button size="lg" className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Rocket className="w-5 h-5" />
                  Get Started Free
                </Button>
                <Button size="lg" variant="outline">
                  Watch Demo
                </Button>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div variants={fadeIn} className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border-2 border-background"
                      />
                    ))}
                  </div>
                  <span>10,000+ customers</span>
                </div>
                <span>•</span>
                <span>Trusted by industry leaders</span>
              </motion.div>
            </motion.div>

            {/* Right: 3D Scene */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="h-[500px] lg:h-[600px]"
            >
              <ErrorBoundary fallbackMessage="3D preview is temporarily unavailable.">
                <HeroOrbit />
              </ErrorBoundary>
            </motion.div>
          </div>
        </section>

        {/* Bento Grid Section */}
        <section className="relative py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                Everything You Need to{" "}
                <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  Succeed
                </span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Powerful features designed to help you build, launch, and scale faster than ever before.
              </p>
            </motion.div>

            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={stagger}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {features.map((feature, index) => (
                <motion.div key={index} variants={fadeIn}>
                  <CardContainer className="inter-var h-full">
                    <CardBody className="bg-card relative group/card hover:shadow-2xl border border-border/60 rounded-xl p-6 h-full">
                      <CardItem
                        translateZ="50"
                        className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}
                      >
                        <feature.icon className="w-6 h-6 text-white" />
                      </CardItem>

                      <CardItem
                        translateZ="60"
                        className="text-xl font-semibold text-foreground mb-2"
                      >
                        {feature.title}
                      </CardItem>

                      <CardItem
                        translateZ="40"
                        className="text-sm text-muted-foreground"
                      >
                        {feature.description}
                      </CardItem>
                    </CardBody>
                  </CardContainer>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-primary/20 rounded-2xl p-12"
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join thousands of companies already using our platform to transform their business.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button size="lg" className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Rocket className="w-5 h-5" />
                  Start Free Trial
                </Button>
                <Button size="lg" variant="outline">
                  Schedule a Demo
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </SmoothScrollProvider>
  );
}
