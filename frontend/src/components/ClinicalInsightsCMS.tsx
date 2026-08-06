import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Send, 
  CheckCircle2,
  FileEdit,
  Trash2,
  Loader2,
  UserCircle
} from "lucide-react";
import { authFetch } from '../lib/api';
import { supabase } from '../lib/supabase';
import { Article, Region } from "../types";
import UserProfileEditor from "./UserProfileEditor";

interface ClinicalInsightsCMSProps {
  onClose: () => void;
  session: any;
}

export default function ClinicalInsightsCMS({ onClose, session }: ClinicalInsightsCMSProps) {
  const [insights, setInsights] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"write_insight" | "profile">("write_insight");

  const [insightForm, setInsightForm] = useState({
    headline: "",
    subhead: "",
    category: "Clinical Insights",
    specialties: "General Medicine, Cardiology",
    region: Region.GLOBAL,
    imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
    imageCredit: "Clinical Insight Illustration / Unsplash",
    sourceName: session?.user?.user_metadata?.name || session?.user?.email || "Clinical Consultant",
    readingTimeMinutes: 5,
    summary30s: "",
    bodyAnalysis: "",
    why_this_matters: "",
    clinical_pearls: "",
    future_directions: "",
    evidence_summary: "",
    references: "",
    criteria: "",
    clinicalImpactScore: 8,
    status: "published" as "published" | "draft" | "ingested" | "archived"
  });
  const [insightSuccess, setInsightSuccess] = useState<string | null>(null);
  const [aiGeneratingInsight, setAiGeneratingInsight] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  const fetchData = () => {
    setLoading(true);
    authFetch("/api/admin/clinical_insights")
      .then(res => res.json())
      .then(data => {
        const userIdentifier = session?.user?.user_metadata?.name || session?.user?.email;
        const userInsights = data
          .map((e: any) => ({ ...e, isEditorial: true }))
          .filter((e: any) => e.author_name === userIdentifier || e.sourceName === userIdentifier);
        setInsights(userInsights);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInsightImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setInsightForm(prev => ({ ...prev, imageUrl: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleAiGenerateInsight = () => {
    if (!insightForm.headline.trim()) {
      alert("Please enter an Article Headline * first so AI can generate the insight content.");
      return;
    }

    setAiGeneratingInsight(true);
    setInsightSuccess(null);

    authFetch("/api/admin/clinical_insights/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        topic: insightForm.headline,
        criteria: insightForm.criteria,
        category: insightForm.category,
        region: insightForm.region,
        summary30s: insightForm.summary30s,
        bodyAnalysis: insightForm.bodyAnalysis,
        detailed_article: insightForm.bodyAnalysis,
        why_this_matters: insightForm.why_this_matters,
        clinical_pearls: insightForm.clinical_pearls,
        future_directions: insightForm.future_directions,
        evidence_summary: insightForm.evidence_summary,
        references: insightForm.references,
        clinicalImpactScore: insightForm.clinicalImpactScore,
        status: insightForm.status
      })
    })
      .then(res => res.json())
      .then(data => {
        setAiGeneratingInsight(false);
        if (data.success && data.article) {
          setInsightForm(prev => ({
            ...prev,
            headline: data.article.headline || prev.headline,
            subhead: data.article.subhead || prev.subhead,
            summary30s: data.article.summary30s || prev.summary30s,
            bodyAnalysis: data.article.bodyAnalysis || prev.bodyAnalysis,
            category: data.article.category || prev.category,
            specialties: data.article.specialties?.join(", ") || prev.specialties,
            readingTimeMinutes: data.article.readingTimeMinutes || prev.readingTimeMinutes,
            imageUrl: data.article.imageUrl || prev.imageUrl,
            imageCredit: data.article.imageCredit || prev.imageCredit
          }));
          setInsightSuccess(`✨ AI successfully generated executive summary & analysis for "${insightForm.headline}"`);
        } else {
          alert(`Error generating insight: ${data.error}`);
        }
      })
      .catch(err => {
        setAiGeneratingInsight(false);
        console.error(err);
        alert("Network error generating insight.");
      });
  };

  const handleInsightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!insightForm.headline.trim() || !insightForm.bodyAnalysis.trim()) {
      alert("Please complete the required fields (Headline and Body Analysis).");
      return;
    }
    
    const payload = {
      ...insightForm,
      specialties: insightForm.specialties.split(",").map(s => s.trim()).filter(Boolean),
      title: insightForm.headline,
      sourceName: session?.user?.user_metadata?.name || session?.user?.email || "Clinical Consultant",
    };
    
    setInsightSuccess(null);
    const isEditMode = Boolean(editingArticle);
    const endpoint = isEditMode ? `/api/admin/clinical_insights/${editingArticle?.id}` : "/api/admin/clinical_insights";
    const method = isEditMode ? "PUT" : "POST";

    authFetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(errData => { throw new Error(errData.error || "Failed to save insight"); });
        }
        return res.json();
      })
      .then(() => {
        const actionVerb = isEditMode ? "updated" : "published";
        setInsightSuccess(`Clinical Insight successfully ${actionVerb}!`);
        // Reset form
        setInsightForm({
          headline: "",
          subhead: "",
          category: "Clinical Insights",
          specialties: "General Medicine, Cardiology",
          region: Region.GLOBAL,
          imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
          imageCredit: "Clinical Insight Illustration / Unsplash",
          sourceName: session?.user?.user_metadata?.name || session?.user?.email || "Clinical Consultant",
          readingTimeMinutes: 5,
          summary30s: "",
          bodyAnalysis: "",
          why_this_matters: "",
          clinical_pearls: "",
          future_directions: "",
          evidence_summary: "",
          references: "",
          criteria: "",
          clinicalImpactScore: 8,
          status: "published"
        });
        setEditingArticle(null);
        fetchData();
      })
      .catch(err => {
        console.error(err);
        alert(err.message || "Failed to save insight");
      });
  };
  
  const handleEditInsight = (article: Article) => {
    setEditingArticle(article);
    setInsightForm({
      headline: article.headline || (article as any).title || "",
      subhead: article.subhead || "",
      category: article.category || "Clinical Insights",
      specialties: article.specialties ? article.specialties.join(", ") : "General Medicine",
      region: article.region || Region.GLOBAL,
      imageUrl: article.imageUrl || "",
      imageCredit: article.imageCredit || "",
      sourceName: article.sourceName || (article as any).author_name || session?.user?.user_metadata?.name || session?.user?.email,
      readingTimeMinutes: article.readingTimeMinutes || 5,
      summary30s: article.summary30s || "",
      bodyAnalysis: article.bodyAnalysis || (article as any).detailed_article || "",
      why_this_matters: (article as any).why_this_matters || "",
      clinical_pearls: (article as any).clinical_pearls || "",
      future_directions: (article as any).future_directions || "",
      evidence_summary: (article as any).evidence_summary || "",
      references: (article as any).references || "",
      criteria: "",
      clinicalImpactScore: article.clinicalImpactScore || 8,
      status: article.status || "published"
    });
    setInsightSuccess(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  
  const handleDeleteInsight = (id: string) => {
    if (!confirm("Are you sure you want to delete this insight?")) return;
    authFetch(`/api/admin/clinical_insights/${id}`, { method: "DELETE" })
      .then(res => res.json())
      .then(() => fetchData())
      .catch(err => console.error(err));
  };
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onClose();
  };

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 font-sans selection:bg-teal-700/20 selection:text-teal-900 w-full">
      {/* SIDEBAR */}
      <div className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col justify-between shrink-0 h-full overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-xl font-bold font-mono tracking-tighter text-zinc-900 dark:text-white uppercase">
              Healic<span className="text-teal-600">Wire</span>
            </h1>
          </div>

          <div className="mb-8 pb-8 border-b border-zinc-200 dark:border-zinc-800">
            <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <p className="text-xs font-mono font-bold text-zinc-900 dark:text-white truncate">
                {session?.user?.user_metadata?.name || "Clinical Consultant"}
              </p>
              <p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                {session?.user?.email}
              </p>
              <div className="flex gap-2 mt-2">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400">
                  CLINICAL INSIGHTS
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => setActiveTab("write_insight")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all
                ${activeTab === "write_insight"
                  ? "bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
            >
              <FileEdit className="w-4 h-4 shrink-0" />
              Write Insight
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all
                ${activeTab === "profile"
                  ? "bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
            >
              <UserCircle className="w-4 h-4 shrink-0" />
              Profile Settings
            </button>
          </div>
        </div>

        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
          <button
            onClick={onClose}
            className="w-full flex justify-center items-center py-2.5 px-4 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs font-mono font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Close Portal
          </button>
          <button
            onClick={handleSignOut}
            className="w-full flex justify-center items-center py-2.5 px-4 border border-red-300 dark:border-red-800 rounded-lg text-xs font-mono font-bold uppercase tracking-widest text-red-600 dark:text-red-400 bg-white dark:bg-zinc-900 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* HEADER */}
        <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-8 py-6 shrink-0 z-10 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white font-serif tracking-tight">
              {activeTab === "write_insight" && "Write Clinical Insight"}
              {activeTab === "profile" && "User Profile Settings"}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-mono">
              {activeTab === "write_insight" && "Draft, review, and publish your clinical insights."}
            </p>
          </div>
          {activeTab === "write_insight" && (
            <button
              onClick={handleInsightSubmit}
              disabled={aiGeneratingInsight}
              className="inline-flex items-center px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-xs font-bold font-mono uppercase tracking-widest shadow-sm hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4 mr-2" />
              {editingArticle ? "Update Insight" : "Publish Insight"}
            </button>
          )}
        </header>

        {/* CONTENT */}
        {activeTab === "write_insight" && (
          <main className="flex-1 overflow-y-auto p-8 bg-zinc-50 dark:bg-zinc-950">
            <div className="max-w-5xl mx-auto">
              {insightSuccess && (
                <div className="mb-6 p-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl flex items-center gap-3 animate-fadeIn">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <p className="text-sm font-bold text-teal-800 dark:text-teal-300">
                    {insightSuccess}
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Area */}
                <div className="lg:col-span-2">
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center gap-3">
                      <FileEdit className="w-4 h-4 text-teal-600" />
                      <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
                        {editingArticle ? "Edit Insight" : "Author New Insight"}
                      </h3>
                    </div>
                    
                    <div className="p-6 space-y-6">
                      {/* Title & AI Generation */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-end">
                          <label className="block text-xs font-bold font-mono uppercase text-zinc-700 dark:text-zinc-300">Insight Headline *</label>
                          <button
                            type="button"
                            onClick={handleAiGenerateInsight}
                            disabled={aiGeneratingInsight || !insightForm.headline.trim()}
                            className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded text-[10px] font-bold font-mono uppercase tracking-wider hover:bg-indigo-700 transition-colors disabled:opacity-50"
                          >
                            {aiGeneratingInsight ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1.5" />}
                            Generate using AI
                          </button>
                        </div>
                        <input
                          type="text"
                          value={insightForm.headline}
                          onChange={(e) => setInsightForm({ ...insightForm, headline: e.target.value })}
                          className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="e.g. Navigating DOAC Dosing Dilemmas..."
                        />
                        
                        <div>
                          <label className="block text-xs font-bold font-mono text-zinc-700 dark:text-zinc-300 mb-2">Criteria / Context for AI Generation</label>
                          <textarea
                            value={insightForm.criteria}
                            onChange={(e) => setInsightForm({ ...insightForm, criteria: e.target.value })}
                            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 h-20 font-mono"
                            placeholder="Provide specific guidelines, themes, or criteria for the AI..."
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold font-mono uppercase text-zinc-700 dark:text-zinc-300 mb-2">Subhead</label>
                        <input
                          type="text"
                          value={insightForm.subhead}
                          onChange={(e) => setInsightForm({ ...insightForm, subhead: e.target.value })}
                          className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold font-mono uppercase text-zinc-700 dark:text-zinc-300 mb-2">30-Second Summary</label>
                        <textarea
                          value={insightForm.summary30s}
                          onChange={(e) => setInsightForm({ ...insightForm, summary30s: e.target.value })}
                          className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 h-24"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold font-mono uppercase text-zinc-700 dark:text-zinc-300 mb-2">Detailed Article (Markdown supported) *</label>
                        <textarea
                          value={insightForm.bodyAnalysis}
                          onChange={(e) => setInsightForm({ ...insightForm, bodyAnalysis: e.target.value })}
                          className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 h-64 font-mono"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold font-mono uppercase text-zinc-700 dark:text-zinc-300 mb-2">Why This Matters</label>
                        <textarea
                          value={insightForm.why_this_matters}
                          onChange={(e) => setInsightForm({ ...insightForm, why_this_matters: e.target.value })}
                          className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 h-24 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold font-mono uppercase text-zinc-700 dark:text-zinc-300 mb-2">Clinical Pearls</label>
                        <textarea
                          value={insightForm.clinical_pearls}
                          onChange={(e) => setInsightForm({ ...insightForm, clinical_pearls: e.target.value })}
                          className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 h-24 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold font-mono uppercase text-zinc-700 dark:text-zinc-300 mb-2">Future Directions</label>
                        <textarea
                          value={insightForm.future_directions}
                          onChange={(e) => setInsightForm({ ...insightForm, future_directions: e.target.value })}
                          className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 h-24 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold font-mono uppercase text-zinc-700 dark:text-zinc-300 mb-2">Evidence Summary</label>
                        <textarea
                          value={insightForm.evidence_summary}
                          onChange={(e) => setInsightForm({ ...insightForm, evidence_summary: e.target.value })}
                          className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 h-24 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold font-mono uppercase text-zinc-700 dark:text-zinc-300 mb-2">References</label>
                        <textarea
                          value={insightForm.references}
                          onChange={(e) => setInsightForm({ ...insightForm, references: e.target.value })}
                          className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 h-24 font-mono"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold font-mono uppercase text-zinc-700 dark:text-zinc-300 mb-2">Status</label>
                          <select
                            value={insightForm.status}
                            onChange={(e) => setInsightForm({ ...insightForm, status: e.target.value as any })}
                            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold font-mono uppercase text-zinc-700 dark:text-zinc-300 mb-2">Image URL</label>
                          <input
                            type="text"
                            value={insightForm.imageUrl}
                            onChange={(e) => setInsightForm({ ...insightForm, imageUrl: e.target.value })}
                            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                          <div className="mt-2 text-xs text-zinc-500">Or upload an image:</div>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleInsightImageUpload} 
                            className="mt-1 w-full text-xs" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Published Insights Sidebar */}
                <div className="lg:col-span-1">
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden sticky top-6">
                    <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
                        Your Published Insights
                      </h3>
                    </div>
                    <div className="divide-y divide-zinc-200 dark:divide-zinc-800 max-h-[600px] overflow-y-auto">
                      {loading ? (
                        <div className="p-6 text-center text-sm text-zinc-500 flex items-center justify-center">
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </div>
                      ) : insights.length === 0 ? (
                        <div className="p-6 text-center text-sm text-zinc-500">
                          You haven't published any insights yet.
                        </div>
                      ) : (
                        insights.map((ed: any) => (
                          <div key={ed.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white line-clamp-2 mb-2">
                              {ed.headline || ed.title}
                            </h4>
                            <div className="flex items-center justify-between">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${ed.status === 'published' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                {ed.status}
                              </span>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleEditInsight(ed)}
                                  className="p-1 text-zinc-400 hover:text-teal-600 transition-colors"
                                  title="Edit"
                                >
                                  <FileEdit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteInsight(ed.id)}
                                  className="p-1 text-zinc-400 hover:text-red-600 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        )}
        
        {activeTab === "profile" && (
          <UserProfileEditor session={session} />
        )}
      </div>
    </div>
  );
}
