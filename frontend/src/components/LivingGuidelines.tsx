/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Search, Calendar, Landmark, HelpCircle, AlertCircle, ChevronDown, ChevronUp, BookOpen, ExternalLink, Sparkles } from "lucide-react";
import { LivingGuideline, Article } from "../types";
import { supabase, mapGuidelineFromDB, mapArticleFromDB } from "../lib/supabase";

interface LivingGuidelinesProps {
  onSelectArticle: (article: Article) => void;
  title?: string;
  subtitle?: string;
  tableName?: string;
}

export default function LivingGuidelines({ 
  onSelectArticle,
  title = "Current Guidelines Registry", 
  subtitle = "Real-time registry tracking major clinical, drug, and public health recommendation shifts. Stay ahead of changing therapeutic guidelines.",
  tableName = "current_guidelines"
}: LivingGuidelinesProps) {
  const [guidelines, setGuidelines] = useState<LivingGuideline[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGuidelines = async () => {
      try {
        const { data, error } = await supabase.from(tableName).select('*');
        if (error) throw error;
        if (data) {
          const mapped = data.map(mapGuidelineFromDB);
          mapped.sort((a, b) => new Date(b.lastUpdated || 0).getTime() - new Date(a.lastUpdated || 0).getTime());
          setGuidelines(mapped);
          if (mapped.length > 0) setExpandedId(mapped[0].id);
        }
      } catch (err) {
        console.error("Error fetching guidelines:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGuidelines();
  }, [title]);

  const filtered = guidelines.filter(g =>
    (g.condition || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (g.issuingOrganization || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (g.currentRecommendation || "").toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const spotlightGuidelines = filtered.filter(g => g.spotlight);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Header section */}
      <div className="mb-8 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start space-x-2 text-teal-600 dark:text-teal-400 mb-2">
          <BookOpen className="w-5 h-5" />
          <span className="text-xs font-mono tracking-widest uppercase font-bold">Clinical Standards</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 max-w-xl">
          {subtitle}
        </p>
      </div>

      {/* Spotlight Section */}
      {!loading && spotlightGuidelines.length > 0 && (
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-teal-900/10 via-emerald-900/10 to-teal-900/10 dark:from-teal-950/40 dark:via-emerald-950/40 dark:to-teal-950/40 border border-teal-200 dark:border-teal-800/60 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-teal-200/60 dark:border-teal-800/40 pb-3">
            <div className="flex items-center space-x-2.5">
              <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400 animate-pulse shrink-0" />
              <div>
                <h2 className="text-base font-extrabold text-zinc-900 dark:text-white uppercase font-mono tracking-tight">
                  Spotlight
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Critical updates and spotlight guidelines.
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {spotlightGuidelines.slice(0, 2).map(g => (
               <div 
                  key={g.id} 
                  onClick={() => onSelectArticle({
                    id: g.id,
                    headline: g.title || g.condition || "Clinical Guideline",
                    sourceName: g.issuingOrganization || "Guideline Authority",
                    publishedAt: g.lastUpdated,
                    summary30s: g.currentRecommendation || "",
                    bodyAnalysis: g.whatsNew || g.reasonForChange || "",
                    impactScores: { clinicalPractice: 9, publicHealth: 8, policy: 7, research: 5 },
                    whyThisMatters: { shortTerm: g.reasonForChange || "", longTerm: g.reasonForChange || "" },
                    evidenceLevel: (g.evidenceLevel as any) || "Systematic Review",
                    sourceUrl: (g.references && g.references.length > 0) ? g.references[0] : "#",
                    isAiAssisted: true,
                    peerReviewed: true,
                    fundingSource: "Unknown",
                    coiNote: "None",
                    references: g.references || [],
                    views: 0,
                    imageUrl: g.imageUrl
                  } as unknown as Article)}
                  className="bg-white dark:bg-zinc-950 rounded-xl border border-teal-200/80 dark:border-teal-800/80 shadow-2xs hover:shadow-md cursor-pointer transition-all overflow-hidden flex flex-col"
                >
                 {g.imageUrl && (
                   <div className="w-full h-40 bg-zinc-100 dark:bg-zinc-900">
                     <img src={g.imageUrl} alt={g.title} className="w-full h-full object-contain" />
                   </div>
                 )}
                 <div className="p-5 flex-1 flex flex-col">
                   <h3 className="text-sm font-bold text-zinc-900 dark:text-white leading-snug">{g.title || g.condition}</h3>
                   <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 mt-2">{g.currentRecommendation}</p>
                 </div>
               </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Filter guidelines by clinical condition (e.g., Diabetes, Hypertension)..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
        />
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-400 dark:text-zinc-500" />
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2].map(i => (
            <div key={i} className="h-28 bg-zinc-100 dark:bg-zinc-900 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No active guidelines found matching your filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(g => {
            const isExpanded = expandedId === g.id;
            return (
              <div
                key={g.id}
                className={`border rounded-xl overflow-hidden transition-all duration-200 ${
                  isExpanded
                    ? "border-teal-500/30 bg-teal-50/10 dark:border-teal-500/20 dark:bg-zinc-950"
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                {/* Header Collapsible Trigger */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : g.id)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none"
                >
                  <div className="min-w-0 pr-4">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-teal-600 dark:text-teal-400 font-semibold uppercase tracking-wider flex items-center space-x-1">
                        <Landmark className="w-3.5 h-3.5" />
                        <span>{g.issuingOrganization}</span>
                      </span>
                      <span className="text-zinc-300 dark:text-zinc-800 hidden sm:inline">•</span>
                      <span className="text-[11px] font-mono text-zinc-400 flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Updated {new Date(g.lastUpdated).toLocaleDateString("en-IN", { month: 'short', year: 'numeric' })}</span>
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                      {g.title || `${g.condition} Treatment Guidelines`}
                    </h3>
                  </div>
                  <div className="shrink-0 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-850">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-zinc-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-500" />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-zinc-100 dark:border-zinc-900 pt-4 space-y-5 text-sm">
                    {/* Recommendation Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Current recommendation */}
                      <div className="p-4 rounded-lg bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40">
                        <div className="flex items-center space-x-1.5 text-teal-700 dark:text-teal-300 font-bold text-xs uppercase tracking-wider mb-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                          <span>Current Recommendation</span>
                        </div>
                        <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                          {g.currentRecommendation}
                        </p>
                      </div>

                      {/* Previous recommendation */}
                      {g.previousRecommendation && (
                        <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800">
                          <div className="flex items-center space-x-1.5 text-zinc-500 dark:text-zinc-400 font-bold text-xs uppercase tracking-wider mb-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                            <span>Previous Practice (Changed)</span>
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-through">
                            {g.previousRecommendation}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* What's New or Reason For Change */}
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-1.5 text-zinc-700 dark:text-zinc-300 font-bold text-xs uppercase tracking-wider">
                        <HelpCircle className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                        <span>{g.whatsNew ? "What's New" : "Why this recommendation changed"}</span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed bg-zinc-50 dark:bg-zinc-900/40 p-3 rounded-lg border border-zinc-150 dark:border-zinc-850 whitespace-pre-wrap">
                        {g.whatsNew || g.reasonForChange}
                      </p>
                    </div>

                    {/* Key Clinical Recommendations */}
                    {g.keyClinicalRecommendations && Object.keys(g.keyClinicalRecommendations).length > 0 && (
                      <div className="space-y-2 mt-4">
                        <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800 pb-1">
                          Key Clinical Recommendations
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {Object.entries(g.keyClinicalRecommendations).map(([key, value]) => {
                            if (!value) return null;
                            return (
                              <div key={key} className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                <span className="block text-xs font-bold text-teal-700 dark:text-teal-400 capitalize mb-1">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">{value as string}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Clinical Pearls */}
                    {g.clinicalPearls && g.clinicalPearls.length > 0 && (
                      <div className="space-y-2 mt-4 bg-teal-50/50 dark:bg-teal-950/20 p-4 rounded-lg border border-teal-100 dark:border-teal-900/40">
                        <h4 className="font-bold text-sm text-teal-800 dark:text-teal-300 flex items-center space-x-1.5">
                          <Sparkles className="w-4 h-4" />
                          <span>Clinical Pearls</span>
                        </h4>
                        <ul className="list-disc pl-5 space-y-1 text-xs text-zinc-700 dark:text-zinc-300">
                          {g.clinicalPearls.map((pearl, i) => (
                            <li key={i}>{pearl}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Evidence Level & Target Audience */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {g.evidenceLevel && (
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-zinc-400">Evidence Level</span>
                          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{g.evidenceLevel}</span>
                        </div>
                      )}
                      {g.targetAudience && (
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-zinc-400">Target Audience</span>
                          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{g.targetAudience}</span>
                        </div>
                      )}
                    </div>

                    {/* India specific applicability */}
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-1.5 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 225 150" className="w-3.5 h-2.5 rounded-[1px] shadow-sm shrink-0">
                          <rect width="225" height="150" fill="#f93"/>
                          <rect width="225" height="100" y="50" fill="#fff"/>
                          <rect width="225" height="50" y="100" fill="#128807"/>
                          <circle cx="112.5" cy="75" r="20" fill="#000088"/>
                        </svg>
                        <span>India Applicability & Context</span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed bg-amber-500/5 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-500/10 dark:border-amber-900/30">
                        {g.indiaRelevance}
                      </p>
                    </div>

                    {/* References */}
                    {g.references && g.references.length > 0 && (
                      <div className="border-t border-zinc-100 dark:border-zinc-900 pt-3">
                        <h4 className="text-[10.5px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                          Official Literature & References
                        </h4>
                        <ul className="space-y-1">
                          {g.references.map((ref, i) => (
                            <li key={i} className="flex items-start text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                              <span className="mr-1.5 text-teal-600 dark:text-teal-400">[{i + 1}]</span>
                              <span className="flex-1 leading-snug">{ref}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
