/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, ExternalLink, ShieldCheck, Activity, Pill, ShieldAlert, 
  BookOpen, FolderPlus, Sparkles, Building2, CheckCircle2, FileText, Share2
} from "lucide-react";
import { Article } from "../types";

interface PortalPageProps {
  section: string;
  slug: string;
  onBack: () => void;
}

export default function PortalPage({ section, slug, onBack }: PortalPageProps) {
  const [pageData, setPageData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/articles")
      .then(res => res.json())
      .then((articles: Article[]) => {
        const found = articles.find(a => 
          ((a as any).slug && (a as any).slug.toLowerCase() === slug.toLowerCase()) ||
          a.id === slug ||
          a.headline.toLowerCase().replace(/[^a-z0-9]+/g, "-").includes(slug.toLowerCase())
        );
        if (found) {
          setPageData(found);
        } else {
          setPageData(articles[0] || null);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center font-sans space-y-4">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-mono text-zinc-500">Generating Pleasant Responsive WebPage Layout...</p>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 font-sans text-center space-y-4">
        <div className="p-4 bg-red-50 text-red-700 text-xs font-mono rounded-xl border border-red-200">
          Generated Portal Page not found.
        </div>
        <button onClick={onBack} className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-bold">
          ← Back to Main Section
        </button>
      </div>
    );
  }

  const isArticle = Boolean(pageData.headline);
  const title = isArticle ? pageData.headline.replace(/^(Treatment Update|Pharma and Drugs|Hospital Intelligence|Current Guidelines|Any Other):\s*/, "") : pageData.title;
  const summaryText = pageData.summary30s || pageData.bodyAnalysis || pageData.summary || "No specific details provided.";
  const webpageImage = pageData.webpageImage || pageData.imageUrl;
  const logoUrl = pageData.logoUrl;
  const productName = pageData.productName;
  const productDetailsUrl = pageData.productDetailsUrl;

  const sectionPathMap: Record<string, string> = {
    "treatment-updates": "treatmentupdate",
    "pharma-drugs": "pharmadrugs",
    "alerts": "alerts",
    "guidelines": "guidelines",
    "pages": "pages"
  };

  const currentSectionPath = sectionPathMap[section] || section;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://healicwire.in';
  const liveUrl = `${origin}/${currentSectionPath}/${pageData.slug || slug}`;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 font-sans space-y-8 animate-fadeIn">
      
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400 hover:text-purple-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← Back to {pageData.category || "Section"}</span>
        </button>

        <div className="flex items-center space-x-2 text-xs font-mono text-zinc-400">
          <span>Shortened URL:</span>
          <span className="font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 rounded border border-purple-200 dark:border-purple-800">
            {liveUrl}
          </span>
        </div>
      </div>

      {/* MAIN GENERATED WEBPAGE CONTENT CARD */}
      <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
        
        {/* Uploaded Webpage Layout Image Banner */}
        {webpageImage && (
          <div className="w-full bg-zinc-900 overflow-hidden border-b border-zinc-200 dark:border-zinc-800 max-h-96">
            <img 
              src={webpageImage} 
              alt="Generated WebPage Design" 
              className="w-full h-full object-cover opacity-95" 
            />
          </div>
        )}

        <div className="p-6 sm:p-10 space-y-8">
          
          {/* Top Brand Bar (Logo + Product Name + Details Link) */}
          {(logoUrl || productName || productDetailsUrl) && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 border border-purple-200 dark:border-purple-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                {logoUrl && (
                  <img src={logoUrl} alt="Product Logo" className="h-12 w-auto max-w-[120px] object-contain rounded-lg bg-white p-1 border border-zinc-200 shadow-xs" />
                )}
                {productName && (
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-purple-600 tracking-wider">Product / Brand</span>
                    <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white leading-tight">{productName}</h2>
                  </div>
                )}
              </div>

              {productDetailsUrl && (
                <a
                  href={productDetailsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center space-x-2 shadow-sm transition-all"
                >
                  <span>Product Details Link</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}

          {/* Section Category Badge & Title */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-extrabold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200 uppercase">
                {pageData.category || "Specialty Page"}
              </span>
              <span className="text-xs font-mono text-zinc-400">Published {new Date(pageData.publishedAt || Date.now()).toLocaleDateString("en-IN")}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white leading-tight tracking-tight">
              {title}
            </h1>
          </div>

          {/* Specific Information & Criteria Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
              <FileText className="w-4 h-4 text-purple-600" />
              <span>Specific Information & Criteria</span>
            </div>
            
            <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans whitespace-pre-line">
              {summaryText}
            </div>
          </div>

          {/* Footer Action Links */}
          <div className="pt-6 border-t border-zinc-100 dark:border-zinc-900 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2 text-xs font-mono text-zinc-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>AI Page Layout Engine • Responsive across all devices</span>
            </div>

            {productDetailsUrl && (
              <a
                href={productDetailsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono font-bold text-purple-600 hover:underline flex items-center space-x-1.5"
              >
                <span>Visit Official Product Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
