/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Clock, Bookmark, Calendar, Share2, Sparkles } from "lucide-react";
import { Article, EvidenceLevel, Region } from "../types";

interface ArticleCardProps {
  key?: string;
  article: Article;
  onSelect: (article: Article) => void;
  viewMode: "comfortable" | "compact";
  isSaved: boolean;
  onToggleSave: (e: React.MouseEvent, id: string) => void;
  featured?: boolean;
}

export default function ArticleCard({
  article,
  onSelect,
  viewMode,
  isSaved,
  onToggleSave,
  featured
}: ArticleCardProps) {
  const [imageError, setImageError] = useState(false);

  // Color helper for evidence levels
  const getEvidenceColor = (level: EvidenceLevel) => {
    switch (level) {
      case EvidenceLevel.SYSTEMATIC_REVIEW:
      case EvidenceLevel.META_ANALYSIS:
        return "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-900";
      case EvidenceLevel.RCT:
        return "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900";
      case EvidenceLevel.CLINICAL_GUIDELINE:
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900";
      case EvidenceLevel.REGULATORY_APPROVAL:
        return "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-900";
      default:
        return "bg-zinc-50 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800";
    }
  };

  const getIndiaRelevanceBadge = (status: string) => {
    switch (status) {
      case "Directly applicable":
        return "bg-amber-100/80 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900";
      case "Partially applicable":
      case "Requires local adaptation":
        return "bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400 border-orange-200/50 dark:border-orange-900";
      default:
        return "bg-zinc-50 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800";
    }
  };

  const handleShare = async (article: Article, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Construct dynamic share URL targeting the backend OG generator
    const origin = window.location.origin.includes('localhost') ? 'https://healicwire.in' : window.location.origin;
    const shareUrl = `${origin}/api/share/article/${article.id}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: article.headline,
          text: article.summary30s.replace(/\*\*/g, "").replace(/^#+\s*/gm, ""),
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(`${article.headline}\n\n${shareUrl}`);
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        navigator.clipboard.writeText(`${article.headline}\n\n${shareUrl}`);
      }
    }
  };

  const formattedDate = article.publishedAt 
    ? new Date(article.publishedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      })
    : "N/A";

  if (viewMode === "compact") {
    return (
      <div
        id={`card-${article.id}`}
        onClick={() => onSelect(article)}
        className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 cursor-pointer transition-all duration-150"
      >
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex flex-wrap items-center gap-2 mb-1.5 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
            <span>{formattedDate}</span>
            <span className="text-zinc-300 dark:text-zinc-800">•</span>
            <span className="font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
              {article.category}
            </span>
            <span className="text-zinc-300 dark:text-zinc-800">•</span>
            <span>{article.sourceName}</span>
          </div>
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors truncate">
            {article.title || article.headline}
          </h4>
        </div>
        <div className="flex items-center space-x-3 mt-2 sm:mt-0">
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getEvidenceColor(article.evidenceLevel)}`}>
            {article.evidenceLevel}
          </span>
          <span className="text-xs font-mono text-zinc-400 flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>{article.readingTimeMinutes}m</span>
          </span>
          <button
            onClick={(e) => onToggleSave(e, article.id)}
            className={`p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
              isSaved ? "text-amber-500" : "text-zinc-300 dark:text-zinc-600"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <article
      id={`card-${article.id}`}
      onClick={() => onSelect(article)}
      className={`group relative flex h-full bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-850 shadow-sm overflow-hidden hover:border-teal-500/50 dark:hover:border-teal-400/50 hover:shadow-md transition-all duration-200 cursor-pointer ${featured ? "flex-col md:flex-row" : "flex-col"}`}
    >
      {/* Featured Image & Overlays */}
      {article.imageUrl && !imageError ? (
        <div className={`relative overflow-hidden bg-zinc-100 dark:bg-zinc-900 border-zinc-150 dark:border-zinc-900 ${featured ? "w-full aspect-[16/10] md:aspect-auto md:w-[45%] border-b md:border-b-0 md:border-r" : "w-full aspect-[16/10] border-b"}`}>
          <img
            src={article.imageUrl}
            alt={article.headline}
            referrerPolicy="no-referrer"
            className={`object-contain w-full h-full group-hover:scale-102 transition-transform duration-300 ${featured ? "md:absolute md:inset-0" : ""}`}
            onError={() => setImageError(true)}
          />
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {/* Evidence Badges */}
            {article.evidenceLevel && (
              <span className={`text-[10px] font-mono px-2.5 py-1 rounded-md border font-medium shadow-sm backdrop-blur-sm ${getEvidenceColor(article.evidenceLevel)}`}>
                {article.evidenceLevel}
              </span>
            )}
          </div>

          {/* Share Article Button */}
          <button
            onClick={(e) => handleShare(article, e)}
            className="absolute top-3 right-12 p-1.5 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-850 shadow-sm z-10 transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          {/* Save Article Button */}
          <button
            onClick={(e) => onToggleSave(e, article.id)}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-850 shadow-sm z-10 transition-all"
          >
            <Bookmark className={`w-3.5 h-3.5 transition-colors ${isSaved ? "fill-amber-500 text-amber-500" : ""}`} />
          </button>

          {article.isAiAssisted && (
            <div className="absolute bottom-2 right-2 flex items-center space-x-1 px-2 py-0.5 rounded bg-teal-500/90 text-white font-mono text-[9px] font-bold uppercase tracking-wider">
              <Sparkles className="w-2.5 h-2.5" />
              <span>AI Augmented</span>
            </div>
          )}
        </div>
      ) : (
        <div className="relative w-full px-5 pt-5 pb-0 flex justify-between items-start">
          <div className="flex flex-col gap-1.5 z-10">
            {article.evidenceLevel && (
              <span className={`text-[10px] font-mono px-2.5 py-1 rounded-md border font-medium shadow-sm backdrop-blur-sm ${getEvidenceColor(article.evidenceLevel)}`}>
                {article.evidenceLevel}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={(e) => handleShare(article, e)}
              className="p-1.5 rounded-full bg-zinc-50 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-850 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => onToggleSave(e, article.id)}
              className="p-1.5 rounded-full bg-zinc-50 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-850 transition-all"
            >
              <Bookmark className={`w-3.5 h-3.5 transition-colors ${isSaved ? "fill-amber-500 text-amber-500" : ""}`} />
            </button>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className={`flex-1 p-5 flex flex-col justify-between ${featured ? "md:p-8" : ""}`}>
        <div>
          {/* Metadata */}
          <div className="flex items-center space-x-2 text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2.5">
            <span className="font-semibold text-teal-600 dark:text-teal-400">{article.category}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formattedDate}
            </span>
          </div>

          {/* Headline */}
          <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2 leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-2">
            {article.title || article.headline}
          </h3>
          <p className="text-sm text-zinc-650 dark:text-zinc-400 line-clamp-2 leading-relaxed font-sans mb-3">
            {article.studySummary || article.summary || article.summary30s}
          </p>

          {/* 30s Summary or Detailed Fields */}
          {(article as any).current_recommendation ? (
            <div className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4 space-y-1.5 flex-1">
              {(article as any).condition && <p><strong className="text-zinc-900 dark:text-zinc-100 font-semibold">Condition:</strong> {(article as any).condition}</p>}
              {(article as any).issuing_organization && <p><strong className="text-zinc-900 dark:text-zinc-100 font-semibold">Issuing Org:</strong> {(article as any).issuing_organization}</p>}
              {(article as any).current_recommendation && <p className="line-clamp-2"><strong className="text-zinc-900 dark:text-zinc-100 font-semibold">Current Rec:</strong> {(article as any).current_recommendation}</p>}
              {(article as any).previous_recommendation && <p className="line-clamp-2"><strong className="text-zinc-900 dark:text-zinc-100 font-semibold">Previous Rec:</strong> {(article as any).previous_recommendation}</p>}
              {(article as any).reason_for_change && <p className="line-clamp-2"><strong className="text-zinc-900 dark:text-zinc-100 font-semibold">Reason for Change:</strong> {(article as any).reason_for_change}</p>}
              {(article as any).india_relevance && <p className="line-clamp-1"><strong className="text-zinc-900 dark:text-zinc-100 font-semibold">India Relevance:</strong> {(article as any).india_relevance}</p>}
            </div>
          ) : (
            <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed mb-4">
              {article.summary30s.replace(/\*\*/g, "").replace(/^#+\s*/gm, "")}
            </p>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-900 pt-3 text-[10.5px] font-mono text-zinc-500 dark:text-zinc-500">
          <span className="truncate max-w-[150px]">
            Source: <strong className="text-zinc-700 dark:text-zinc-300 font-medium">{article.sourceName}</strong>
          </span>
          <span className="flex items-center space-x-1 shrink-0 text-zinc-400">
            <Clock className="w-3 h-3" />
            <span>{article.readingTimeMinutes} min read</span>
          </span>
        </div>
      </div>
    </article>
  );
}
