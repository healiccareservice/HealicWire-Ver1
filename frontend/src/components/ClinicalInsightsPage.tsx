/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { UserCheck, BookOpen, Search, Sparkles, ChevronDown, ChevronUp, Bookmark, BookmarkCheck, Share2, Award, Clock, ArrowRight, CheckCircle, Lightbulb } from "lucide-react";
import { Article } from "../types";
import { supabase, mapArticleFromDB } from "../lib/supabase";
import { renderDetailedAnalysis } from "./ArticleDetail";

interface ClinicalInsightsPageProps {
  onSelectArticle: (article: Article) => void;
}

export default function ClinicalInsightsPage({ onSelectArticle }: ClinicalInsightsPageProps) {
  const [insights, setInsights] = useState<Article[]>([]);
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
    const fetchInsights = async () => {
      try {
        const { data, error } = await supabase
          .from('clinical_insights')
          .select('*')
          .order('created_at', { ascending: false });
        
        let finalData = data;
        if (!data || data.length === 0) {
           const { data: artData } = await supabase
             .from('articles')
             .select('*')
             .eq('category', 'Clinical Insights')
             .eq('status', 'published')
             .order('created_at', { ascending: false });
           finalData = artData;
        }

        if (finalData) {
          const authorsMap: any = {
            "Advances in Continuous Glucose Monitoring (CGM) for Type 2 Diabetes Management": { name: 'Dr. Priya Nair', qual: 'MBBS, MD (General Medicine), DM (Endocrinology)', title: 'Consultant Endocrinologist & Diabetologist', image: 'https://randomuser.me/api/portraits/women/44.jpg' },
            "Redefining HFpEF Management: From Diagnostic Dilemmas to Targeted Phenotype-Driven Pharmacotherapy": { name: 'Dr. Arjun Sharma', qual: 'MBBS, MD (General Medicine), DM (Cardiology)', title: 'Consultant Cardiologist', image: 'https://randomuser.me/api/portraits/men/32.jpg' },
            "Optimizing Disease-Modifying Therapy in Early-Stage Alzheimer's Disease: Biomarker Protocols, Amyloid-Related Imaging Abnormalities (ARIA), and Practical Management Algorithms": { name: 'Dr. Rahul Mehta', qual: 'MBBS, MD (General Medicine), DM (Neurology)', title: 'Consultant Neurologist', image: 'https://randomuser.me/api/portraits/men/45.jpg' },
            "SGLT2 Inhibitors and Non-Diabetic Chronic Kidney Disease: Redefining Renal Protection and Clinical Pathways": { name: 'Dr. Sneha Iyer', qual: 'MBBS, MD (General Medicine), DM (Nephrology)', title: 'Consultant Nephrologist', image: 'https://randomuser.me/api/portraits/women/68.jpg' },
            "Paradigm Shift in MASH Management: Integrating Targeted Pharmacotherapy and Incretin Agonists into Gastroenterology Practice": { name: 'Dr. Vikram Reddy', qual: 'MBBS, MD (General Medicine), DM (Gastroenterology)', title: 'Consultant Gastroenterologist', image: 'https://randomuser.me/api/portraits/men/22.jpg' },
            "Redefining the HER2 Paradigm: Clinical Insights into Antibody-Drug Conjugates for HER2-Low Metastatic Breast Cancer": { name: 'Dr. Ananya Banerjee', qual: 'MBBS, MD (General Medicine), DM (Medical Oncology)', title: 'Consultant Medical Oncologist', image: 'https://randomuser.me/api/portraits/women/33.jpg' },
            "Navigating Relapsed/Refractory Multiple Myeloma: The Paradigm Shift Towards Bispecific T-Cell Engagers and CAR-T Therapies": { name: 'Dr. Karthik Rao', qual: 'MBBS, MD (General Medicine), DM (Clinical Hematology)', title: 'Consultant Hematologist', image: 'https://randomuser.me/api/portraits/men/55.jpg' },
            "Resetting the Autoreactive Immune Memory: CD19-Targeted CAR-T Cell Therapy and B-Cell Depletion Paradigms in Refractory Systemic Lupus Erythematosus": { name: 'Dr. Meera Joshi', qual: 'MBBS, MD (General Medicine), DM (Clinical Immunology & Rheumatology)', title: 'Consultant Rheumatologist', image: 'https://randomuser.me/api/portraits/women/29.jpg' },
            "Navigating Phenotypic Heterogeneity in Severe Refractory Asthma: Precision Biologic Selection and Biomarker Integration": { name: 'Dr. Sandeep Kulkarni', qual: 'MBBS, MD (General Medicine), DM (Pulmonary, Critical Care & Sleep Medicine)', title: 'Consultant Pulmonologist', image: 'https://randomuser.me/api/portraits/men/66.jpg' },
            "First-Line Whole Genome Sequencing in Undiagnosed Genetic Disorders: Shifting the Paradigm from Diagnostic Odysseys to Precision Medicine": { name: 'Dr. Ritu Verma', qual: 'MBBS, MD (General Medicine), DM (Medical Genetics)', title: 'Consultant Medical Geneticist', image: 'https://randomuser.me/api/portraits/women/12.jpg' },
            "Paradigm Shift in Endourology: Thulium Fiber Laser versus Holmium:YAG Laser in Urolithiasis and BPH Management": { name: 'Dr. Nikhil Desai', qual: 'MBBS, MS (General Surgery), MCh (Urology)', title: 'Consultant Urologist', image: 'https://randomuser.me/api/portraits/men/17.jpg' },
            "Awake Craniotomy and Intraoperative Functional Mapping: Balancing Oncological Resection with Functional Preservation in Eloquent Cortex Gliomas": { name: 'Dr. Pooja Kapoor', qual: 'MBBS, MS (General Surgery), MCh (Neurosurgery)', title: 'Consultant Neurosurgeon', image: 'https://randomuser.me/api/portraits/women/55.jpg' },
            "Evolving Paradigms in Mitral Valve Repair: Minimally Invasive Thoracoscopic vs. Conventional Median Sternotomy Approaches": { name: 'Dr. Ajay Menon', qual: 'MBBS, MS (General Surgery), MCh (Cardiothoracic & Vascular Surgery)', title: 'Consultant Cardiothoracic Surgeon', image: 'https://randomuser.me/api/portraits/men/19.jpg' },
            "Navigating Organ Preservation in Locally Advanced Rectal Cancer: A Surgical Oncologist’s Perspective on Total Neoadjuvant Therapy and the Watch-and-Wait Protocol": { name: 'Dr. Kavita Patil', qual: 'MBBS, MS (General Surgery), MCh (Surgical Oncology)', title: 'Consultant Surgical Oncologist', image: 'https://randomuser.me/api/portraits/women/22.jpg' },
            "Targeted Muscle Reinnervation (TMR) and Regenerative Peripheral Nerve Interfaces (RPNI): Paradigm Shifts in Neuroma Prevention and Amputee Rehabilitation": { name: 'Dr. Rohit Chandra', qual: 'MBBS, MS (General Surgery), MCh (Plastic & Reconstructive Surgery)', title: 'Consultant Plastic & Reconstructive Surgeon', image: 'https://randomuser.me/api/portraits/men/12.jpg' },
            "Navigating the Paradigm Shift in Pediatric Developmental and Epileptic Encephalopathies: From Anti-Seizure Medications to Precision Disease-Modifying Therapies": { name: 'Dr. Neha Gupta', qual: 'MBBS, MD (Pediatrics), DM (Pediatric Neurology)', title: 'Consultant Pediatric Neurologist', image: 'https://randomuser.me/api/portraits/women/61.jpg' },
            "Navigating Carbapenem-Resistant Enterobacterales (CRE) Infections: Newer Beta-Lactam/Beta-Lactamase Inhibitor Combinations and Stewardship Strategies": { name: 'Dr. Harish Bhat', qual: 'MBBS, MD (General Medicine), DM (Infectious Diseases)', title: 'Consultant Infectious Disease Specialist', image: 'https://randomuser.me/api/portraits/men/77.jpg' },
            "Navigating DOAC Dosing Dilemmas in Extreme Obesity and End-Stage Kidney Disease: A Pharmacokinetic and Pharmacodynamic Paradigm Shift": { name: 'Dr. Shalini Krishnan', qual: 'MBBS, MD (General Medicine), DM (Clinical Pharmacology)', title: 'Consultant Clinical Pharmacologist', image: 'https://randomuser.me/api/portraits/women/88.jpg' },
            "Navigating Heterogeneity in Septic Shock: Phenotype-Driven Resuscitation and Hemodynamic Tailoring in the Modern ICU": { name: 'Dr. Vivek Agarwal', qual: 'MBBS, MD (General Medicine), DM (Critical Care Medicine)', title: 'Consultant Intensivist & Critical Care Specialist', image: 'https://randomuser.me/api/portraits/men/91.jpg' },
            "Genicular Artery Embolization (GAE) in Knee Osteoarthritis: Clinical Efficacy, Technical Nuances, and Practice Takeaways": { name: 'Dr. Aditi Singh', qual: 'MBBS, MD (Radiodiagnosis), Fellowship in Interventional Radiology', title: 'Consultant Interventional Radiologist', image: 'https://randomuser.me/api/portraits/women/90.jpg' }
          };

          const mapped = finalData.map((d: any) => {
            const headline = d.article_title || d.headline;
            const mappedAuthor = authorsMap[headline];

            const formatList = (field: any, isNumbered: boolean) => {
              if (!field) return "";
              let arr: string[] = [];
              if (Array.isArray(field)) {
                arr = field;
              } else if (typeof field === 'string' && field.trim().startsWith('[')) {
                try {
                  arr = JSON.parse(field);
                } catch (e) {
                  arr = field.split('\n').filter((l: string) => l.trim().length > 0);
                }
              } else {
                arr = (typeof field === 'string' ? field : String(field)).split('\n').filter((l: string) => l.trim().length > 0);
              }
              
              return arr.map((item, idx) => {
                let clean = item.trim();
                if (!clean) return "";
                if (clean.startsWith('-') || /^\d+\./.test(clean)) {
                  clean = clean.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '');
                }
                return isNumbered ? `${idx + 1}. ${clean}` : `- ${clean}`;
              }).filter(Boolean).join('\n');
            };

            const highlightKeywords = (text: string) => {
              if (!text) return "";
              const keywords = ["significantly", "paradigm shift", "revolutionary", "mortality", "morbidity", "guidelines", "outcomes", "efficacy", "clinical trials", "primary outcomes", "adverse events", "prognosis", "precision medicine", "first-line", "real-world data", "actionable biofeedback", "glycemic control"];
              let res = text;
              keywords.forEach(kw => {
                const regex = new RegExp(`(?<!\\*\\*)\\b(${kw})\\b(?!\\*\\*)`, 'gi');
                res = res.replace(regex, '**$1**');
              });
              return res;
            };

            const pearls = formatList(d.clinical_pearls, false);
            const refs = formatList(d.references, true);
            const detailed = highlightKeywords(d.detailed_article);
            const whyMatters = highlightKeywords(d.why_this_matters);
            const future = highlightKeywords(d.future_directions);
            const evidence = highlightKeywords(d.evidence_summary);

            return {
              id: d.id,
              slug: d.id,
              headline: headline,
              summary30s: d.recent_clinical_update || d.summary30s,
              bodyAnalysis: d.detailed_article ? `${detailed}\n\n### Why This Matters\n${whyMatters}\n\n### Clinical Pearls\n${pearls}\n\n### Future Directions\n${future}\n\n### Evidence Summary\n${evidence}\n\n### References\n${refs}` : d.bodyAnalysis,
              category: 'Clinical Insights',
              publishedAt: d.created_at || d.published_at || new Date().toISOString(),
              status: 'published',
              sourceName: 'HealicWire Experts Board',
              isEditorial: true,
              author_name: mappedAuthor ? mappedAuthor.name : d.author_name,
              author_qualifications: mappedAuthor ? mappedAuthor.qual : d.author_qualifications,
              author_title: mappedAuthor ? mappedAuthor.title : d.author_title,
              author_image: mappedAuthor ? mappedAuthor.image : "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80"
            } as Article & { author_image?: string };
          });
          setInsights(mapped);
        }
      } catch (err) {
        console.error("Error loading clinical insights:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
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
      showToast("Saved insight to bookmarks!");
    }
    setSavedIds(updated);
    localStorage.setItem("healic_saved_articles", JSON.stringify(updated));
  };

  const filteredInsights = insights.filter(ed =>
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
          <Lightbulb className="w-5 h-5" />
          <span className="text-xs font-mono tracking-widest uppercase font-bold">Expert Perspective</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white font-serif">
          Clinical Insights
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
          Curated articles by experts associated with HealicWire
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8">
        <input
          type="text"
          placeholder="Filter insights by topic, guideline, or clinical keyword..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
        />
        <Search className="w-4.5 h-4.5 absolute left-3.5 top-3.5 text-zinc-400" />
      </div>

      {/* INSIGHTS STACKED LIST - ONE BELOW ANOTHER */}
      {loading ? (
        <div className="space-y-6 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-zinc-100 dark:bg-zinc-900 rounded-2xl" />
          ))}
        </div>
      ) : filteredInsights.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <Lightbulb className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm text-zinc-600 dark:text-zinc-400 font-bold">No clinical insights match your search term.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredInsights.map(ed => {
            const isExpanded = expandedIds.includes(ed.id);
            const isSaved = savedIds.includes(ed.id);

            return (
              <div key={ed.id} className="space-y-3">
                {/* Author Profile Banner - Placed above every article */}
                <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-900/10 via-emerald-900/10 to-cyan-900/10 dark:from-teal-950/50 dark:via-emerald-950/50 dark:to-cyan-950/50 border border-teal-200/80 dark:border-teal-800/80 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-5">
                  <img
                    src={(ed as any).author_image || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80"}
                    alt={ed.author_name || "Author"}
                    className="w-20 h-20 rounded-full object-cover border-3 border-teal-600 shadow-md shrink-0"
                  />
                  <div className="space-y-1.5 text-center sm:text-left flex-1">
                    <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                      {ed.author_name || "Dr. Priya Nair"}
                    </h2>
                    <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 font-semibold tracking-wide">
                      {ed.author_qualifications || "MBBS, MD (General Medicine), DM (Endocrinology)"}
                    </p>
                    <p className="text-sm font-sans text-teal-700 dark:text-teal-400 font-bold">
                      {ed.author_title || "Consultant Endocrinologist & Diabetologist"}
                    </p>
                  </div>
                </div>

                <article
                  className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-850 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                >
                {/* Header Row */}
                <div className="p-6 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 uppercase">
                        {ed.category || "Clinical Insights"}
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
                    className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white font-serif leading-snug transition-colors"
                  >
                    {ed.headline}
                  </h2>

                  {/* Byline */}
                  <div className="flex items-center space-x-2 text-xs font-mono text-zinc-500 dark:text-zinc-400 pt-1">
                    <span className="font-bold text-teal-700 dark:text-teal-400">
                      {ed.sourceName || "HealicWire Experts Board"}
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
                      <h4 className="text-xs font-mono font-bold uppercase text-teal-700 dark:text-teal-400 mb-4">
                        Detailed Clinical Analysis & Practice Takeaways
                      </h4>
                      <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-sans -mt-4">
                        {renderDetailedAnalysis(ed.bodyAnalysis || ed.summary30s, ed.id, "default")}
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
                      title="Bookmark Insight"
                    >
                      {isSaved ? <BookmarkCheck className="w-4 h-4 text-amber-500" /> : <Bookmark className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </article>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
