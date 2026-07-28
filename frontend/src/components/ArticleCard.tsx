/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Clock, Bookmark, Calendar, Share2, Sparkles } from "lucide-react";
import { Article, EvidenceLevel, Region } from "../types";

interface ArticleCardProps {
  key?: string;
  article: Article;
  onSelect: (article: Article) => void;
  viewMode: "comfortable" | "compact";
  isSaved: boolean;
  onToggleSave: (e: React.MouseEvent, id: string) => void;
}

export default function ArticleCard({
  article,
  onSelect,
  viewMode,
  isSaved,
  onToggleSave
}: ArticleCardProps) {
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
    const isEditorialOrInsight = article.category === "Editorial" || article.category === "Clinical Insights" || (article as any).isEditorial;
    
    let shareText = "";
    if (isEditorialOrInsight) {
      const authorName = (article as any).author_name || article.sourceName || "HealicWire Expert";
      shareText = `${article.headline}\n\n${article.summary30s}\n\nAuthor: ${authorName}`;
    } else {
      shareText = `${article.headline}\n\n${article.summary30s}`;
    }

    try {
      if (navigator.share) {
        const shareData: ShareData = {
          title: article.headline,
          text: shareText,
          url: window.location.href,
        };

        if (!isEditorialOrInsight && article.imageUrl && navigator.canShare) {
          try {
            const response = await fetch(article.imageUrl);
            const blob = await response.blob();
            const mimeType = blob.type || 'image/jpeg';
            const extension = mimeType.split('/')[1] || 'jpg';
            const file = new File([blob], `article-image.${extension}`, { type: mimeType });
            if (navigator.canShare({ files: [file] })) {
              shareData.files = [file];
            }
          } catch (imgErr) {
            console.warn("Could not attach image to share data", imgErr);
          }
        }
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareText}\n\nRead more at: ${window.location.href}`);
        alert("Link and content copied to clipboard!");
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        navigator.clipboard.writeText(`${shareText}\n\nRead more at: ${window.location.href}`);
        alert("Link and content copied to clipboard!");
      }
    }
  };

  const formattedDate = new Date(article.publishedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

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
            {article.headline}
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
      className="group relative flex flex-col h-full bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-850 shadow-sm overflow-hidden hover:border-teal-500/50 dark:hover:border-teal-400/50 hover:shadow-md transition-all duration-200 cursor-pointer"
    >
      {/* Featured Image & Overlays */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-900">
        <img
          src={article.imageUrl}
          alt={article.headline}
          referrerPolicy="no-referrer"
          className="object-cover w-full h-full group-hover:scale-102 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {/* Evidence Badges */}
          <span className={`text-[10px] font-mono px-2.5 py-1 rounded-md border font-medium shadow-sm backdrop-blur-sm ${getEvidenceColor(article.evidenceLevel)}`}>
            {article.evidenceLevel}
          </span>

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

      {/* Content Area */}
      <div className="flex-1 p-5 flex flex-col justify-between">
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
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 leading-snug mb-2.5 transition-colors line-clamp-2">
            {article.headline}
          </h3>

          {/* 30s Summary */}
          <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed mb-4">
            {article.summary30s.replace(/\*\*/g, "").replace(/^#+\s*/gm, "")}
          </p>
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
