/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Landmark, Search, Sparkles, Layers, Compass, 
  RefreshCw, ChevronRight, Activity, Calendar
} from "lucide-react";
import { Article, Region } from "../types";
import { supabase, mapArticleFromDB } from "../lib/supabase";
import ArticleCard from "./ArticleCard";

interface GenericDatabasePageProps {
  onSelectArticle: (article: Article) => void;
  tableName: string;
  title: string;
  subtitle: string;
  Icon: React.ElementType;
}

export default function GenericDatabasePage({ onSelectArticle, tableName, title, subtitle, Icon }: GenericDatabasePageProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("All");
  const [viewMode, setViewMode] = useState<"priority" | "grid">("grid");

  const [savedArticleIds, setSavedArticleIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("healic_saved_ids");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const REGIONS = [
    "All",
    Region.INDIA,
    Region.GLOBAL,
    Region.US_EU
  ];

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select("*");

        if (error) throw error;
        if (data) {
          const mappedArticles = data.map(mapArticleFromDB);
          // Sort by mapped date in descending order, fallback to created_at
          mappedArticles.sort((a, b) => {
            const timeA = new Date(a.publishedAt || 0).getTime();
            const timeB = new Date(b.publishedAt || 0).getTime();
            if (timeA !== timeB) return timeB - timeA;
            return new Date((b as any).created_at || 0).getTime() - new Date((a as any).created_at || 0).getTime();
          });
          setArticles(mappedArticles);
        }
      } catch (error) {
        console.error(`Error fetching ${tableName} news:`, error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, [tableName]);

  const handleToggleSave = (id: string) => {
    setSavedArticleIds(prev => {
      const newIds = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem("healic_saved_ids", JSON.stringify(newIds));
      return newIds;
    });
  };

  const filteredArticles = articles.filter(art => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || 
      (art.headline && art.headline.toLowerCase().includes(q)) ||
      (art.title && art.title.toLowerCase().includes(q)) ||
      (art.subhead && art.subhead.toLowerCase().includes(q)) ||
      (art.summary && art.summary.toLowerCase().includes(q)) ||
      (art.studySummary && art.studySummary.toLowerCase().includes(q)) ||
      (art.bodyAnalysis && art.bodyAnalysis.toLowerCase().includes(q));

    const matchesRegion = regionFilter === "All" || art.region === regionFilter;
    
    return matchesSearch && matchesRegion;
  });

  const spotlightArticles = filteredArticles.filter(a => a.spotlight);
  const topPriorityArticles = spotlightArticles;
  const indiaFocusArticles = filteredArticles.filter(a => a.region === Region.INDIA);
  const globalArticles = filteredArticles.filter(a => a.region !== Region.INDIA);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 font-sans animate-in fade-in duration-500">
      
      {/* Main Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-teal-900 dark:text-teal-400 sm:text-4xl font-serif flex items-center space-x-3">
          <Icon className="w-8 h-8" />
          <span>{title}</span>
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* Spotlight / Managed Section */}
      {topPriorityArticles.length > 0 && (
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-purple-900/10 via-indigo-900/10 to-blue-900/10 dark:from-purple-950/40 dark:via-indigo-950/40 dark:to-blue-950/40 border border-purple-200 dark:border-purple-800/60 shadow-xs space-y-4 font-sans">
          <div className="flex items-center justify-between border-b border-purple-200/60 dark:border-purple-800/40 pb-3">
            <div className="flex items-center space-x-2.5">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 animate-pulse shrink-0" />
              <div>
                <h2 className="text-base font-extrabold text-zinc-900 dark:text-white uppercase font-mono tracking-tight">
                  Spotlight
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Critical updates and spotlight intelligence for healthcare institutions.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-purple-600 text-white uppercase tracking-wider shrink-0">
              Spotlight ({topPriorityArticles.length})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topPriorityArticles.map(art => (
              <div
                key={art.id}
                onClick={() => onSelectArticle(art)}
                className="bg-white dark:bg-zinc-950 rounded-xl border border-purple-200/80 dark:border-purple-800/80 shadow-2xs hover:shadow-md transition-all flex flex-col cursor-pointer overflow-hidden"
              >
                {art.imageUrl && (
                  <div className="w-full h-40 bg-zinc-100 dark:bg-zinc-900">
                    <img src={art.imageUrl} alt={art.headline} className="w-full h-full object-contain" />
                  </div>
                )}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                    <div className="flex gap-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 uppercase">
                        {art.region}
                      </span>
                      {art.clinicalImpact && (
                        <span className="px-2.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 uppercase">
                          {art.clinicalImpact}
                        </span>
                      )}
                      {art.updateCategory && (
                        <span className="px-2.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 uppercase">
                          {art.updateCategory}
                        </span>
                      )}
                    </div>
                    <span className="text-[10.5px] font-mono text-zinc-400">
                      {new Date(art.publishedAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white leading-snug">
                    {art.title || art.headline}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {art.studySummary || art.summary || art.summary30s}
                  </p>
                </div>
                
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 text-[11px] text-zinc-500 font-mono">
                  </div>
                  <button
                    className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-2xs transition-all flex items-center space-x-1"
                  >
                    <span>View News Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
            ))}
          </div>
        </div>
      )}

      {/* Control Bar */}
      <div className="bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-850 shadow-xs mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-2/3">
            <input
              type="text"
              placeholder={`Search ${title.toLowerCase()}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
            <Search className="w-4.5 h-4.5 absolute left-3.5 top-3 text-zinc-400" />
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
            <span className="text-xs font-mono text-zinc-400 mr-1">View:</span>
            <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 font-mono text-xs">
              <button
                onClick={() => setViewMode("priority")}
                className={`px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-all ${
                  viewMode === "priority" ? "bg-white dark:bg-zinc-950 text-teal-700 dark:text-teal-400 font-bold shadow-2xs" : "text-zinc-500"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Priority Tiers</span>
              </button>

              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-all ${
                  viewMode === "grid" ? "bg-white dark:bg-zinc-950 text-teal-700 dark:text-teal-400 font-bold shadow-2xs" : "text-zinc-500"
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>All Grid</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-900 font-mono text-xs">
          <div>
            <label className="block text-[10px] text-zinc-400 uppercase font-bold mb-1">Region</label>
            <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-sans">
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="col-span-1 sm:col-span-2 flex items-end">
            <button
              onClick={() => {
                setSearchQuery("");
                setRegionFilter("All");
              }}
              className="px-3 py-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent transition-all flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      {loading ? (
        <div className="space-y-6">
          <div className="text-center py-16 text-teal-600">
            <Activity className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="font-mono text-sm uppercase tracking-widest font-bold">Gathering Intelligence...</p>
          </div>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg mx-auto">
          <Calendar className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm text-zinc-600 font-bold mb-1">No intelligence matches your criteria</p>
          <button onClick={() => setSearchQuery("")} className="px-4 py-2 bg-teal-700 text-white text-xs font-mono rounded-lg font-bold">Clear Search</button>
        </div>
      ) : searchQuery ? (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 border-b-2 border-teal-600 pb-2">
            <Search className="w-5 h-5 text-teal-600" />
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-serif">Search Results ({filteredArticles.length})</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredArticles.map(art => (
              <ArticleCard
                key={art.id}
                article={art}
                onSelect={onSelectArticle}
                viewMode="comfortable"
                isSaved={savedArticleIds.includes(art.id)}
                onToggleSave={() => handleToggleSave(art.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          {viewMode === "priority" && (
            <div className="space-y-12">
              {(regionFilter === "All" || regionFilter === Region.INDIA) && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b-2 border-teal-600 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-teal-600 text-white text-[10px] font-mono font-black uppercase">Tier 1</span>
                      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-serif">India Focus {title || 'Database'} ({indiaFocusArticles.length})</h2>
                    </div>
                  </div>
                  {indiaFocusArticles.length === 0 ? (
                    <p className="text-xs text-zinc-400 font-mono py-4 italic">No regional providers match filters.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {indiaFocusArticles.map(art => (
                        <ArticleCard
                          key={art.id}
                          article={art}
                          onSelect={onSelectArticle}
                          viewMode="comfortable"
                          isSaved={savedArticleIds.includes(art.id)}
                          onToggleSave={() => handleToggleSave(art.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {(regionFilter === "All" || regionFilter !== Region.INDIA) && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[10px] font-mono font-black uppercase">Tier 2</span>
                      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-serif">Global & International {title || 'Database'} ({globalArticles.length})</h2>
                    </div>
                  </div>
                  {globalArticles.length === 0 ? (
                    <p className="text-xs text-zinc-400 font-mono py-4 italic">No global providers match filters.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {globalArticles.map(art => (
                        <ArticleCard
                          key={art.id}
                          article={art}
                          onSelect={onSelectArticle}
                          viewMode="comfortable"
                          isSaved={savedArticleIds.includes(art.id)}
                          onToggleSave={() => handleToggleSave(art.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredArticles.map(art => (
                <ArticleCard
                  key={art.id}
                  article={art}
                  onSelect={onSelectArticle}
                  viewMode="comfortable"
                  isSaved={savedArticleIds.includes(art.id)}
                  onToggleSave={() => handleToggleSave(art.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
