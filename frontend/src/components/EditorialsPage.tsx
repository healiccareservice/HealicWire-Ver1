/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { UserCheck, BookOpen, Search, Sparkles, ChevronDown, ChevronUp, Bookmark, BookmarkCheck, Share2, Award, Clock, ArrowRight, CheckCircle } from "lucide-react";
import { Article } from "../types";
import { supabase, mapArticleFromDB } from "../lib/supabase";

interface EditorialsPageProps {
  onSelectArticle: (article: Article) => void;
}

export default function EditorialsPage({ onSelectArticle }: EditorialsPageProps) {
  const [editorials, setEditorials] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("healic_saved_articles");
    return saved ? JSON.parse(saved) : [];
  });
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    const fetchEditorials = async () => {
      try {
        const { data, error } = await supabase.from('articles').select('*');
        if (error) throw error;
        if (data) {
          const mapped = data.map(mapArticleFromDB);
          const filtered = mapped.filter((a: Article) => 
            a.sourceName === "HealicWire Editorial Board" ||
            a.category === "Clinical" ||
            a.category === "Research" ||
            a.category === "Policy and Public Health" ||
            a.headline?.toLowerCase().includes("editorial")
          );
          setEditorials(filtered.length > 0 ? filtered : mapped);
        }
      } catch (err) {
        console.error("Error loading editorials:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEditorials();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated;
    if (savedIds.includes(id)) {
      updated = savedIds.filter(item => item !== id);
      showToast("Removed from bookmarks");
    } else {
      updated = [...savedIds, id];
      showToast("Saved editorial to bookmarks!");
    }
    setSavedIds(updated);
    localStorage.setItem("healic_saved_articles", JSON.stringify(updated));
  };

  const filteredEditorials = editorials.filter(ed =>
    ed.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ed.summary30s.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ed.bodyAnalysis.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 font-sans">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-teal-800 text-white font-mono text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 border border-teal-600 animate-slideUp">
          <CheckCircle className="w-4 h-4 text-teal-300" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-teal-600 dark:text-teal-400 mb-2">
          <UserCheck className="w-5 h-5" />
          <span className="text-xs font-mono tracking-widest uppercase font-bold">Chief Opinion & Analysis</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white font-serif">
          Editorials & Clinical Opinions
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
          Peer-reviewed perspectives, evidence synthesis, and strategic healthcare insights authored by the HealicWire Editorial Directorate.
        </p>
      </div>

      {/* Chief Editor Profile Banner */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-teal-900/10 via-emerald-900/10 to-cyan-900/10 dark:from-teal-950/50 dark:via-emerald-950/50 dark:to-cyan-950/50 border border-teal-200/80 dark:border-teal-800/80 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <img
          src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80"
          alt="Dr. K. Narayana"
          className="w-20 h-20 rounded-full object-cover border-3 border-teal-600 shadow-md shrink-0"
        />
        <div className="space-y-1.5 text-center sm:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">
              Dr. K. Narayana, MD, DM
            </h2>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-600 text-white uppercase">
              Editor-in-Chief
            </span>
          </div>
          <p className="text-xs font-mono text-teal-700 dark:text-teal-400 font-bold">
            Lead Strategist, HealicWire Editorial Board & Clinical Evidence Directorate
          </p>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed italic font-serif pt-1">
            &ldquo;Bridging groundbreaking clinical evidence with frontline medical practice across Indian and global healthcare systems.&rdquo;
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8">
        <input
          type="text"
          placeholder="Filter editorials by topic, guideline, or clinical keyword..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
        />
        <Search className="w-4.5 h-4.5 absolute left-3.5 top-3.5 text-zinc-400" />
      </div>

      {/* EDITORIALS STACKED LIST - ONE BELOW ANOTHER */}
      {loading ? (
        <div className="space-y-6 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-zinc-100 dark:bg-zinc-900 rounded-2xl" />
          ))}
        </div>
      ) : filteredEditorials.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <BookOpen className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm text-zinc-600 dark:text-zinc-400 font-bold">No editorials match your search term.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredEditorials.map(ed => {
            const isExpanded = expandedIds.includes(ed.id);
            const isSaved = savedIds.includes(ed.id);

            return (
              <article
                key={ed.id}
                className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-850 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                {/* Header Row */}
                <div className="p-6 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 uppercase">
                        {ed.category || "Editorial Column"}
                      </span>
                      {ed.region && (
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-900 uppercase">
                          {ed.region}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 text-xs font-mono text-zinc-400">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{ed.readingTimeMinutes || 3}m read</span>
                      </span>
                      <span>•</span>
                      <span>{new Date(ed.publishedAt || Date.now()).toLocaleDateString("en-IN")}</span>
                    </div>
                  </div>

                  {/* Headline */}
                  <h2
                    onClick={() => onSelectArticle(ed)}
                    className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white font-serif hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer leading-snug transition-colors"
                  >
                    {ed.headline}
                  </h2>

                  {/* Byline */}
                  <div className="flex items-center space-x-2 text-xs font-mono text-zinc-500 dark:text-zinc-400 pt-1">
                    <span className="font-bold text-teal-700 dark:text-teal-400">
                      {ed.sourceName || "HealicWire Editorial Board"}
                    </span>
                    <span>•</span>
                    <span>Peer Reviewed Column</span>
                  </div>

                  {/* 30-Second Summary */}
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans pt-2">
                    {ed.summary30s}
                  </p>

                  {/* Expanded Body Analysis */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-900 space-y-3 animate-fadeIn">
                      <h4 className="text-xs font-mono font-bold uppercase text-teal-700 dark:text-teal-400">
                        Detailed Clinical Analysis & Practice Takeaways
                      </h4>
                      <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line font-sans">
                        {ed.bodyAnalysis || ed.summary30s}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Action Strip */}
                <div className="px-6 py-3 bg-zinc-50/50 dark:bg-zinc-900/40 border-t border-zinc-100 dark:border-zinc-900 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleExpand(ed.id)}
                      className="flex items-center space-x-1 font-mono font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                    >
                      <span>{isExpanded ? "Collapse Analysis" : "Read Clinical Analysis"}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={(e) => toggleSave(ed.id, e)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-zinc-900 transition-colors"
                      title="Bookmark Editorial"
                    >
                      {isSaved ? <BookmarkCheck className="w-4 h-4 text-amber-500" /> : <Bookmark className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => onSelectArticle(ed)}
                      className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-mono text-xs font-bold transition-all flex items-center space-x-1 shadow-2xs"
                    >
                      <span>View Full Article</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
