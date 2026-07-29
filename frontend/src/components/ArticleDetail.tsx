/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Sparkles, HelpCircle, CheckCircle, ChevronRight, User, GraduationCap, Building2, Eye, ShieldAlert, FileText, Send, Star, FileSpreadsheet, RotateCcw, BookOpen, X, Palette, Type, Activity, ArrowLeft, Clock, Calendar, Bookmark, Share2, AlertTriangle } from "lucide-react";
import { Article, EvidenceLevel, Region } from "../types";
import { supabase } from "../lib/supabase";

interface ArticleDetailProps {
  article: Article;
  onBack: () => void;
  isSaved: boolean;
  onToggleSave: (e: React.MouseEvent, id: string) => void;
  onRefreshArticle: () => void;
}

export default function ArticleDetail({
  article,
  onBack,
  isSaved,
  onToggleSave,
  onRefreshArticle
}: ArticleDetailProps) {
  // Reading mode
  const [readingMode, setReadingMode] = useState<"30s" | "2min" | "detailed">("30s");
  
  // Typography & Reading preferences
  const [fontFamily, setFontFamily] = useState<"sans" | "serif" | "mono">("serif");
  const [fontSizeClass, setFontSizeClass] = useState<"sm" | "base" | "lg" | "xl">("base");
  const [readerTheme, setReaderTheme] = useState<"default" | "warm" | "dark">("warm");
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    if (readingMode !== "detailed") {
      setReadingProgress(0);
      return;
    }

    const handleScroll = () => {
      const element = document.getElementById("detailed-analysis-container");
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const elementHeight = rect.height;
      const windowHeight = window.innerHeight;
      
      // Calculate how much of the element is scrolled past the top
      const scrollTop = -rect.top + 100;
      const scrollableHeight = elementHeight - windowHeight + 100;
      
      if (scrollTop <= 0) {
        setReadingProgress(0);
      } else if (scrollTop >= scrollableHeight) {
        setReadingProgress(100);
      } else {
        const progress = Math.min(100, Math.max(0, (scrollTop / scrollableHeight) * 100));
        setReadingProgress(progress);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [readingMode]);

  // Audience tabs
  const [activeAudience, setActiveAudience] = useState<"clinicians" | "students" | "hospitalAdministrators" | "patients" | "researchers">("clinicians");
  // Quiz tabs
  const [learningTab, setLearningTab] = useState<"revision" | "mcqs" | "flashcards" | "viva">("revision");
  
  // Interactive states for MCQ
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: number }>({});
  // Interactive state for Flashcard flipping
  const [flippedCard, setFlippedCard] = useState<boolean>(false);
  // Interactive state for Viva showing answers
  const [showVivaAnswer, setShowVivaAnswer] = useState<{ [key: string]: boolean }>({});

  // AI Assistant Chat state
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "model"; text: string }>>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // AI Fact Checker state
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any[]>(article.factCheckClaims || []);

  // AI Learning Module Generation state
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  // Correction Modal
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionText, setCorrectionText] = useState("");
  const [correctionSuccess, setCorrectionSuccess] = useState(false);

  // Toast / Share notification
  const [shareText, setShareText] = useState("Share Article");

  const formattedDate = new Date(article.publishedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const getIndiaRelevanceColor = (status: string) => {
    switch (status) {
      case "Directly applicable":
        return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-950/30 dark:bg-emerald-950/20 dark:text-emerald-300";
      case "Partially applicable":
      case "Requires local adaptation":
        return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-950/30 dark:bg-amber-950/20 dark:text-amber-300";
      default:
        return "border-zinc-200 bg-zinc-50 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300";
    }
  };

  const getEvidenceColor = (level: EvidenceLevel) => {
    switch (level) {
      case EvidenceLevel.SYSTEMATIC_REVIEW:
      case EvidenceLevel.META_ANALYSIS:
        return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300";
      case EvidenceLevel.RCT:
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300";
      case EvidenceLevel.CLINICAL_GUIDELINE:
        return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300";
      case EvidenceLevel.REGULATORY_APPROVAL:
        return "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300";
      default:
        return "bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300";
    }
  };

  // Run claims verification
  const handleVerifyClaims = async () => {
    setVerifying(true);
    const { data: { session } } = await supabase.auth.getSession();
    fetch(`/api/articles/${article.id}/verify`, {
      method: "POST",
      headers: {
        "Authorization": session ? `Bearer ${session.access_token}` : ""
      }
    })
      .then(res => res.json())
      .then(data => {
        setVerificationResult(data);
        setVerifying(false);
        onRefreshArticle(); // Pull updated factCheckClaims in parent
      })
      .catch(err => {
        console.error("Verification failed:", err);
        setVerifying(false);
      });
  };

  // Generate Interactive Quiz
  const handleGenerateQuiz = async () => {
    setGeneratingQuiz(true);
    const { data: { session } } = await supabase.auth.getSession();
    fetch(`/api/articles/${article.id}/quiz`, {
      method: "POST",
      headers: {
        "Authorization": session ? `Bearer ${session.access_token}` : ""
      }
    })
      .then(res => res.json())
      .then(() => {
        setGeneratingQuiz(false);
        onRefreshArticle(); // Refresh article object to populate learningModule
      })
      .catch(err => {
        console.error("Quiz generation failed:", err);
        setGeneratingQuiz(false);
      });
  };

  // Handle clinical Q&A assistant
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { role: "user" as const, text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    fetch(`/api/articles/${article.id}/assistant`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": session ? `Bearer ${session.access_token}` : ""
      },
      body: JSON.stringify({ question: userMsg.text, history: chatMessages })
    })
      .then(res => res.json())
      .then(data => {
        setChatMessages(prev => [...prev, { role: "model", text: data.text }]);
        setChatLoading(false);
      })
      .catch(err => {
        console.error("Clinical assistant failed:", err);
        setChatMessages(prev => [...prev, { role: "model", text: "Communication failed with the Clinical Assistant." }]);
        setChatLoading(false);
      });
  };

  // Handle reporting error/correction
  const handleReportCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionText.trim()) return;

    fetch("/api/corrections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        articleId: article.id,
        articleHeadline: article.headline,
        description: correctionText
      })
    })
      .then(res => res.json())
      .then(() => {
        setCorrectionSuccess(true);
        setTimeout(() => {
          setCorrectionSuccess(false);
          setCorrectionText("");
          setShowCorrectionModal(false);
        }, 1500);
      })
      .catch(err => console.error(err));
  };

  const handleShare = async () => {
    // Construct dynamic share URL targeting the backend OG generator
    const origin = window.location.origin.includes('localhost') ? 'https://healicwire.in' : window.location.origin;
    const shareUrl = `${origin}/api/share/article/${article.id}`;
    
    // Only pass the URL and Title, allowing WhatsApp to natively generate a Link Preview
    try {
      if (navigator.share) {
        await navigator.share({
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(`${article.headline}\n\n${shareUrl}`);
        setShareText("Copied to Clipboard!");
        setTimeout(() => setShareText("Share Article"), 2000);
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        navigator.clipboard.writeText(`${article.headline}\n\n${shareUrl}`);
        setShareText("Copied to Clipboard!");
        setTimeout(() => setShareText("Share Article"), 2000);
      }
    }
  };

  const pStyles = getInteractivePanelStyles(readerTheme);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 bg-zinc-50/10 dark:bg-zinc-950/10">
      {/* Back button and main sticky header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-xs font-mono font-bold text-zinc-600 dark:text-zinc-450 hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Intel Feed</span>
        </button>

        <div className="flex items-center space-x-2">
          {/* Save Button */}
          <button
            onClick={(e) => onToggleSave(e, article.id)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 text-xs font-medium cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all ${
              isSaved ? "text-amber-600 dark:text-amber-400" : "text-zinc-600 dark:text-zinc-300"
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-current" : ""}`} />
            <span>{isSaved ? "Saved Locally" : "Save Offline"}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300 font-medium cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{shareText}</span>
          </button>

          {/* Correction Report */}
          <button
            onClick={() => setShowCorrectionModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-red-200 dark:border-red-950 text-xs text-red-600 dark:text-red-400 font-semibold cursor-pointer hover:bg-red-500/5 transition-all"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Report Error</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT TWO COLUMNS: Headline, Summaries, Impact, Analysis */}
        <div className="lg:col-span-2 space-y-8">
          {/* Author Profile Banner for Clinical Insights */}
          {(article.category === "Clinical Insights" || article.author_name) && (
            <div className="p-6 mb-6 rounded-2xl bg-gradient-to-r from-teal-900/10 via-emerald-900/10 to-cyan-900/10 dark:from-teal-950/50 dark:via-emerald-950/50 dark:to-cyan-950/50 border border-teal-200/80 dark:border-teal-800/80 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <img
                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80"
                alt={article.author_name || "Dr. Priya Nair"}
                className="w-20 h-20 rounded-full object-cover border-3 border-teal-600 shadow-md shrink-0"
              />
              <div className="space-y-1.5 text-center sm:text-left flex-1">
                <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                  {article.author_name || "Dr. Priya Nair"}
                </h2>
                <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 font-semibold tracking-wide">
                  {article.author_qualifications || "MBBS, MD (General Medicine), DM (Endocrinology)"}
                </p>
                <p className="text-sm font-sans text-teal-700 dark:text-teal-400 font-bold">
                  {article.author_title || "Consultant Endocrinologist & Diabetologist"}
                </p>
              </div>
            </div>
          )}

          {/* Article Header Metadata */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs font-mono font-bold uppercase text-teal-600 dark:text-teal-400 tracking-wider">
                {article.category}
              </span>
              <span className="text-zinc-350 dark:text-zinc-800">•</span>
              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formattedDate}</span>
              </span>
              <span className="text-zinc-350 dark:text-zinc-800">•</span>
              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{article.readingTimeMinutes}m read</span>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-tight mb-3">
              {article.headline}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-sans font-medium mb-6">
              {article.subhead}
            </p>

            {/* Featured Image */}
            <div className="rounded-xl overflow-hidden aspect-[16/9] w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 mb-4">
              <img src={article.imageUrl} alt={article.headline} referrerPolicy="no-referrer" className="object-cover w-full h-full" />
            </div>
            <p className="text-[10px] font-mono text-zinc-400 text-right pr-2">
              Credit: {article.imageCredit} ({article.imageType})
            </p>
          </div>

          {/* LAYERED READING MODE CONTROLS */}
          <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-850 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-900 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h4 className="text-xs font-mono font-bold uppercase text-zinc-700 dark:text-zinc-300">
                  Layered Medical Reading
                </h4>
              </div>
              {/* Controls */}
              <div className="flex bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200/50 dark:border-zinc-800 self-start sm:self-auto">
                {[
                  { id: "30s", label: "30s Summary" },
                  { id: "2min", label: "2m Brief" },
                  { id: "detailed", label: "Detailed Analysis" }
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setReadingMode(mode.id as any)}
                    className={`px-2.5 py-1 text-[10.5px] font-mono font-bold uppercase rounded-md transition-all ${
                      readingMode === mode.id
                        ? "bg-teal-600 text-white shadow-sm"
                        : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content box based on mode */}
            <div className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {readingMode === "30s" && (
                <div className="p-5 rounded-xl bg-teal-500/5 border border-teal-500/10 dark:bg-teal-950/5 animate-fade-in">
                  <div className="font-sans text-teal-950 dark:text-teal-300 text-sm leading-relaxed whitespace-pre-line">
                    {formatInlineMarkdown(article.summary30s, readerTheme)}
                  </div>
                </div>
              )}

              {readingMode === "2min" && (
                <div className="p-5 rounded-xl bg-zinc-50 dark:bg-zinc-900/20 border border-zinc-200/50 dark:border-zinc-850 animate-fade-in">
                  <div className="font-sans text-zinc-800 dark:text-zinc-300 leading-relaxed space-y-3 whitespace-pre-line">
                    {formatInlineMarkdown(article.summary2min, readerTheme)}
                  </div>
                </div>
              )}

              {readingMode === "detailed" && (
                <div className="space-y-4 animate-fade-in">
                  {/* Dynamic Progress Bar */}
                  <div className="sticky top-[56px] z-40 bg-white/80 dark:bg-zinc-950/85 backdrop-blur-md py-2 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-[10px] font-mono font-bold uppercase text-zinc-500">
                      <span>Progress:</span>
                      <span className="text-teal-600">{Math.round(readingProgress)}%</span>
                    </div>
                    <div className="flex-1 mx-3 h-1 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-600 rounded-full transition-all duration-75" style={{ width: `${readingProgress}%` }} />
                    </div>
                    
                    {/* Tiny Custom Controls */}
                    <div className="flex items-center space-x-1.5 border-l border-zinc-150 dark:border-zinc-850 pl-3">
                      {/* Font Size Adjusters */}
                      <button 
                        onClick={() => setFontSizeClass(s => s === "sm" ? "base" : s === "base" ? "lg" : s === "lg" ? "xl" : "sm")}
                        title="Toggle Font Size"
                        className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                      >
                        <Type className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* TABLE OF CONTENTS */}
                  <div className="p-4 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/10 border border-zinc-150 dark:border-zinc-850">
                    <h5 className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-zinc-500 mb-2">
                      Table of Contents
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {article.bodyAnalysis
                        .split("\n")
                        .filter(line => line.trim().startsWith("#"))
                        .map((line, sIdx) => {
                          const titleText = line.trim().replace(/^#+\s*/, "");
                          const targetId = `section-${sIdx}`;
                          return (
                            <button
                              key={sIdx}
                              onClick={() => {
                                const el = document.getElementById(targetId);
                                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                              }}
                              className="text-left text-[11px] text-teal-700 hover:text-teal-900 dark:text-teal-400 dark:hover:text-teal-300 font-semibold hover:underline flex items-center space-x-1.5 py-0.5"
                            >
                              <ChevronRight className="w-3 h-3 shrink-0 text-teal-500" />
                              <span className="truncate">{titleText}</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {/* MAIN DETAILED ANALYSIS PARSED BODY */}
                  <div 
                    id="detailed-analysis-container"
                    className={`p-6 md:p-8 rounded-2xl border transition-all duration-300 ${
                      readerTheme === "warm" 
                        ? "bg-[#FAF6F0] text-[#2C2A29] border-[#E8E2D9]" 
                        : readerTheme === "dark" 
                        ? "bg-zinc-900 text-zinc-200 border-zinc-800" 
                        : "bg-white text-zinc-900 border-zinc-200 dark:bg-zinc-950 dark:text-zinc-100 dark:border-zinc-850"
                    } ${
                      fontFamily === "serif" ? "font-serif tracking-normal leading-relaxed" : fontFamily === "sans" ? "font-sans tracking-tight leading-relaxed" : "font-mono text-xs leading-relaxed"
                    } ${
                      fontSizeClass === "sm" ? "text-[11px] md:text-xs" : fontSizeClass === "base" ? "text-xs md:text-sm" : fontSizeClass === "lg" ? "text-sm md:text-base" : "text-base md:text-lg"
                    }`}
                  >
                    {renderDetailedAnalysis(article.bodyAnalysis, article.id, readerTheme)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* INTERACTIVE WHY THIS MATTERS TABS */}
          {article.whyThisMatters && (
            <div className={pStyles.container}>
            <div className={pStyles.header}>
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-amber-500" />
                <h4 className={pStyles.headerTitle}>
                  Audience-Specific Interpretation — Why This Matters
                </h4>
              </div>
            </div>

            {/* Tabs Row */}
            <div className={`flex border-b overflow-x-auto scrollbar-none ${pStyles.tabsBorder}`}>
              {[
                { id: "clinicians", label: "Clinicians", icon: User },
                { id: "students", label: "Students", icon: GraduationCap },
                { id: "hospitalAdministrators", label: "Hospital Admins", icon: Building2 },
                { id: "patients", label: "Patients", icon: HelpCircle },
                { id: "researchers", label: "Researchers", icon: FileSpreadsheet }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeAudience === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveAudience(tab.id as any)}
                    className={`flex items-center space-x-1 px-4 py-3 border-b-2 font-mono text-[10.5px] font-bold uppercase whitespace-nowrap transition-all ${
                      isActive
                        ? pStyles.tabActive
                        : pStyles.tabInactive
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div className={`p-5 text-xs leading-relaxed font-sans ${pStyles.textPrimary}`}>
              <p className={`p-4 rounded-lg ${pStyles.innerCard}`}>
                {article.whyThisMatters[activeAudience]}
              </p>
            </div>
            </div>
          )}

          {/* SIDE-BY-SIDE RECOMMENDATION COMPARISON "WHAT CHANGED" */}
          {article.whatChanged && (
            <div className={pStyles.container}>
              <div className={pStyles.header}>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <h4 className={pStyles.headerTitle}>
                    Clinical recommendation Shift
                  </h4>
                </div>
                <span className={pStyles.badge}>
                  Recommendation strength: {article.whatChanged.strength}
                </span>
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                {/* Previous */}
                <div className={`p-4 rounded-lg ${pStyles.innerCard}`}>
                  <span className={`text-[10px] font-mono font-bold block mb-1 uppercase tracking-wider ${pStyles.textMuted}`}>
                    Previous Clinical Standard
                  </span>
                  <p className={pStyles.textPrimary}>{article.whatChanged.previous}</p>
                </div>

                {/* Current */}
                <div className={`p-4 rounded-lg ${pStyles.innerCardAlt}`}>
                  <span className="text-[10px] font-mono font-bold text-teal-650 dark:text-teal-400 block mb-1 uppercase tracking-wider">
                    New Clinical Standard (Current)
                  </span>
                  <p className={pStyles.textBoldAccent}>{article.whatChanged.current}</p>
                </div>

                {/* Rationale and Deadlines (Spans both) */}
                <div className={`md:col-span-2 pt-2 border-t mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 ${pStyles.tabsBorder}`}>
                  <div>
                    <span className={`text-[10px] font-mono font-bold block uppercase tracking-wider mb-0.5 ${pStyles.textMuted}`}>
                      Rationale for Shift
                    </span>
                    <p className={pStyles.textPrimary}>{article.whatChanged.reason}</p>
                  </div>
                  {article.whatChanged.deadline && (
                    <div>
                      <span className={`text-[10px] font-mono font-bold block uppercase tracking-wider mb-0.5 ${pStyles.textMuted}`}>
                        Implementation Deadline
                      </span>
                      <p className="text-amber-700 dark:text-amber-400 font-semibold">{article.whatChanged.deadline}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* REFERENCES & ORIGINAL LINK */}
          {(article.references?.length > 0 || article.sourceName) && (
            <div className={pStyles.container}>
              <div className={pStyles.header}>
                <h4 className={pStyles.headerTitle}>
                  Official Citations & External Sources
                </h4>
              </div>
              <div className="p-5 text-xs">
                {article.references && article.references.length > 0 && (
                  <ul className={`space-y-2 mb-4 font-mono ${pStyles.textPrimary}`}>
                    {article.references.map((ref, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-teal-600 dark:text-teal-400 mr-2 shrink-0">[{idx + 1}]</span>
                        <span className="leading-snug">{ref}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className={`border-t pt-3 flex items-center justify-between text-[11px] font-mono ${pStyles.tabsBorder}`}>
                  <span className={pStyles.textPrimary}>Source Organization: <strong className={pStyles.headerTitle}>{article.sourceName || "HealicWire Editorial Board"}</strong></span>
                  {article.sourceUrl && (
                    <a
                      href={article.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-600 dark:text-teal-400 hover:underline flex items-center space-x-1 font-semibold"
                    >
                      <span>Read the original report</span>
                      <ChevronRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: AI Credibility panel, Clinical Chat, dynamic exam prep */}
        <div className="space-y-8">
          {/* 1. EVIDENCE & CREDIBILITY PANEL + AI CLAIM VERIFIER */}
          <div className={pStyles.container}>
            <div className={pStyles.header}>
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4.5 h-4.5 text-teal-600" />
                <h4 className={pStyles.headerTitle}>
                  Evidence & Credibility Metrics
                </h4>
              </div>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className={pStyles.textMuted}>Evidence Level:</span>
                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${getEvidenceColor(article.evidenceLevel)}`}>
                    {article.evidenceLevel}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className={pStyles.textMuted}>Peer-Reviewed:</span>
                  <span className={`text-[10px] font-mono px-2 py-0.2 rounded border font-bold ${article.peerReviewed ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                    {article.peerReviewed ? "Yes" : "No / In Review"}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className={pStyles.textMuted}>Study Design:</span>
                  <span className={`font-mono text-[11px] ${pStyles.textPrimary}`}>{article.studyDesign || "N/A (Clinical Policy)"}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className={pStyles.textMuted}>Sample Size:</span>
                  <span className={`font-mono text-[11px] ${pStyles.textPrimary}`}>{article.sampleSize || "N/A"}</span>
                </div>

                <div className={`pt-2 border-t text-[11px] leading-snug ${pStyles.tabsBorder} ${pStyles.textPrimary}`}>
                  <strong>Funding:</strong> {article.fundingSource}
                  <br />
                  <strong className="block mt-1">Disclosures:</strong> {article.coiNote}
                </div>
              </div>

              {/* AI Claims Fact-Checker button */}
              <div className={`pt-2 border-t ${pStyles.tabsBorder}`}>
                <button
                  onClick={handleVerifyClaims}
                  disabled={verifying}
                  className={`w-full py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${pStyles.btnSecondary}`}
                >
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>{verifying ? "Verifying with global databases..." : "Perform AI Fact-Check"}</span>
                </button>

                {/* Verified Claims output list */}
                {verificationResult.length > 0 && (
                  <div className={`mt-4 space-y-3 border-t border-dashed pt-3 animate-fadeIn ${pStyles.tabsBorder}`}>
                    <h5 className="text-[10px] font-mono font-bold text-teal-600 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>AI Based Medical Fact Verification</span>
                    </h5>
                    {verificationResult.map((claim, cIdx) => (
                      <div key={claim.id || cIdx} className={`p-2.5 rounded border text-xs ${pStyles.innerCard}`}>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className={`font-bold text-[10.5px] leading-tight ${pStyles.textPrimary}`}>Claim {cIdx + 1}:</span>
                          <span className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                            claim.status === "Supported"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : claim.status === "Partially supported"
                              ? "bg-amber-500/10 text-amber-600"
                              : "bg-red-500/10 text-red-600"
                          }`}>
                            {claim.status}
                          </span>
                        </div>
                        <p className={`leading-normal text-[11px] mb-1.5 ${pStyles.textPrimary}`}>{claim.claim}</p>
                        <span className={`text-[9.5px] font-mono leading-snug block ${pStyles.textMuted}`}>Ref: {claim.reference}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. CLINICAL NEWS AI ASSISTANT CHAT PANEL */}
          <div className={pStyles.container}>
            <div className={pStyles.header}>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h4 className={pStyles.headerTitle}>
                  Article Clinical Assistant
                </h4>
              </div>
              <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded">
                Grounded Q&A
              </span>
            </div>

            {/* Chat message threads */}
            <div className={`p-4 h-64 overflow-y-auto space-y-3 border-b flex flex-col scrollbar-thin ${pStyles.innerCardAlt} ${pStyles.tabsBorder}`}>
              {chatMessages.length === 0 ? (
                <div className="text-center my-auto p-4">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans leading-relaxed">
                    Ask specific clinical questions related to this news (e.g., &quot;Is this regimen safe in pregnant cohorts?&quot;, &quot;What are the primary side effects?&quot;). Answers are safely grounded strictly in this text and global standards.
                  </p>
                </div>
              ) : (
                chatMessages.map((msg, mIdx) => (
                  <div
                    key={mIdx}
                    className={`max-w-[85%] rounded-xl p-3 text-xs leading-normal font-sans ${
                      msg.role === "user"
                        ? "bg-teal-600 text-white self-end rounded-tr-none"
                        : `${pStyles.innerCard} ${pStyles.textPrimary} self-start rounded-tl-none shadow-xs`
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                ))
              )}
              {chatLoading && (
                <div className={`p-3 rounded-xl text-xs self-start rounded-tl-none shadow-xs font-mono flex items-center space-x-2 ${pStyles.innerCard}`}>
                  <span className="w-1.5 h-1.5 bg-zinc-450 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-zinc-450 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-zinc-450 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              )}
            </div>

            {/* Chat Input form */}
            <form onSubmit={handleSendChatMessage} className="p-3 flex items-center space-x-2">
              <input
                type="text"
                disabled={chatLoading}
                placeholder="Ask clinical question on this development..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                className={`flex-1 px-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-teal-500 ${pStyles.inputBg}`}
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="p-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white disabled:bg-zinc-100 disabled:text-zinc-300 dark:disabled:bg-zinc-900 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* 3. NEWS-TO-LEARNING DYNAMIC MODULE PANEL */}
          <div className={pStyles.container}>
            <div className={pStyles.header}>
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-4.5 h-4.5 text-teal-600" />
                <h4 className={pStyles.headerTitle}>
                  News-To-Learning Exam Prep
                </h4>
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-600 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                Study Module
              </span>
            </div>

            {/* If no learning module exists yet */}
            {!article.learningModule ? (
              <div className="p-6 text-center space-y-4">
                <p className={`text-xs leading-relaxed font-sans ${pStyles.textMuted}`}>
                  Convert this clinical news article into interactive multiple-choice questions, flippable revision cards, and viva questions dynamically with AI Based!
                </p>
                <button
                  onClick={handleGenerateQuiz}
                  disabled={generatingQuiz}
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-mono font-bold uppercase rounded-lg shadow-md shadow-teal-500/15 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: generatingQuiz ? "2s" : "0s" }} />
                  <span>{generatingQuiz ? "Formulating Exam Module..." : "Generate Study & Assessment Module"}</span>
                </button>
              </div>
            ) : (
              /* Learning Module exists */
              <div>
                {/* Selector tabs */}
                <div className={`flex border-b ${pStyles.tabsBorder}`}>
                  {[
                    { id: "revision", label: "Revision" },
                    { id: "mcqs", label: "MCQs" },
                    { id: "flashcards", label: "Cards" },
                    { id: "viva", label: "Viva" }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setLearningTab(tab.id as any)}
                      className={`flex-1 py-2.5 font-mono text-[10px] font-bold uppercase text-center border-b-2 transition-all ${
                        learningTab === tab.id
                          ? pStyles.tabActive
                          : pStyles.tabInactive
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab contents */}
                <div className={`p-5 text-xs leading-normal ${pStyles.textPrimary}`}>
                  {/* Revision tab */}
                  {learningTab === "revision" && (
                    <div className="space-y-3 font-sans leading-relaxed">
                      <div className={`p-3 rounded-lg border ${pStyles.innerCardAlt}`}>
                        <strong className="text-[10px] font-mono text-teal-600 dark:text-teal-400 block mb-1.5 uppercase tracking-wider">
                          One-Minute Rapid Revision:
                        </strong>
                        <p>{article.learningModule.oneMinuteRevision}</p>
                      </div>
                    </div>
                  )}

                  {/* MCQs tab */}
                  {learningTab === "mcqs" && (
                    <div className="space-y-5">
                      {article.learningModule.mcqs.map((q, qIdx) => {
                        const isAnswered = selectedAnswers[q.id] !== undefined;
                        const chosenIdx = selectedAnswers[q.id];
                        return (
                          <div key={q.id} className={`p-3 border rounded-lg ${pStyles.innerCard}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Question {qIdx + 1}</span>
                              <span className="text-[9px] font-mono bg-zinc-150 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">{q.cognitiveLevel}</span>
                            </div>
                            <p className="font-semibold mb-3 font-sans">{q.question}</p>
                            <div className="space-y-2">
                              {q.options.map((opt, oIdx) => {
                                const isCorrect = oIdx === q.correctAnswerIndex;
                                const isChosen = oIdx === chosenIdx;
                                let btnStyle = "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900";
                                if (isAnswered) {
                                  if (isCorrect) btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-850 dark:bg-emerald-950/20 dark:text-emerald-350";
                                  else if (isChosen) btnStyle = "border-red-500 bg-red-50 text-red-850 dark:bg-red-950/20 dark:text-red-350";
                                  else btnStyle = "border-zinc-150 dark:border-zinc-850 opacity-60";
                                }
                                return (
                                  <button
                                    key={oIdx}
                                    disabled={isAnswered}
                                    onClick={() => setSelectedAnswers(prev => ({ ...prev, [q.id]: oIdx }))}
                                    className={`w-full text-left p-2.5 rounded border text-xs font-sans transition-all flex items-center justify-between ${btnStyle}`}
                                  >
                                    <span>{opt}</span>
                                    {isAnswered && isCorrect && <span className="text-emerald-600 font-bold ml-2">✓</span>}
                                    {isAnswered && isChosen && !isCorrect && <span className="text-red-600 font-bold ml-2">✗</span>}
                                  </button>
                                );
                              })}
                            </div>
                            {isAnswered && (
                              <div className={`mt-3 p-3 rounded text-[11px] leading-relaxed animate-fadeIn ${pStyles.innerCardAlt}`}>
                                <strong>Rationale:</strong> {q.explanation}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {/* Reset Answers */}
                      {Object.keys(selectedAnswers).length > 0 && (
                        <button
                          onClick={() => setSelectedAnswers({})}
                          className="w-full py-1.5 border border-zinc-200 dark:border-zinc-800 rounded font-mono text-[10px] text-zinc-500 hover:text-zinc-800 flex items-center justify-center space-x-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset Answers</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Flashcards tab */}
                  {learningTab === "flashcards" && (
                    <div className="space-y-4 text-center">
                      {article.learningModule.flashcards.map(fc => (
                        <div
                          key={fc.id}
                          onClick={() => setFlippedCard(!flippedCard)}
                          className={`h-32 border rounded-xl flex items-center justify-center p-4 cursor-pointer transition-all hover:shadow-xs hover:border-teal-500/40 ${pStyles.innerCard}`}
                        >
                          <div className="space-y-2">
                            <span className="text-[9px] font-mono font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest block mb-1">
                              Topic: {fc.topic} ({flippedCard ? "Answer" : "Question"})
                            </span>
                            <p className="text-xs font-bold leading-relaxed font-sans max-w-sm mx-auto">
                              {flippedCard ? fc.back : fc.front}
                            </p>
                            <span className="text-[9px] font-mono text-zinc-400 mt-2 block">
                              Click to flip card
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Viva tab */}
                  {learningTab === "viva" && (
                    <div className="space-y-4">
                      {article.learningModule.vivaQuestions.map(vq => {
                        const showAnswer = showVivaAnswer[vq.id];
                        return (
                          <div key={vq.id} className={`p-3 border rounded-lg ${pStyles.innerCard}`}>
                            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block mb-1">Theoretical Viva Prep</span>
                            <p className="font-bold mb-3 font-sans leading-tight">{vq.question}</p>
                            
                            {!showAnswer ? (
                              <button
                                onClick={() => setShowVivaAnswer(prev => ({ ...prev, [vq.id]: true }))}
                                className="px-3 py-1.5 rounded bg-teal-600 text-white text-[10px] font-mono font-bold uppercase hover:bg-teal-700 cursor-pointer"
                              >
                                Show Model Answer
                              </button>
                            ) : (
                              <div className={`space-y-3 pt-3 border-t border-dashed animate-fadeIn ${pStyles.tabsBorder}`}>
                                <div className="text-[11.5px] leading-relaxed">
                                  <strong>Model Answer:</strong>
                                  <p className="mt-1 font-sans">{vq.modelAnswer}</p>
                                </div>
                                <div className="space-y-1">
                                  <strong className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Key grading points:</strong>
                                  <ul className="list-disc list-inside space-y-0.5 text-[11px] font-sans pl-1">
                                    {vq.keyPoints.map((kp, kIdx) => (
                                      <li key={kIdx}>{kp}</li>
                                    ))}
                                  </ul>
                                </div>
                                <button
                                  onClick={() => setShowVivaAnswer(prev => ({ ...prev, [vq.id]: false }))}
                                  className="px-2 py-1 rounded border border-zinc-200 dark:border-zinc-850 text-[10px] font-mono text-zinc-500 hover:text-zinc-750"
                                >
                                  Hide Answer
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ERROR CORRECTION FORM MODAL */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-55 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 max-w-md w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 relative animate-scaleIn">
            <button
              onClick={() => setShowCorrectionModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-zinc-450 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 mb-4">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="font-bold text-sm font-mono uppercase tracking-wider text-zinc-900 dark:text-white">
                Submit Editorial Correction
              </h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
              We value accuracy above all. If you found a discrepancy, data error, or outdated guideline in this article, describe it clearly. Your report goes directly to the HealicWire board for review.
            </p>

            {correctionSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 animate-pulse" />
                <span>Correction report submitted successfully. Thank you for your review.</span>
              </div>
            ) : (
              <form onSubmit={handleReportCorrection} className="space-y-4">
                <div>
                  <label className="block text-[10.5px] font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-1">
                    Discrepancy Details
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide specific details about the error, e.g., 'Page 3 of the citation says Moxifloxacin dose is high, but standard is 400mg...'"
                    value={correctionText}
                    onChange={e => setCorrectionText(e.target.value)}
                    className="w-full p-3 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-bold uppercase rounded-lg cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>File Correction Report</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// CLINICAL VISUALIZERS & MARKDOWN ENGINE
// ==========================================

function getReaderStyles(readerTheme: "default" | "warm" | "dark") {
  return {
    h3: readerTheme === "warm"
      ? "text-[#1C1A19] border-b border-[#E8E2D9]"
      : readerTheme === "dark"
      ? "text-zinc-50 border-b border-zinc-800"
      : "text-zinc-900 dark:text-zinc-50 border-b border-zinc-150 dark:border-zinc-850",
    
    p: readerTheme === "warm"
      ? "text-[#2C2A29]"
      : readerTheme === "dark"
      ? "text-zinc-200"
      : "text-zinc-800 dark:text-zinc-200",
    
    strong: readerTheme === "warm"
      ? "text-[#1C1A19] font-extrabold"
      : readerTheme === "dark"
      ? "text-zinc-50 font-extrabold"
      : "text-zinc-950 dark:text-zinc-50 font-extrabold",
    
    em: readerTheme === "warm"
      ? "text-[#2C2A29] italic"
      : readerTheme === "dark"
      ? "text-zinc-100 italic"
      : "text-zinc-900 dark:text-zinc-200 italic",
    
    ul: readerTheme === "warm"
      ? "text-[#2C2A29]"
      : readerTheme === "dark"
      ? "text-zinc-350"
      : "text-zinc-700 dark:text-zinc-300",
    
    th: readerTheme === "warm"
      ? "text-[#4A4745] bg-[#F3ECE0]"
      : readerTheme === "dark"
      ? "text-zinc-400 bg-zinc-900/80"
      : "text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900/50",
    
    td: readerTheme === "warm"
      ? "text-[#2C2A29] border-[#E8E2D9]"
      : readerTheme === "dark"
      ? "text-zinc-300 border-zinc-800"
      : "text-zinc-700 dark:text-zinc-300 border-zinc-100 dark:border-zinc-900",
    
    tableContainer: readerTheme === "warm"
      ? "border-[#E8E2D9] bg-[#FCFAF7]"
      : readerTheme === "dark"
      ? "border-zinc-800 bg-zinc-950"
      : "border-zinc-205 dark:border-zinc-800 bg-white dark:bg-zinc-950",
    
    thead: "",
    tbody: "",
    trHover: readerTheme === "warm"
      ? "hover:bg-zinc-200/40"
      : readerTheme === "dark"
      ? "hover:bg-zinc-800/30"
      : "hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20"
  };
}

function getVisualizerStyles(readerTheme: "default" | "warm" | "dark") {
  const isDark = readerTheme === "dark" || (readerTheme === "default" && document.documentElement.classList.contains("dark"));
  
  return {
    isDark,
    container: readerTheme === "warm"
      ? "bg-zinc-100/90 border-zinc-200 text-zinc-800"
      : readerTheme === "dark"
      ? "bg-zinc-900 border-zinc-800 text-zinc-100"
      : "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300",
    
    headerText: readerTheme === "warm"
      ? "text-zinc-800"
      : readerTheme === "dark"
      ? "text-zinc-200"
      : "text-zinc-700 dark:text-zinc-300",
    
    bodyText: readerTheme === "warm"
      ? "text-zinc-700"
      : readerTheme === "dark"
      ? "text-zinc-400"
      : "text-zinc-600 dark:text-zinc-400",
    
    subText: readerTheme === "warm"
      ? "text-zinc-650"
      : readerTheme === "dark"
      ? "text-zinc-450"
      : "text-zinc-600 dark:text-zinc-400",
    
    cardBg: readerTheme === "warm"
      ? "bg-white border-zinc-200 text-zinc-850"
      : readerTheme === "dark"
      ? "bg-zinc-950 border-zinc-800 text-zinc-200"
      : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-100",

    svgText: readerTheme === "warm"
      ? "fill-zinc-600"
      : readerTheme === "dark"
      ? "fill-zinc-400"
      : "fill-zinc-550 dark:fill-zinc-400",

    badge: readerTheme === "warm"
      ? "bg-zinc-200 text-zinc-700"
      : readerTheme === "dark"
      ? "bg-zinc-800 text-zinc-300"
      : "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300",

    accentText: readerTheme === "warm"
      ? "text-zinc-850"
      : readerTheme === "dark"
      ? "text-zinc-200"
      : "text-zinc-800 dark:text-zinc-200",
  };
}

function TuberculosisVisuals({ readerTheme = "warm" }: { readerTheme?: "default" | "warm" | "dark" }) {
  const [activeTab, setActiveTab] = useState(0);
  const styles = getVisualizerStyles(readerTheme);
  const isDark = styles.isDark;

  return (
    <div className={`my-6 p-4 md:p-5 rounded-2xl border font-sans shadow-xs ${styles.container}`}>
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 mb-4 ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-teal-600" />
          <span className={`text-xs font-mono font-bold uppercase tracking-wider ${styles.headerText}`}>
            Interactive Clinical Chart (Tuberculosis Study 31)
          </span>
        </div>
        <div className={`flex p-0.5 rounded-lg text-[10px] font-bold uppercase font-mono self-start sm:self-auto ${isDark ? "bg-zinc-800" : "bg-zinc-200"}`}>
          <button
            onClick={() => setActiveTab(0)}
            className={`px-2.5 py-1 rounded-md transition-all ${activeTab === 0 ? "bg-teal-600 text-white shadow-xs" : isDark ? "text-zinc-400 hover:text-zinc-200" : "text-zinc-500 hover:text-zinc-800"}`}
          >
            Efficacy Cure Rates
          </button>
          <button
            onClick={() => setActiveTab(1)}
            className={`px-2.5 py-1 rounded-md transition-all ${activeTab === 1 ? "bg-teal-600 text-white shadow-xs" : isDark ? "text-zinc-400 hover:text-zinc-200" : "text-zinc-500 hover:text-zinc-800"}`}
          >
            Timeline & Pill Load
          </button>
        </div>
      </div>

      {activeTab === 0 ? (
        <div className="space-y-4">
          <div className={`text-xs leading-relaxed mb-2 ${styles.bodyText}`}>
            Non-inferiority comparison of 12-month post-therapy TB-free survival. The margin of non-inferiority was set at <strong>-6.6 percentage points</strong> (indicated by the red dashed line).
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* SVG Chart */}
            <div className={`w-full h-52 rounded-xl p-3 border flex items-center justify-center ${styles.cardBg}`}>
              <svg viewBox="0 0 300 160" className={`w-full h-full font-mono text-[9px] ${styles.svgText}`}>
                {/* Gridlines */}
                <line x1="40" y1="20" x2="280" y2="20" stroke={isDark ? "#18181b" : "#f4f4f5"} strokeWidth="1" />
                <line x1="40" y1="60" x2="280" y2="60" stroke={isDark ? "#18181b" : "#f4f4f5"} strokeWidth="1" />
                <line x1="40" y1="100" x2="280" y2="100" stroke={isDark ? "#18181b" : "#f4f4f5"} strokeWidth="1" />
                <line x1="40" y1="130" x2="280" y2="130" stroke={isDark ? "#27272a" : "#e4e4e7"} strokeWidth="1" />
                
                {/* Y Axis Labels */}
                <text x="35" y="24" textAnchor="end">100%</text>
                <text x="35" y="64" textAnchor="end">95%</text>
                <text x="35" y="104" textAnchor="end">90%</text>
                <text x="35" y="134" textAnchor="end">0%</text>

                {/* Bars */}
                {/* 6-Month Classic (HRZE) */}
                <rect x="80" y="62" width="40" height="68" fill="#a1a1aa" rx="4" />
                <text x="100" y="52" textAnchor="middle" className={`font-bold ${isDark ? "fill-zinc-300" : "fill-zinc-700"}`}>94.2%</text>
                
                {/* 4-Month HPZM */}
                <rect x="180" y="58" width="40" height="72" fill="#0d9488" rx="4" />
                <text x="200" y="48" textAnchor="middle" className="font-bold fill-teal-600">94.6%</text>
                
                {/* X Axis Labels */}
                <text x="100" y="145" textAnchor="middle" className={`font-bold ${isDark ? "fill-zinc-400" : "fill-zinc-600"}`}>6-Mo HRZE</text>
                <text x="200" y="145" textAnchor="middle" className="font-bold fill-teal-700">4-Mo HPZM</text>
                
                {/* Non inferiority indicator */}
                <line x1="40" y1="110" x2="280" y2="110" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,3" />
                <text x="275" y="106" textAnchor="end" className="fill-red-500 font-bold text-[8px] uppercase">Non-Inferiority Limit (-6.6%)</text>
              </svg>
            </div>
            {/* Explanatory text */}
            <div className="space-y-3">
              <div className="p-3.5 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                <div className="text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center space-x-1 mb-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Non-Inferiority Confirmed</span>
                </div>
                <p className={`text-[11px] leading-relaxed ${isDark ? "text-emerald-300" : "text-emerald-950"}`}>
                  The difference in bacteriological success rate was <strong>+0.4%</strong> (95% CI: -1.2% to 2.1%), which safely lies well above the pre-defined non-inferiority margin of -6.6% (p &lt; 0.001).
                </p>
              </div>
              <div className={`p-3 rounded-xl border text-[11.5px] leading-snug ${isDark ? "bg-zinc-900 border-zinc-800 text-zinc-400" : "bg-zinc-100 border-zinc-200 text-zinc-650"}`}>
                <strong>Study Cohort:</strong> 2,516 enrolled subjects, randomized globally. Successful cure was defined as stable culture-negative sputum samples at the end of treatment.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className={`text-xs leading-relaxed ${styles.bodyText}`}>
            Comparing total treatment days and dose requirements. HPZM reduces total pill burden and clinical follow-up duration by <strong>33.3%</strong>.
          </div>
          <div className={`space-y-4 p-4 rounded-xl border ${styles.cardBg}`}>
            {/* Timeline Progress Bars */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[11px] font-mono font-bold">
                <span className={isDark ? "text-zinc-400" : "text-zinc-650"}>Classic DOTS Regimen (6 Months)</span>
                <span className={isDark ? "text-zinc-300" : "text-zinc-700"}>168 Daily Doses</span>
              </div>
              <div className={`h-6 w-full rounded-lg overflow-hidden flex font-mono text-[9px] text-white font-bold ${isDark ? "bg-zinc-900" : "bg-zinc-100"}`}>
                <div className="bg-purple-600 flex items-center justify-center shrink-0" style={{ width: "33.3%" }}>
                  Intensive (8 wk)
                </div>
                <div className="bg-purple-400 flex items-center justify-center flex-1">
                  Continuation Phase (16 weeks)
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-[11px] font-mono font-bold">
                <span className="text-teal-600">New NTEP Regimen (4 Months)</span>
                <span className="text-teal-700 dark:text-teal-400">112 Daily Doses (33% Saved)</span>
              </div>
              <div className={`h-6 w-full rounded-lg overflow-hidden flex font-mono text-[9px] text-white font-bold ${isDark ? "bg-zinc-900" : "bg-zinc-100"}`}>
                <div className="bg-teal-600 flex items-center justify-center shrink-0 animate-pulse" style={{ width: "50%" }}>
                  Intensive (8 wk)
                </div>
                <div className="bg-teal-400 flex items-center justify-center" style={{ width: "50%" }}>
                  Continuation (8 wk)
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-teal-500/5 rounded-xl border border-teal-500/10 text-xs text-teal-900 dark:text-teal-300 leading-relaxed font-sans">
            <strong>Key Compliance Impact:</strong> Frontline healthcare (ASHA) workers report that a 56-day reduction in required daily doses virtually eliminates therapy abandonment in rural environments, which is the primary driver of drug-resistant superbug mutations.
          </div>
        </div>
      )}
    </div>
  );
}

function SemaglutideVisuals({ readerTheme = "warm" }: { readerTheme?: "default" | "warm" | "dark" }) {
  const [activeTab, setActiveTab] = useState(0);
  const styles = getVisualizerStyles(readerTheme);
  const isDark = styles.isDark;

  return (
    <div className={`my-6 p-4 md:p-5 rounded-2xl border font-sans shadow-xs ${styles.container}`}>
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 mb-4 ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-teal-600" />
          <span className={`text-xs font-mono font-bold uppercase tracking-wider ${styles.headerText}`}>
            Interactive Clinical Study (SELECT Trial)
          </span>
        </div>
        <div className={`flex p-0.5 rounded-lg text-[10px] font-bold uppercase font-mono self-start sm:self-auto ${isDark ? "bg-zinc-800" : "bg-zinc-200"}`}>
          <button
            onClick={() => setActiveTab(0)}
            className={`px-2.5 py-1 rounded-md transition-all ${activeTab === 0 ? "bg-teal-600 text-white shadow-xs" : isDark ? "text-zinc-400 hover:text-zinc-200" : "text-zinc-500 hover:text-zinc-800"}`}
          >
            MACE Survival Curve
          </button>
          <button
            onClick={() => setActiveTab(1)}
            className={`px-2.5 py-1 rounded-md transition-all ${activeTab === 1 ? "bg-teal-600 text-white shadow-xs" : isDark ? "text-zinc-400 hover:text-zinc-200" : "text-zinc-500 hover:text-zinc-800"}`}
          >
            Cardio Mechanism
          </button>
        </div>
      </div>

      {activeTab === 0 ? (
        <div className="space-y-4">
          <div className={`text-xs leading-relaxed mb-2 ${styles.bodyText}`}>
            Cumulative incidence of Major Adverse Cardiovascular Events (MACE: CV Death, Non-fatal MI, or Non-fatal Stroke) over 5 years (60 months). Note how curves diverge early (by month 3).
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Kaplan Meier Plot */}
            <div className={`w-full h-52 rounded-xl p-3 border flex items-center justify-center ${styles.cardBg}`}>
              <svg viewBox="0 0 300 160" className={`w-full h-full font-mono text-[9px] ${styles.svgText}`}>
                {/* Y axis Gridlines */}
                <line x1="40" y1="20" x2="280" y2="20" stroke={isDark ? "#18181b" : "#f4f4f5"} strokeWidth="1" />
                <line x1="40" y1="50" x2="280" y2="50" stroke={isDark ? "#18181b" : "#f4f4f5"} strokeWidth="1" />
                <line x1="40" y1="80" x2="280" y2="80" stroke={isDark ? "#18181b" : "#f4f4f5"} strokeWidth="1" />
                <line x1="40" y1="110" x2="280" y2="110" stroke={isDark ? "#18181b" : "#f4f4f5"} strokeWidth="1" />
                <line x1="40" y1="140" x2="280" y2="140" stroke={isDark ? "#27272a" : "#e4e4e7"} strokeWidth="1" />

                <text x="35" y="24" textAnchor="end">8.0%</text>
                <text x="35" y="54" textAnchor="end">6.0%</text>
                <text x="35" y="84" textAnchor="end">4.0%</text>
                <text x="35" y="114" textAnchor="end">2.0%</text>
                <text x="35" y="144" textAnchor="end">0%</text>

                {/* X axis Labels */}
                <text x="40" y="152" textAnchor="middle">0</text>
                <text x="100" y="152" textAnchor="middle">12m</text>
                <text x="160" y="152" textAnchor="middle">24m</text>
                <text x="220" y="152" textAnchor="middle">36m</text>
                <text x="280" y="152" textAnchor="middle">48m</text>

                {/* Placebo Curve */}
                <path d="M 40,140 Q 100,120 160,100 T 280,20" fill="none" stroke="#a1a1aa" strokeWidth="2" />
                <text x="250" y="32" className={`font-bold text-[8px] ${isDark ? "fill-zinc-400" : "fill-zinc-500"}`}>Placebo</text>

                {/* Wegovy Curve */}
                <path d="M 40,140 Q 100,125 160,110 T 280,42" fill="none" stroke="#0d9488" strokeWidth="2" />
                <text x="250" y="55" className="fill-teal-600 font-bold text-[8px]">Wegovy 2.4mg</text>

                {/* Divergence highlight */}
                <path d="M 160,110 L 160,100" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2,2" />
                <path d="M 220,76 L 220,60" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2,2" />
                <path d="M 280,42 L 280,20" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2,2" />
                
                {/* Arrow indicator */}
                <text x="110" y="75" className="fill-amber-600 font-bold text-[7px] uppercase tracking-tighter">20% MACE Risk Reduction (p&lt;0.001)</text>
              </svg>
            </div>
            {/* Explanatory notes */}
            <div className="space-y-3">
              <div className="p-3.5 bg-teal-500/5 rounded-xl border border-teal-500/10">
                <div className="text-xs font-bold text-teal-800 dark:text-teal-400 flex items-center space-x-1 mb-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  <span>Early Plaque Stability</span>
                </div>
                <p className={`text-[11px] leading-relaxed ${isDark ? "text-teal-300" : "text-teal-950"}`}>
                  The risk curves parted rapidly in month 3, suggesting that <strong>anti-inflammatory</strong> and endothelial vascular mechanisms provide immediate protection before substantial weight loss occurs.
                </p>
              </div>
              <div className={`p-3 rounded-xl border text-[11px] leading-relaxed ${isDark ? "bg-zinc-900 border-zinc-800 text-zinc-400" : "bg-zinc-100 border-zinc-200 text-zinc-650"}`}>
                <strong>SELECT Cohort Metrics:</strong> 17,604 non-diabetic overweight/obese patients with established cardiovascular disease. Wegovy 2.4mg once weekly was compared to matched placebo over a median of 40 months.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 text-xs">
          <div className={`leading-relaxed mb-3 ${styles.bodyText}`}>
            GLP-1 receptor activation delivers direct multi-system cardiovascular and metabolic protective pathways:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`p-3 rounded-xl border text-center ${styles.cardBg}`}>
              <span className="text-[10px] font-bold font-mono text-teal-600 dark:text-teal-400 block mb-1">ENDOTHELIAL HEALTH</span>
              <p className={`text-[10.5px] leading-normal ${styles.bodyText}`}>
                Upregulates nitric oxide synthase, restoring arterial flexibility and promoting vascular vasodilation.
              </p>
            </div>
            <div className={`p-3 rounded-xl border text-center ${styles.cardBg}`}>
              <span className="text-[10px] font-bold font-mono text-teal-600 dark:text-teal-400 block mb-1">PLAQUE STABILITY</span>
              <p className={`text-[10.5px] leading-normal ${styles.bodyText}`}>
                Thickens fibrous plaques, preventing plaque rupture—the primary driver of heart attacks.
              </p>
            </div>
            <div className={`p-3 rounded-xl border text-center ${styles.cardBg}`}>
              <span className="text-[10px] font-bold font-mono text-teal-600 dark:text-teal-400 block mb-1">hs-CRP REDUCTION</span>
              <p className={`text-[10.5px] leading-normal ${styles.bodyText}`}>
                Downregulates monocyte activity, achieving systemic arterial inflammation reduction.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HypertensionVisuals({ readerTheme = "warm" }: { readerTheme?: "default" | "warm" | "dark" }) {
  const [activeCategory, setActiveCategory] = useState<0 | 1 | 2>(1);
  const styles = getVisualizerStyles(readerTheme);
  const isDark = styles.isDark;

  return (
    <div className={`my-6 p-4 md:p-5 rounded-2xl border font-sans shadow-xs ${styles.container}`}>
      <div className={`flex items-center space-x-2 border-b pb-3 mb-4 ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
        <Activity className="w-4 h-4 text-teal-600" />
        <span className={`text-xs font-mono font-bold uppercase tracking-wider ${styles.headerText}`}>
          ESC 2025 Blood Pressure Classification & Risk Tool
        </span>
      </div>

      <div className={`text-xs leading-relaxed mb-4 ${styles.bodyText}`}>
        The 2025 ESC guidelines reclassify blood pressure into three distinct, actionable bands. Click on a category below to view the mandated clinical interventions:
      </div>

      {/* Classification Matrix Rows */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {[
          { id: 0, label: "Normal BP", range: "SBP <120 & DBP <80", color: isDark ? "border-emerald-500/30 text-emerald-300 bg-emerald-500/10" : "border-emerald-500 text-emerald-800 bg-emerald-500/5 hover:bg-emerald-500/10" },
          { id: 1, label: "Elevated BP", range: "SBP 120-139 or DBP 80-89", color: isDark ? "border-amber-500/30 text-amber-300 bg-amber-500/10" : "border-amber-500 text-amber-800 bg-amber-500/5 hover:bg-amber-500/10" },
          { id: 2, label: "Hypertension", range: "SBP ≥140 or DBP ≥90", color: isDark ? "border-red-500/30 text-red-300 bg-red-500/10" : "border-red-500 text-red-800 bg-red-500/5 hover:bg-red-500/10" }
        ].map(cat => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`p-3 rounded-xl border text-left transition-all ${cat.color} ${isActive ? "ring-2 ring-teal-500 scale-102 font-bold shadow-xs bg-white dark:bg-zinc-900" : "opacity-70"}`}
            >
              <div className="text-xs font-bold">{cat.label}</div>
              <div className="text-[10px] font-mono mt-0.5">{cat.range}</div>
            </button>
          );
        })}
      </div>

      {/* Response block based on category clicked */}
      <div className={`p-4 rounded-xl border text-xs ${styles.cardBg}`}>
        {activeCategory === 0 && (
          <div className="space-y-2 animate-fade-in">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600">Clinical Recommendation: Maintain</span>
            <p className={`leading-relaxed ${styles.bodyText}`}>
              True vascular health. Promote ongoing heart-healthy eating (DASH diet), physical exercise, and re-evaluate in 3 years if asymptomatic. No pharmacotherapy indicated.
            </p>
          </div>
        )}
        {activeCategory === 1 && (
          <div className="space-y-3 animate-fade-in">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600">Clinical Recommendation: Assess & Intervene</span>
            <p className={`leading-relaxed font-semibold ${styles.accentText}`}>
              Assess 10-year risk of cardiovascular event using <strong>SCORE2</strong>:
            </p>
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-dashed ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
              <div className={`p-2.5 rounded-lg border text-[11px] ${isDark ? "bg-zinc-900/60 border-zinc-800 text-zinc-300" : "bg-zinc-50 border-zinc-200 text-zinc-700"}`}>
                <strong className={`block mb-0.5 uppercase text-[9px] font-mono ${styles.accentText}`}>If Low-to-Moderate Risk (&lt;10%):</strong>
                Implement active lifestyle changes (restrict dietary sodium, exercise, weight management) for 3 months. Confirm with home monitoring.
              </div>
              <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10 text-[11px]">
                <strong className="text-amber-700 dark:text-amber-400 block mb-0.5 uppercase text-[9px] font-mono">If High Risk (T2DM, CKD, CVD, or SCORE2 ≥10%):</strong>
                Initiate drug therapy immediately using low-dose single-pill combination. **Primary Target: 120-129 mmHg SBP**.
              </div>
            </div>
          </div>
        )}
        {activeCategory === 2 && (
          <div className="space-y-2 animate-fade-in">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-600">Clinical Recommendation: Active Therapy</span>
            <p className={`leading-relaxed ${styles.bodyText}`}>
              Initiate double drug therapy (Single-Pill Combination) immediately for all patients, combined with lifestyle changes. Perform target organ damage assessments (ECG, eGFR, urine microalbuminuria). Aim to reduce systolic BP to <strong>120-129 mmHg</strong> within 3 months, if well tolerated.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StrokeAIVisuals({ readerTheme = "warm" }: { readerTheme?: "default" | "warm" | "dark" }) {
  const [activeTab, setActiveTab] = useState(0);
  const styles = getVisualizerStyles(readerTheme);
  const isDark = styles.isDark;

  return (
    <div className={`my-6 p-4 md:p-5 rounded-2xl border font-sans shadow-xs ${styles.container}`}>
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 mb-4 ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-teal-600" />
          <span className={`text-xs font-mono font-bold uppercase tracking-wider ${styles.headerText}`}>
            StrokeAI-Detect Workflow Optimizer
          </span>
        </div>
        <div className={`flex p-0.5 rounded-lg text-[10px] font-bold uppercase font-mono self-start sm:self-auto ${isDark ? "bg-zinc-800" : "bg-zinc-200"}`}>
          <button
            onClick={() => setActiveTab(0)}
            className={`px-2.5 py-1 rounded-md transition-all ${activeTab === 0 ? "bg-teal-600 text-white shadow-xs" : isDark ? "text-zinc-400 hover:text-zinc-200" : "text-zinc-500 hover:text-zinc-800"}`}
          >
            Triage Timeline
          </button>
          <button
            onClick={() => setActiveTab(1)}
            className={`px-2.5 py-1 rounded-md transition-all ${activeTab === 1 ? "bg-teal-600 text-white shadow-xs" : isDark ? "text-zinc-400 hover:text-zinc-200" : "text-zinc-500 hover:text-zinc-800"}`}
          >
            AI Accuracy Metrics
          </button>
        </div>
      </div>

      {activeTab === 0 ? (
        <div className="space-y-4">
          <div className={`text-xs leading-relaxed mb-2 ${styles.bodyText}`}>
            Comparison of acute head CT triage paths. Standard queues delay hemorrhage detection, while StrokeAI-Detect alerts specialists directly in 2.8 minutes.
          </div>
          
          <div className={`space-y-4 p-4 rounded-xl border text-xs ${styles.cardBg}`}>
            {/* Horizontal Timeline Tracks */}
            <div className="relative pl-6">
              <div className={`absolute left-[34px] top-1 bottom-1 w-0.5 ${isDark ? "bg-zinc-800" : "bg-zinc-200"}`} />
              
              {/* Event 1 */}
              <div className="flex items-start space-x-3 relative pb-5">
                <div className={`w-10 text-right font-mono text-[10px] font-bold pt-0.5 shrink-0 ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>0.0m</div>
                <div className="w-4 h-4 rounded-full bg-teal-500 border-4 border-white dark:border-zinc-950 z-10 shrink-0" />
                <div>
                  <div className={`font-bold ${styles.accentText}`}>Head CT Scan Complete</div>
                  <p className={`text-[10.5px] leading-normal ${styles.subText}`}>DICOM files generated on scanner console.</p>
                </div>
              </div>

              {/* Event 2 */}
              <div className="flex items-start space-x-3 relative pb-5">
                <div className="w-10 text-right font-mono text-[10px] font-bold text-teal-600 pt-0.5 shrink-0">2.8m</div>
                <div className="w-4 h-4 rounded-full bg-teal-600 border-4 border-white dark:border-zinc-950 z-10 shrink-0" />
                <div>
                  <div className="font-bold text-teal-600 dark:text-teal-400">StrokeAI Push Alert Triggered</div>
                  <p className={`text-[10.5px] leading-normal ${isDark ? "text-teal-300" : "text-teal-950"}`}>Triage alert sent to on-call neuroradiologist and stroke coordinator mobile devices with slice previews.</p>
                </div>
              </div>

              {/* Event 3 */}
              <div className="flex items-start space-x-3 relative pb-5">
                <div className={`w-10 text-right font-mono text-[10px] font-bold pt-0.5 shrink-0 ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>22.8m</div>
                <div className="w-4 h-4 rounded-full bg-emerald-500 border-4 border-white dark:border-zinc-950 z-10 shrink-0" />
                <div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">AI-Guided Treatment Administered</div>
                  <p className={`text-[10.5px] leading-normal ${styles.subText}`}>BP lowered, neurosurgical consult completed. (<strong>41.7 minutes saved!</strong>)</p>
                </div>
              </div>

              {/* Event 4 */}
              <div className="flex items-start space-x-3 relative">
                <div className="w-10 text-right font-mono text-[10px] font-bold text-red-500 pt-0.5 shrink-0">64.5m</div>
                <div className="w-4 h-4 rounded-full bg-red-400 border-4 border-white dark:border-zinc-950 z-10 shrink-0" />
                <div>
                  <div className="font-bold text-red-500">Traditional Queue Alert</div>
                  <p className={`text-[10.5px] leading-normal ${styles.subText}`}>Radiologist reaches scan in standard queue, places call to ER.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-teal-500/5 rounded-xl border border-teal-500/10 text-xs text-teal-900 dark:text-teal-300 leading-normal">
            <strong>Neurology Fact:</strong> Every second saved preserves 32,000 neurons. Saving 41.7 minutes of delay preserves approximately <strong>80 million neurons</strong> per stroke event!
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className={`text-xs leading-relaxed mb-2 ${styles.bodyText}`}>
            The software underwent rigorous clinical validation against consensus readings of three board-certified neuroradiologists (14,203 prospective scans).
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`p-4 rounded-xl border text-center space-y-1 ${styles.cardBg}`}>
              <span className="text-[10px] font-bold font-mono text-teal-600 block uppercase">SENSITIVITY</span>
              <div className={`text-2xl font-extrabold ${styles.accentText}`}>97.2%</div>
              <p className={`text-[10px] leading-snug ${styles.subText}`}>Accurately flags trace-amount hemorrhages in hyperacute subarachnoid settings.</p>
            </div>
            <div className={`p-4 rounded-xl border text-center space-y-1 ${styles.cardBg}`}>
              <span className="text-[10px] font-bold font-mono text-teal-600 block uppercase">SPECIFICITY</span>
              <div className={`text-2xl font-extrabold ${styles.accentText}`}>95.8%</div>
              <p className={`text-[10px] leading-snug ${styles.subText}`}>Accurately filters benign mimics, preventing alert fatigue and false neurosurgical alarms.</p>
            </div>
            <div className={`p-4 rounded-xl border text-center space-y-1 ${styles.cardBg}`}>
              <span className="text-[10px] font-bold font-mono text-teal-600 block uppercase">NEG. PRED. VALUE</span>
              <div className={`text-2xl font-extrabold ${styles.accentText}`}>99.1%</div>
              <p className={`text-[10px] leading-snug ${styles.subText}`}>Extreme clinical confidence that bleeding is excluded, allowing safe thrombolysis.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getInteractivePanelStyles(readerTheme: "default" | "warm" | "dark") {
  if (readerTheme === "warm") {
    return {
      container: "bg-[#FCFAF7] border-[#EDE6DB] text-[#2C2A29] rounded-xl border overflow-hidden shadow-[0_2px_12px_-3px_rgba(44,42,41,0.04)] mb-6",
      header: "px-5 py-3.5 border-b border-[#EDE6DB] bg-[#F5EDE2] flex flex-wrap items-center justify-between text-[#1C1A19]",
      headerTitle: "text-xs font-mono font-bold uppercase text-[#1C1A19]",
      innerCard: "p-4 rounded-lg bg-[#FAF6F0] border border-[#EDE6DB]",
      innerCardAlt: "p-4 rounded-lg bg-[#F3ECE1]/70 border border-[#EDE6DB]",
      textPrimary: "text-[#2C2A29]",
      textMuted: "text-[#6A645D]",
      textBoldAccent: "text-teal-800 font-semibold",
      badge: "text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E6DEC2]/50 text-[#85702A] border border-[#D0C69A]/50 font-bold",
      tabsBorder: "border-[#EDE6DB]",
      tabActive: "border-teal-700 text-teal-750 bg-[#FAF6F0]",
      tabInactive: "border-transparent text-[#6A645D] hover:text-[#2C2A29]",
      inputBg: "bg-[#FAF6F0] border-[#EDE6DB] text-[#2C2A29] placeholder-[#8C867E]",
      btnAccent: "bg-teal-700 hover:bg-teal-800 text-white",
      btnSecondary: "bg-teal-700/10 text-teal-800 border border-teal-700/20 hover:bg-teal-700 hover:text-white"
    };
  } else if (readerTheme === "dark") {
    return {
      container: "bg-zinc-900 border-zinc-800 text-zinc-200 rounded-xl border overflow-hidden mb-6",
      header: "px-5 py-3.5 border-b border-zinc-800 bg-zinc-950/40 flex flex-wrap items-center justify-between text-zinc-100",
      headerTitle: "text-xs font-mono font-bold uppercase text-zinc-300",
      innerCard: "p-4 rounded-lg bg-zinc-950/40 border border-zinc-800/80",
      innerCardAlt: "p-4 rounded-lg bg-zinc-950/20 border border-zinc-800/50",
      textPrimary: "text-zinc-300",
      textMuted: "text-zinc-500",
      textBoldAccent: "text-teal-400 font-semibold",
      badge: "text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold",
      tabsBorder: "border-zinc-800",
      tabActive: "border-teal-500 text-teal-400 bg-zinc-950/30",
      tabInactive: "border-transparent text-zinc-500 hover:text-zinc-200",
      inputBg: "bg-zinc-950 border-zinc-800 text-zinc-100 placeholder-zinc-650",
      btnAccent: "bg-teal-600 hover:bg-teal-500 text-white",
      btnSecondary: "bg-teal-950/40 text-teal-400 border border-teal-900 hover:bg-teal-600 hover:text-white"
    };
  } else {
    return {
      container: "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-850 text-zinc-800 dark:text-zinc-200 rounded-xl border overflow-hidden shadow-sm mb-6",
      header: "px-5 py-3.5 border-b border-zinc-150 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950/20 flex flex-wrap items-center justify-between text-zinc-700 dark:text-zinc-300",
      headerTitle: "text-xs font-mono font-bold uppercase text-zinc-700 dark:text-zinc-300",
      innerCard: "p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-850",
      innerCardAlt: "p-4 rounded-lg bg-teal-500/5 border border-teal-500/10 dark:bg-teal-950/10 dark:border-teal-900/30",
      textPrimary: "text-zinc-600 dark:text-zinc-400",
      textMuted: "text-zinc-400 dark:text-zinc-550",
      textBoldAccent: "text-teal-650 dark:text-teal-400 font-semibold",
      badge: "text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/25 dark:text-amber-400 font-bold",
      tabsBorder: "border-zinc-100 dark:border-zinc-900",
      tabActive: "border-teal-650 text-teal-650 dark:border-teal-400 dark:text-teal-400 bg-zinc-50/50 dark:bg-zinc-900/20",
      tabInactive: "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200",
      inputBg: "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500",
      btnAccent: "bg-teal-600 hover:bg-teal-700 text-white",
      btnSecondary: "bg-teal-600/10 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-250 dark:border-teal-900 hover:bg-teal-600 hover:text-white"
    };
  }
}

function getSectionStyles(index: number, readerTheme: "default" | "warm" | "dark") {
  const isEven = index % 2 === 0;
  if (readerTheme === "warm") {
    return {
      bg: isEven ? "bg-[#FCFAF7]/95" : "bg-[#F4ECE1]/45",
      border: "border-[#EDE6DB] dark:border-transparent",
      padding: "p-5 md:p-6 rounded-2xl border",
      shadow: "shadow-[0_2px_10px_-3px_rgba(44,42,41,0.04)]"
    };
  } else if (readerTheme === "dark") {
    return {
      bg: isEven ? "bg-zinc-900/60" : "bg-zinc-950/40",
      border: "border-zinc-800/80",
      padding: "p-5 md:p-6 rounded-2xl border",
      shadow: "shadow-none"
    };
  } else {
    return {
      bg: isEven 
        ? "bg-zinc-50/60 dark:bg-zinc-900/30" 
        : "bg-teal-50/10 dark:bg-zinc-950/30",
      border: "border-zinc-200/50 dark:border-zinc-850/50",
      padding: "p-5 md:p-6 rounded-2xl border",
      shadow: "shadow-xs dark:shadow-none"
    };
  }
}

export function renderDetailedAnalysis(body: string, articleId: string, readerTheme: "default" | "warm" | "dark" = "warm") {
  // Preprocess body to isolate headings that are missing double newlines
  const normalizedBody = body
    .replace(/(^|\n)(###\s+[^\n]+)(\n|$)/g, "$1\n$2\n\n")
    .replace(/\n{3,}/g, "\n\n");

  const blocks = normalizedBody.split("\n\n");
  const styles = getReaderStyles(readerTheme);
  
  // Group blocks into structural sections
  interface Section {
    heading?: string;
    id?: string;
    blocks: string[];
  }
  
  const sections: Section[] = [];
  let currentSection: Section = { blocks: [] };
  let sectionIndex = 0;
  
  blocks.forEach(block => {
    const trimmed = block.trim();
    if (!trimmed) return;
    
    if (trimmed.startsWith("#")) {
      if (currentSection.blocks.length > 0 || currentSection.heading) {
        sections.push(currentSection);
      }
      const lines = trimmed.split("\n");
      const headingText = lines[0].replace(/^#+\s*/, "").trim();
      const targetId = `section-${sectionIndex}`;
      sectionIndex++;
      const restText = lines.slice(1).join("\n").trim();
      currentSection = { heading: headingText, id: targetId, blocks: restText ? [restText] : [] };
    } else {
      currentSection.blocks.push(block);
    }
  });
  
  if (currentSection.blocks.length > 0 || currentSection.heading) {
    sections.push(currentSection);
  }
  
  return (
    <div className="space-y-6">
      {sections.map((section, sIdx) => {
        const secStyle = getSectionStyles(sIdx, readerTheme);
        return (
          <div 
            key={sIdx} 
            className={`${secStyle.bg} ${secStyle.border} ${secStyle.padding} ${secStyle.shadow} transition-all duration-300 hover:shadow-md dark:hover:shadow-none space-y-4`}
          >
            {/* Section Heading */}
            {section.heading && (
              <h3 
                id={section.id}
                className={`text-sm md:text-base font-sans font-bold tracking-tight pb-1 mb-2 scroll-mt-24 ${styles.h3}`}
              >
                {section.heading}
              </h3>
            )}
            
            {/* Section Blocks */}
            <div className="space-y-4">
              {section.blocks.map((block, bIdx) => {
                const trimmed = block.trim();
                if (!trimmed) return null;

                // Check if block contains a markdown table
                const lines = trimmed.split("\n").map(l => l.trim()).filter(Boolean);
                const tableStartIndex = lines.findIndex(l => l.startsWith("|") && l.includes("|", 1));
                
                if (tableStartIndex !== -1 && lines.length > tableStartIndex + 1 && lines[tableStartIndex + 1].includes("|-")) {
                  const textBeforeTable = lines.slice(0, tableStartIndex).join("\n");
                  // Header line
                  const headers = lines[tableStartIndex].split("|").map(s => s.trim()).filter((_, i) => i > 0 && i < lines[tableStartIndex].split("|").length - 1);
                  // Rows
                  const rows = lines.slice(tableStartIndex + 2).map(rowLine => {
                    if (!rowLine.startsWith("|")) return null;
                    return rowLine.split("|").map(s => s.trim()).filter((_, i) => i > 0 && i < rowLine.split("|").length - 1);
                  }).filter(Boolean) as string[][];

                  return (
                    <div key={bIdx} className="space-y-4">
                      {textBeforeTable && (
                        <p className={`leading-relaxed my-3.5 text-justify ${styles.p}`}>
                          {formatInlineMarkdown(textBeforeTable, readerTheme)}
                        </p>
                      )}
                      <div className={`overflow-x-auto my-4 rounded-xl border shadow-xs ${styles.tableContainer}`}>
                        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-left font-sans">
                          <thead className={styles.thead}>
                            <tr>
                              {headers.map((h, hIdx) => (
                                <th key={hIdx} className={`px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider ${styles.th}`}>
                                  {formatInlineMarkdown(h, readerTheme)}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className={`divide-y text-xs ${styles.tbody}`}>
                            {rows.map((row, rIdx) => (
                              <tr key={rIdx} className={`${styles.trHover} transition-colors`}>
                                {row.map((cell, cIdx) => (
                                  <td key={cIdx} className={`px-3 py-2 font-medium border-b ${styles.td}`}>
                                    {cIdx === 0 ? <strong className={`font-semibold ${styles.strong}`}>{formatInlineMarkdown(cell, readerTheme)}</strong> : formatInlineMarkdown(cell, readerTheme)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* DYNAMIC VISUAL DIAGRAM INJECTION */}
                      {articleId === "art-001" && <TuberculosisVisuals readerTheme={readerTheme} />}
                      {articleId === "art-002" && <SemaglutideVisuals readerTheme={readerTheme} />}
                      {articleId === "art-003" && <HypertensionVisuals readerTheme={readerTheme} />}
                      {articleId === "art-004" && <StrokeAIVisuals readerTheme={readerTheme} />}
                    </div>
                  );
                }

                // Check if block looks like ASCII art or a raw diagram (multiple spaces, box drawing chars)
                if (trimmed.includes("    ") || /^[│┌├└─]/m.test(trimmed)) {
                  return (
                    <div key={bIdx} className={`overflow-x-auto my-4 rounded-xl p-4 border shadow-xs ${styles.tableContainer}`}>
                      <pre className="font-mono text-[10px] sm:text-[11px] leading-relaxed whitespace-pre" style={{ color: "inherit", fontFamily: "monospace" }}>
                        {trimmed}
                      </pre>
                    </div>
                  );
                }

                // Check if block is a bullet list (starts with - or *)
                if (/^[-*]\s/.test(trimmed)) {
                  // Split by newlines or by space preceding a bullet to handle inline bullets
                  const items = trimmed.split(/(?:\s+|\n)(?=[-*]\s)/).map(item => item.replace(/^[-*]\s*/, "").trim());
                  return (
                    <ul key={bIdx} className={`list-disc pl-5 space-y-1.5 my-3 font-sans ${styles.ul}`}>
                      {items.map((item, itemIdx) => (
                        <li key={itemIdx} className="leading-relaxed">
                          {formatInlineMarkdown(item, readerTheme)}
                        </li>
                      ))}
                    </ul>
                  );
                }

                // Check if block is a numbered list (starts with 1. )
                if (/^\d+\.\s/.test(trimmed)) {
                  // Split by newlines or by space preceding a number to handle inline numbered lists
                  const items = trimmed.split(/(?:\s+|\n)(?=\d+\.\s)/).map(item => item.replace(/^\d+\.\s*/, "").trim());
                  return (
                    <ol key={bIdx} className={`list-decimal pl-5 space-y-1.5 my-3 font-sans ${styles.ul}`}>
                      {items.map((item, itemIdx) => (
                        <li key={itemIdx} className="leading-relaxed">
                          {formatInlineMarkdown(item, readerTheme)}
                        </li>
                      ))}
                    </ol>
                  );
                }

                // Fallback: standard paragraph
                return (
                  <p key={bIdx} className={`leading-relaxed my-3.5 text-justify ${styles.p}`}>
                    {formatInlineMarkdown(trimmed, readerTheme)}
                  </p>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatInlineMarkdown(text: string, readerTheme: "default" | "warm" | "dark" = "warm") {
  const styles = getReaderStyles(readerTheme);
  // Split on bold text markers (**text**)
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className={styles.strong}>
              {part.slice(2, -2)}
            </strong>
          );
        }
        // Handle italics (*text*)
        const subparts = part.split(/(\*.*?\*)/g);
        return (
          <React.Fragment key={i}>
            {subparts.map((sub, j) => {
              if (sub.startsWith("*") && sub.endsWith("*")) {
                return (
                  <em key={j} className={styles.em}>
                    {sub.slice(1, -1)}
                  </em>
                );
              }
              // Handle newlines
              const lines = sub.split("\n");
              return (
                <React.Fragment key={j}>
                  {lines.map((line, k) => (
                    <React.Fragment key={k}>
                      {line}
                      {k < lines.length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              );
            })}
          </React.Fragment>
        );
      })}
    </>
  );
}
