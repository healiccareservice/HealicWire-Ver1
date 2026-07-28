import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, LayoutTemplate, ExternalLink } from "lucide-react";

export default function RepositorySlider() {
  const [repositoryItems, setRepositoryItems] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ maxItems: 3, selectedIds: [] });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [repoRes, settingsRes] = await Promise.all([
          fetch("/api/repository"),
          fetch("/api/admin/slider-settings")
        ]);
        
        const repoData = await repoRes.json();
        const settingsData = await settingsRes.json();

        if (Array.isArray(repoData)) {
          setRepositoryItems(repoData);
        }
        if (settingsData && settingsData.selectedIds) {
          setSettings(settingsData);
        }
      } catch (err) {
        console.error("Failed to fetch repository slider data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const displayItems = repositoryItems
    .filter(item => settings.selectedIds.includes(item.id))
    .slice(0, settings.maxItems || 3);

  // Auto-play interval
  useEffect(() => {
    if (!isAutoplay || displayItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayItems.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isAutoplay, displayItems.length]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-850 p-4 min-h-[190px] flex items-center justify-center animate-pulse">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-200 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  if (displayItems.length === 0) {
    return null; // Don't show the slider if there's nothing configured
  }

  const handleNext = () => {
    setIsAutoplay(false);
    setCurrentIndex((prev) => (prev + 1) % displayItems.length);
  };

  const handlePrev = () => {
    setIsAutoplay(false);
    setCurrentIndex((prev) => (prev - 1 + displayItems.length) % displayItems.length);
  };

  const activeSlide = displayItems[currentIndex];

  return (
    <div 
      className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-850 shadow-sm overflow-hidden relative group/slider"
      onMouseEnter={() => setIsAutoplay(false)}
      onMouseLeave={() => setIsAutoplay(true)}
    >
      {/* Header Bar */}
      <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <LayoutTemplate className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
              Featured Repository
            </h3>
            <p className="text-[10px] text-zinc-400 font-mono">Premium Resources</p>
          </div>
        </div>

        {/* Carousel Navigation Controls */}
        {displayItems.length > 1 && (
          <div className="flex items-center space-x-1">
            <button
              onClick={handlePrev}
              className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-zinc-400 px-1 font-bold">
              {currentIndex + 1}/{displayItems.length}
            </span>
            <button
              onClick={handleNext}
              className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Slide Card Content */}
      <div className="relative w-full min-h-[190px] flex flex-col justify-between bg-zinc-50 dark:bg-zinc-900">
        {activeSlide.promotion_image || activeSlide.promoImage ? (
          <div className="absolute inset-0 z-0">
            <img 
              src={activeSlide.promotion_image || activeSlide.promoImage} 
              alt={activeSlide.title}
              className="w-full h-full object-cover opacity-30 dark:opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/90 dark:to-zinc-900/90" />
          </div>
        ) : null}
        
        <div className="relative z-10 p-4 flex flex-col justify-between h-full">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-600 text-white shadow-sm">
                {activeSlide.category || "Repository Item"}
              </span>
            </div>

            <div className="pt-2">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white font-serif leading-snug">
                {activeSlide.title}
              </h4>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-mono font-medium mt-1">
                {activeSlide.product_name}
              </p>
            </div>

            {activeSlide.details && (
              <p className="text-[11px] sm:text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans pt-1 line-clamp-2">
                {activeSlide.details}
              </p>
            )}
          </div>

          <div className="pt-3 border-t border-zinc-200/40 dark:border-zinc-800/40 flex items-center justify-between mt-4">
            <div className="flex space-x-1 items-center">
              {displayItems.length > 1 && displayItems.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setIsAutoplay(false);
                    setCurrentIndex(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentIndex 
                      ? "w-4 bg-blue-600" 
                      : "w-1.5 bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() => {}}
              className="text-[11px] font-mono font-bold text-blue-700 dark:text-blue-400 hover:underline flex items-center space-x-1 group/btn"
            >
              <span>View Details</span>
              <ExternalLink className="w-3 h-3 group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
