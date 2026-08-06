import React, { useState, useEffect } from 'react';
import { supabase, mapArticleFromDB, mapAlertFromDB, mapEventFromDB, mapGuidelineFromDB } from '../lib/supabase';
import { Article } from '../types';
import HealicLogo from './HealicLogo';

export interface RepositoryItem {
  id: string;
  title: string;
  subtitle: string;
  img: string;
  category: string;
  date: string;
  logo?: string;
  productName?: string;
}

export default function HeroSection({
  onArticleSelect,
  savedArticleIds,
  onToggleSave,
  editorials = [],
  clinicalInsights = []
}: {
  onArticleSelect: (article: Article) => void;
  savedArticleIds: string[];
  onToggleSave: (e: React.MouseEvent, articleId: string) => void;
  editorials?: Article[];
  clinicalInsights?: Article[];
}) {
  const [slot1Articles, setSlot1Articles] = useState<Article[]>([]);
  const [slot2Articles, setSlot2Articles] = useState<Article[]>([]);
  
  const [currentSlot1Idx, setCurrentSlot1Idx] = useState(0);
  const [currentSlot2Idx, setCurrentSlot2Idx] = useState(0);
  const [currentSlot4Idx, setCurrentSlot4Idx] = useState(0);
  const [currentSlot5Idx, setCurrentSlot5Idx] = useState(0);
  
  const [bannerItems, setBannerItems] = useState<RepositoryItem[]>([]);
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);

  useEffect(() => {
    // 1. Fetch Featured Articles (Spotlight MS)
    async function fetchFeatured() {
      try {
        const CATEGORIES = [
          { table: 'treatment_update', mapper: mapArticleFromDB },
          { table: 'scientific_events', mapper: mapEventFromDB },
          { table: 'drugs', mapper: mapArticleFromDB },
          { table: 'current_guidelines', mapper: mapGuidelineFromDB },
          { table: 'providers', mapper: mapArticleFromDB }
        ];

        let allSpotlights: any[] = [];

        for (const cat of CATEGORIES) {
          const { data, error } = await supabase.from(cat.table).select('*').eq('spotlight', true);
          if (!error && data) {
            allSpotlights = [...allSpotlights, ...data.map(d => {
              const mapped = cat.mapper(d);
              return { ...mapped, _table: cat.table };
            })];
          }
        }

        // Filter out items without titles/headlines (which are usually advertisements)
        allSpotlights = allSpotlights.filter(a => (a.headline && a.headline.trim() !== '') || (a.title && a.title.trim() !== '') || (a.name && a.name.trim() !== ''));

        // Sort by date (newest first)
        allSpotlights.sort((a, b) => new Date(b.publishedAt || b.date || 0).getTime() - new Date(a.publishedAt || a.date || 0).getTime());

        const s1: Article[] = [];
        const s2: Article[] = [];

        allSpotlights.forEach((a, i) => {
          if (i % 2 === 0) s1.push(a as unknown as Article);
          else s2.push(a as unknown as Article);
        });

        setSlot1Articles(s1);
        setSlot2Articles(s2);
      } catch (err) {
        console.error("Error fetching spotlight articles:", err);
      }
    }
    fetchFeatured();

    // 2. Fetch Advertisement Slideshow Items
    Promise.all([
      fetch('/api/admin/advertisements').then(res => res.json()), // Advertisements MS
      fetch('/api/admin/slider-settings').then(res => res.json())
    ])
    .then(([repoData, settingsData]) => {
      if (Array.isArray(repoData)) {
        const selectedIds = settingsData?.selectedIds || [];
        const maxItems = settingsData?.maxItems || 3;
        
        const activeItems = repoData
          .filter(item => selectedIds.includes(item.id))
          .slice(0, maxItems);
          
        setBannerItems(activeItems.map((ad: any) => ({
           id: ad.id,
           title: ad.title || ad.name || 'Advertisement',
           subtitle: ad.subtitle || ad.category || 'Advertisement',
           img: ad.imageUrl || ad.image_url || ad.promoImage || ad.logoUrl || ad.image_data || ad.dataUrl,
           category: ad.category || 'Advertisement',
           date: ad.createdAt || ad.created_at
        })));
      }
    })
    .catch(err => console.error("Error fetching banner data:", err));
  }, []);

  // Set up carousel timer for Ads (3s)
  useEffect(() => {
    if (bannerItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIdx(prev => (prev + 1) % bannerItems.length);
    }, 3000); 
    return () => clearInterval(interval);
  }, [bannerItems.length]);

  // Set up carousel timer for Slot 1 (3s)
  useEffect(() => {
    if (slot1Articles.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlot1Idx(prev => (prev + 1) % slot1Articles.length);
    }, 3000); 
    return () => clearInterval(interval);
  }, [slot1Articles.length]);

  // Set up carousel timer for Slot 2 (3s)
  useEffect(() => {
    if (slot2Articles.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlot2Idx(prev => (prev + 1) % slot2Articles.length);
    }, 3000); 
    return () => clearInterval(interval);
  }, [slot2Articles.length]);

  // Set up carousel timer for Slot 4 (Editorials - 3s)
  useEffect(() => {
    if (editorials.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlot4Idx(prev => (prev + 1) % editorials.length);
    }, 3000); 
    return () => clearInterval(interval);
  }, [editorials.length]);

  // Set up carousel timer for Slot 5 (Clinical Insights - 3s)
  useEffect(() => {
    if (clinicalInsights.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlot5Idx(prev => (prev + 1) % clinicalInsights.length);
    }, 3000); 
    return () => clearInterval(interval);
  }, [clinicalInsights.length]);

  const handleBannerClick = (item: RepositoryItem) => {
    window.history.pushState({}, "", "/repository?q=" + encodeURIComponent(item.title));
    window.dispatchEvent(new Event("popstate"));
  };

  if (slot1Articles.length === 0 && slot2Articles.length === 0 && bannerItems.length === 0 && editorials.length === 0 && clinicalInsights.length === 0) {
    return null; // Fallback if no hero content configured
  }

  const renderCarouselSlot = (articles: Article[], currentIndex: number, setCurrentIndex: (i: number) => void, emptyLabel: string, showOverlay: boolean = true) => {
    if (articles.length === 0) {
      return (
        <div className="w-full h-full bg-zinc-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-400 text-sm aspect-[16/9]">
          <HealicLogo className="w-12 h-12 text-zinc-300 dark:text-zinc-700 animate-[spin_3s_linear_infinite]" />
        </div>
      );
    }
    
    return (
      <div className="flex relative w-full aspect-[16/9] rounded-2xl overflow-hidden shadow-md bg-black">
        {articles.map((article, idx) => (
          <div
            key={article.id + idx}
            onClick={() => onArticleSelect(article)}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out cursor-pointer group ${
              idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <img 
              src={article.imageUrl || "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800"} 
              alt={article.headline}
              className="absolute inset-0 w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 opacity-90"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            {showOverlay && (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                  <div className="flex items-center space-x-2 mb-1.5">
                    <span className="text-teal-400 font-mono text-[10px] font-bold uppercase tracking-wider">{article.category}</span>
                    {article.evidenceLevel && (
                      <>
                        <span className="text-zinc-400">•</span>
                        <span className="text-amber-400 font-mono text-[9px] uppercase">{article.evidenceLevel}</span>
                      </>
                    )}
                  </div>
                  <h3 className="text-white font-bold text-sm sm:text-base leading-tight line-clamp-2 group-hover:text-teal-300 transition-colors">
                    {article.headline || article.title}
                  </h3>
                </div>
              </>
            )}
          </div>
        ))}
        
        {/* Slideshow dots indicator */}
        {articles.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center space-x-1.5">
            {articles.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === currentIndex ? 'bg-white w-3' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 py-6">
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Row: Spotlight 1, 2, 3 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4">
          
          {/* Column 1: Featured Article(s) 1 */}
          <div className="flex w-full">
            {renderCarouselSlot(slot1Articles, currentSlot1Idx, setCurrentSlot1Idx, "Spotlight 1 (Empty)")}
          </div>

          {/* Column 2: Featured Article(s) 2 */}
          <div className="flex w-full">
            {renderCarouselSlot(slot2Articles, currentSlot2Idx, setCurrentSlot2Idx, "Spotlight 2 (Empty)")}
          </div>

          {/* Column 3: Advertisement Slideshow */}
          <div className="flex relative w-full aspect-[16/9] rounded-2xl overflow-hidden shadow-md bg-black">
            {bannerItems.length > 0 ? (
              bannerItems.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => handleBannerClick(item)}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out cursor-pointer ${
                    idx === currentBannerIdx ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                >
                  <img
                    src={item.img}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    className="w-full h-full object-contain hover:scale-105 transition-transform duration-700"
                  />
                </div>
              ))
            ) : (
              <div className="w-full h-full bg-zinc-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-400 text-sm">
                <HealicLogo className="w-12 h-12 text-zinc-300 dark:text-zinc-700 animate-[spin_3s_linear_infinite]" />
              </div>
            )}

            {/* Slideshow dots indicator */}
            {bannerItems.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center space-x-1.5">
                {bannerItems.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentBannerIdx(idx)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      idx === currentBannerIdx ? 'bg-white w-3' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>


      </div>
    </div>
  );
}
