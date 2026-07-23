/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Sparkles, BookOpen, Activity, Award, CheckCircle, 
  ChevronLeft, ChevronRight, Zap, ShieldCheck, ArrowRight, Layers 
} from "lucide-react";

interface WhatWeDoSlide {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  description: string;
  metric: string;
  metricLabel: string;
  tabKey: string;
  icon: React.ElementType;
  accentColor: string;
  bgGradient: string;
}

const SLIDES: WhatWeDoSlide[] = [
  {
    id: "curation",
    tag: "Real-time Curation",
    title: "AI Medical Intelligence",
    subtitle: "Global Clinical News Curation",
    description: "Aggregating 3,000+ daily global journal preprints, trial releases & regulatory updates into peer-reviewed 30-second clinician briefs.",
    metric: "< 12 Hrs",
    metricLabel: "Translational Speed",
    tabKey: "news",
    icon: Sparkles,
    accentColor: "text-teal-600 dark:text-teal-400",
    bgGradient: "from-teal-500/10 via-teal-500/5 to-transparent dark:from-teal-950/40 dark:via-teal-950/20"
  },
  {
    id: "guidelines",
    tag: "Evidence-Based",
    title: "Living Practice Guidelines",
    subtitle: "Interactive Treatment Algorithms",
    description: "Continuously updated clinical pathways, drug dosage calculators, and evidence-ranked treatment protocols aligned with ICMR & WHO.",
    metric: "100+",
    metricLabel: "Active Protocols",
    tabKey: "guidelines",
    icon: BookOpen,
    accentColor: "text-indigo-600 dark:text-indigo-400",
    bgGradient: "from-indigo-500/10 via-indigo-500/5 to-transparent dark:from-indigo-950/40 dark:via-indigo-950/20"
  },
  {
    id: "alerts",
    tag: "Critical Response",
    title: "Hospital Operations & Alerts",
    subtitle: "Surveillance & Emergency Intel",
    description: "Real-time tracking of drug safety recalls, infectious outbreak vectors, ICU shortages, and critical hospital action protocols.",
    metric: "Instant",
    metricLabel: "Crisis Surveillance",
    tabKey: "alerts",
    icon: Activity,
    accentColor: "text-red-600 dark:text-red-400",
    bgGradient: "from-red-500/10 via-red-500/5 to-transparent dark:from-red-950/40 dark:via-red-950/20"
  },
  {
    id: "events",
    tag: "Continuous Education",
    title: "Scientific Events & CME",
    subtitle: "Conferences & Academic Pass",
    description: "Hub for local grand rounds, national medical congresses, and digital pass logging for mandatory CME credit accumulation.",
    metric: "100%",
    metricLabel: "Verified CME Credits",
    tabKey: "events",
    icon: Award,
    accentColor: "text-amber-600 dark:text-amber-400",
    bgGradient: "from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:via-amber-950/20"
  },
  {
    id: "proposal",
    tag: "Strategic Vision",
    title: "Clinician Decision Support",
    subtitle: "AI Augmented & Human Reviewed",
    description: "Combining Google AI capabilities with expert clinician review panels to deliver safe, auditable, and actionable medical knowledge.",
    metric: "Auditable",
    metricLabel: "AI Safety Standards",
    tabKey: "proposal",
    icon: ShieldCheck,
    accentColor: "text-emerald-600 dark:text-emerald-400",
    bgGradient: "from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-950/40 dark:via-emerald-950/20"
  }
];

interface WhatWeDoSliderProps {
  onSelectTab?: (tabKey: string) => void;
}

export default function WhatWeDoSlider({ onSelectTab }: WhatWeDoSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);

  // Auto-play interval
  useEffect(() => {
    if (!isAutoplay) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [isAutoplay]);

  const handleNext = () => {
    setIsAutoplay(false);
    setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
  };

  const handlePrev = () => {
    setIsAutoplay(false);
    setCurrentIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  const activeSlide = SLIDES[currentIndex];
  const IconComponent = activeSlide.icon;

  return (
    <div 
      className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-850 shadow-sm overflow-hidden relative group/slider"
      onMouseEnter={() => setIsAutoplay(false)}
      onMouseLeave={() => setIsAutoplay(true)}
    >
      {/* Header Bar */}
      <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
              What We Do
            </h3>
            <p className="text-[10px] text-zinc-400 font-mono">Healic Wire Core Capabilities</p>
          </div>
        </div>

        {/* Carousel Navigation Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={handlePrev}
            className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400 transition-colors"
            title="Previous Capability"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          
          <span className="text-[10px] font-mono text-zinc-400 px-1 font-bold">
            {currentIndex + 1}/{SLIDES.length}
          </span>

          <button
            onClick={handleNext}
            className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400 transition-colors"
            title="Next Capability"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Slide Card Content */}
      <div className={`p-4 bg-gradient-to-br ${activeSlide.bgGradient} transition-all duration-300 min-h-[190px] flex flex-col justify-between`}>
        <div className="space-y-2">
          {/* Tag & Metric Badge */}
          <div className="flex items-center justify-between">
            <span className={`text-[9.5px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-md bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800/60 shadow-2xs ${activeSlide.accentColor}`}>
              {activeSlide.tag}
            </span>

            <div className="text-right font-mono">
              <span className={`text-xs font-extrabold block ${activeSlide.accentColor}`}>
                {activeSlide.metric}
              </span>
              <span className="text-[8.5px] text-zinc-400 uppercase tracking-tight block">
                {activeSlide.metricLabel}
              </span>
            </div>
          </div>

          {/* Title & Icon */}
          <div className="flex items-start space-x-2.5 pt-1">
            <div className={`p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-xs shrink-0 ${activeSlide.accentColor}`}>
              <IconComponent className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white font-serif leading-snug">
                {activeSlide.title}
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono font-medium">
                {activeSlide.subtitle}
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="text-[11px] sm:text-xs text-zinc-650 dark:text-zinc-350 leading-relaxed font-sans pt-1">
            {activeSlide.description}
          </p>
        </div>

        {/* Slide Action Button */}
        <div className="pt-3 border-t border-zinc-200/40 dark:border-zinc-800/40 flex items-center justify-between mt-2">
          {/* Dots Indicator */}
          <div className="flex space-x-1 items-center">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setIsAutoplay(false);
                  setCurrentIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentIndex 
                    ? "w-4 bg-teal-600 dark:bg-teal-400" 
                    : "w-1.5 bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Interactive Link */}
          <button
            onClick={() => onSelectTab && onSelectTab(activeSlide.tabKey)}
            className="text-[11px] font-mono font-bold text-teal-700 dark:text-teal-400 hover:underline flex items-center space-x-1 group/btn"
          >
            <span>Explore Feature</span>
            <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
