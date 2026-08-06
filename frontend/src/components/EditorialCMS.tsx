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
import ImageSelectorModal from "./ImageSelectorModal";

interface EditorialCMSProps {
  onClose: () => void;
  session: any;
  embedMode?: boolean;
}

export default function EditorialCMS({ onClose, session, embedMode }: EditorialCMSProps) {
  const [editorials, setEditorials] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"write_editorial" | "profile">("write_editorial");
  const [userProfile, setUserProfile] = useState<any>(null);

  const [editorialForm, setEditorialForm] = useState({
    headline: "",
    subhead: "",
    category: "Clinical",
    specialties: "General Medicine, Cardiology",
    region: Region.GLOBAL,
    imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
    imageCredit: "Editorial Photo / Unsplash",
    sourceName: session?.user?.user_metadata?.name || session?.user?.email || "HealicWire Editorial Board",
    readingTimeMinutes: 3,
    summary30s: "",
    bodyAnalysis: "",
    criteria: "",
    clinicalImpactScore: 8,
    status: "published" as "published" | "draft" | "ingested" | "archived"
  });
  const [editorialSuccess, setEditorialSuccess] = useState<string | null>(null);
  const [aiGeneratingEditorial, setAiGeneratingEditorial] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const handleLogout = async () => {
    await supabase.auth.signOut();
    onClose();
  };

  const fetchData = () => {
    setLoading(true);
    authFetch("/api/admin/editorials")
      .then(res => res.json())
      .then(data => {
        // Filter by user's sourceName (either their name or email)
        const userIdentifier = session?.user?.user_metadata?.name || session?.user?.email;
        const userEmail = session?.user?.email;
        const userEditorials = data.map((e: any) => ({ ...e, isEditorial: true }));
        setEditorials(userEditorials);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
      
    authFetch("/api/admin/profile")
      .then(res => res.json())
      .then(data => {
        if (data?.profile) setUserProfile(data.profile);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditorialImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setEditorialForm(prev => ({ ...prev, imageUrl: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleAiGenerateEditorial = () => {
    if (!editorialForm.headline.trim()) {
      alert("Please enter an Article Headline * first so AI can generate the editorial content.");
      return;
    }

    setAiGeneratingEditorial(true);
    setEditorialSuccess(null);

    authFetch("/api/admin/editorials/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        topic: editorialForm.headline,
        criteria: editorialForm.criteria,
        category: editorialForm.category,
        region: editorialForm.region,
        authorEmail: session?.user?.email,
        authorName: userProfile?.name || session?.user?.user_metadata?.name || session?.user?.email || "HealicWire Editorial Board"
      })
    })
      .then(res => res.json())
      .then(data => {
        setAiGeneratingEditorial(false);
        if (data.error) {
          alert(`Error generating editorial: ${data.error}`);
        } else if (data && data.id) {
          // Setting editingArticle puts the form into edit mode for this auto-saved row
          setEditingArticle(data);
          setEditorialForm(prev => ({
            ...prev,
            headline: data.headline || prev.headline,
            subhead: data.subhead || prev.subhead,
            summary30s: data.summary_30s || prev.summary30s,
            bodyAnalysis: data.body_analysis || prev.bodyAnalysis,
            category: data.category || prev.category,
            specialties: Array.isArray(data.specialties) ? data.specialties.join(", ") : (data.specialties || prev.specialties),
            readingTimeMinutes: data.reading_time_minutes || prev.readingTimeMinutes,
            imageUrl: data.image_url || prev.imageUrl,
            imageCredit: data.image_credit || prev.imageCredit,
            region: data.region || prev.region
          }));
          setEditorialSuccess(`✨ AI successfully generated and saved executive summary & analysis for "${editorialForm.headline}"`);
          fetchData(); // Refresh the list on the right
        }
      })
      .catch(err => {
        setAiGeneratingEditorial(false);
        console.error(err);
        alert("Network error generating editorial.");
      });
  };

  const handleEditorialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorialForm.headline.trim() || !editorialForm.bodyAnalysis.trim()) {
      alert("Please complete the required fields (Headline and Body Analysis).");
      return;
    }
    
    // Convert specialties string to array, and add fallback for title
    const payload = {
      ...editorialForm,
      specialties: editorialForm.specialties.split(",").map(s => s.trim()).filter(Boolean),
      title: editorialForm.headline,
      sourceName: session?.user?.user_metadata?.name || session?.user?.email || "HealicWire Editorial Board",
      authorEmail: session?.user?.email,
    };
    
    setEditorialSuccess(null);
    const isEditMode = Boolean(editingArticle);
    const endpoint = isEditMode ? `/api/admin/editorials/${editingArticle?.id}` : "/api/admin/editorials";
    const method = isEditMode ? "PUT" : "POST";

    authFetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(errData => { throw new Error(errData.error || "Failed to save editorial"); });
        }
        return res.json();
      })
      .then(() => {
        const actionVerb = isEditMode ? "updated" : "published";
        setEditorialSuccess(`Editorial successfully ${actionVerb}!`);
        // Reset form
        setEditorialForm({
          headline: "",
          subhead: "",
          category: "Clinical",
          specialties: "General Medicine, Cardiology",
          region: Region.GLOBAL,
          imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
          imageCredit: "Editorial Photo / Unsplash",
          sourceName: session?.user?.user_metadata?.name || session?.user?.email || "HealicWire Editorial Board",
          readingTimeMinutes: 3,
          summary30s: "",
          bodyAnalysis: "",
          criteria: "",
          clinicalImpactScore: 8,
          status: "published"
        });
        setEditingArticle(null);
        fetchData();
      })
      .catch(err => {
        console.error(err);
        alert(err.message || "Failed to save editorial");
      });
  };
  
  const handleEditEditorial = (article: Article) => {
    setEditingArticle(article);
    setEditorialForm({
      headline: article.headline || (article as any).title || "",
      subhead: article.subhead || "",
      category: article.category || "Clinical",
      specialties: article.specialties ? article.specialties.join(", ") : "General Medicine",
      region: article.region || Region.GLOBAL,
      imageUrl: article.imageUrl || "",
      imageCredit: article.imageCredit || "",
      sourceName: article.sourceName || session?.user?.user_metadata?.name || session?.user?.email,
      readingTimeMinutes: article.readingTimeMinutes || 3,
      summary30s: article.summary30s || "",
      bodyAnalysis: article.bodyAnalysis || "",
      criteria: "",
      clinicalImpactScore: article.clinicalImpactScore || 8,
      status: article.status || "published"
    });
    setEditorialSuccess(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  
  const handleDeleteEditorial = (id: string) => {
    if (!confirm("Are you sure you want to delete this editorial?")) return;
    authFetch(`/api/admin/editorials/${id}`, { method: "DELETE" })
      .then(res => res.json())
      .then(() => fetchData())
      .catch(err => console.error(err));
  };
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onClose();
  };

  if (embedMode) {
    return (
      <div className="w-full">
        <main className="w-full h-full p-2">
          <div className="max-w-6xl mx-auto">
            {editorialSuccess && (
              <div className="mb-6 p-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl flex items-center gap-3 animate-fadeIn">
                <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <p className="text-sm font-bold text-teal-800 dark:text-teal-300">
                  {editorialSuccess}
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
                      {editingArticle ? "Edit Editorial" : "Author New Editorial"}
                    </h3>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    {/* Title & AI Generation */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <label className="block text-xs font-bold font-mono uppercase text-zinc-700 dark:text-zinc-300">Article Headline *</label>
                        <button
                          type="button"
                          onClick={handleAiGenerateEditorial}
                          disabled={aiGeneratingEditorial || !editorialForm.headline.trim()}
                          className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded text-[10px] font-bold font-mono uppercase tracking-wider hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                          {aiGeneratingEditorial ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1.5" />}
                          Generate using AI
                        </button>
                      </div>
                      <input
                        type="text"
                        value={editorialForm.headline}
                        onChange={(e) => setEditorialForm({ ...editorialForm, headline: e.target.value })}
                        className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="e.g. CDSCO Issues Safety Warning for Novel Antidiabetic Class..."
                      />
                      
                      <div>
                        <label className="block text-xs font-bold font-mono text-zinc-700 dark:text-zinc-300 mb-2">Criteria / Context for AI Generation</label>
                        <textarea
                          value={editorialForm.criteria}
                          onChange={(e) => setEditorialForm({ ...editorialForm, criteria: e.target.value })}
                          className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 h-20 font-mono"
                          placeholder="Provide specific guidelines, themes, or criteria for the AI..."
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold font-mono uppercase text-zinc-700 dark:text-zinc-300 mb-2">Subhead</label>
                      <input
                        type="text"
                        value={editorialForm.subhead}
                        onChange={(e) => setEditorialForm({ ...editorialForm, subhead: e.target.value })}
                        className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold font-mono uppercase text-zinc-700 dark:text-zinc-300 mb-2">30-Second Summary</label>
                      <textarea
                        value={editorialForm.summary30s}
                        onChange={(e) => setEditorialForm({ ...editorialForm, summary30s: e.target.value })}
                        className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 h-24"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold font-mono uppercase text-zinc-700 dark:text-zinc-300 mb-2">Body Text (Markdown supported) *</label>
                      <textarea
                        value={editorialForm.bodyAnalysis}
                        onChange={(e) => setEditorialForm({ ...editorialForm, bodyAnalysis: e.target.value })}
                        className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 h-64 font-mono"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold font-mono uppercase text-zinc-700 dark:text-zinc-300 mb-2">Status</label>
                        <select
                          value={editorialForm.status}
                          onChange={(e) => setEditorialForm({ ...editorialForm, status: e.target.value as any })}
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
                          value={editorialForm.imageUrl}
                          onChange={(e) => setEditorialForm({ ...editorialForm, imageUrl: e.target.value })}
                          className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 mb-2"
                        />
                        <button
                          type="button"
                          onClick={() => setShowImageSelector(true)}
                          className="w-full py-2 bg-teal-50 dark:bg-teal-900/30 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-teal-700 dark:text-teal-400 font-bold text-xs rounded-lg transition-colors border border-teal-200 dark:border-teal-800 flex items-center justify-center gap-2"
                        >
                          Select Image (Web / Assets / Upload)
                        </button>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
                      <button
                        type="button"
                        onClick={handleEditorialSubmit}
                        disabled={aiGeneratingEditorial}
                        className="inline-flex items-center px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-bold font-mono uppercase tracking-widest shadow-md hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all disabled:opacity-50"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {editingArticle ? "Update Editorial" : "Publish Editorial"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Published Editorials Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden sticky top-6">
                  <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
                      Your Published Editorials
                    </h3>
                  </div>
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800 max-h-[600px] overflow-y-auto">
                    {loading ? (
                      <div className="p-6 text-center text-sm text-zinc-500 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </div>
                    ) : editorials.length === 0 ? (
                      <div className="p-6 text-center text-sm text-zinc-500">
                        You haven't published any editorials yet.
                      </div>
                    ) : (
                      editorials.map((ed: any) => (
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
                                onClick={() => handleEditEditorial(ed)}
                                className="p-1 text-zinc-400 hover:text-teal-600 transition-colors"
                                title="Edit"
                              >
                                <FileEdit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteEditorial(ed.id)}
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
      </div>
    );
  }

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
            <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center gap-3">
              {userProfile?.avatar_url && (
                <img onError={(e) => { e.currentTarget.style.display = 'none'; }} src={userProfile.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full object-cover shrink-0 border border-zinc-200 dark:border-zinc-700" />
              )}
              <div className="min-w-0">
                <p className="text-xs font-mono font-bold text-zinc-900 dark:text-white truncate">
                  {userProfile?.name || session?.user?.user_metadata?.name || "Editorial User"}
                </p>
                <p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                  {session?.user?.email}
                </p>
                <div className="flex gap-2 mt-2">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                    EDITORIAL
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => setActiveTab("write_editorial")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider transition-all
                ${activeTab === "write_editorial"
                  ? "bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
            >
              <FileEdit className="w-4 h-4 shrink-0" />
              Write Editorial
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
            onClick={handleLogout}
            className="w-full flex justify-center items-center py-2.5 px-4 mt-3 border border-red-200 dark:border-red-900/30 rounded-lg text-xs font-mono font-bold uppercase tracking-widest text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
          >
            Log Out
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
              {activeTab === "write_editorial" && "Write Editorial Article"}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-mono">
              {activeTab === "write_editorial" && "Draft, review, and publish your editorial columns."}
            </p>
          </div>
          {activeTab === "write_editorial" && (
            <button
              onClick={handleEditorialSubmit}
              disabled={aiGeneratingEditorial}
              className="inline-flex items-center px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-xs font-bold font-mono uppercase tracking-widest shadow-sm hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4 mr-2" />
              {editingArticle ? "Update Editorial" : "Publish Editorial"}
            </button>
          )}
        </header>

        {/* CONTENT */}
        {activeTab === "write_editorial" && (
          <main className="flex-1 overflow-y-auto p-8 bg-zinc-50 dark:bg-zinc-950">
            <div className="max-w-5xl mx-auto">
              {editorialSuccess && (
                <div className="mb-6 p-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl flex items-center gap-3 animate-fadeIn">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <p className="text-sm font-bold text-teal-800 dark:text-teal-300">
                    {editorialSuccess}
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
                        {editingArticle ? "Edit Editorial" : "Author New Editorial"}
                      </h3>
                    </div>
                    
                    <div className="p-6 space-y-6">
                      {/* Title & AI Generation */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-end">
                          <label className="block text-xs font-bold font-mono uppercase text-zinc-700 dark:text-zinc-300">Article Headline *</label>
                          <button
                            type="button"
                            onClick={handleAiGenerateEditorial}
                            disabled={aiGeneratingEditorial || !editorialForm.headline.trim()}
                            className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded text-[10px] font-bold font-mono uppercase tracking-wider hover:bg-indigo-700 transition-colors disabled:opacity-50"
                          >
                            {aiGeneratingEditorial ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1.5" />}
                            Generate using AI
                          </button>
                        </div>
                        <input
                          type="text"
                          value={editorialForm.headline}
                          onChange={(e) => setEditorialForm({ ...editorialForm, headline: e.target.value })}
                          className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="e.g. CDSCO Issues Safety Warning for Novel Antidiabetic Class..."
                        />
                        
                        <div>
                          <label className="block text-xs font-bold font-mono text-zinc-700 dark:text-zinc-300 mb-2">Criteria / Context for AI Generation</label>
                          <textarea
                            value={editorialForm.criteria}
                            onChange={(e) => setEditorialForm({ ...editorialForm, criteria: e.target.value })}
                            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 h-20 font-mono"
                            placeholder="Provide specific guidelines, themes, or criteria for the AI..."
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold font-mono uppercase text-zinc-700 dark:text-zinc-300 mb-2">Subhead</label>
                        <input
                          type="text"
                          value={editorialForm.subhead}
                          onChange={(e) => setEditorialForm({ ...editorialForm, subhead: e.target.value })}
                          className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold font-mono uppercase text-zinc-700 dark:text-zinc-300 mb-2">30-Second Summary</label>
                        <textarea
                          value={editorialForm.summary30s}
                          onChange={(e) => setEditorialForm({ ...editorialForm, summary30s: e.target.value })}
                          className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 h-24"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold font-mono uppercase text-zinc-700 dark:text-zinc-300 mb-2">Body Text (Markdown supported) *</label>
                        <textarea
                          value={editorialForm.bodyAnalysis}
                          onChange={(e) => setEditorialForm({ ...editorialForm, bodyAnalysis: e.target.value })}
                          className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 h-64 font-mono"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold font-mono uppercase text-zinc-700 dark:text-zinc-300 mb-2">Status</label>
                          <select
                            value={editorialForm.status}
                            onChange={(e) => setEditorialForm({ ...editorialForm, status: e.target.value as any })}
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
                            value={editorialForm.imageUrl}
                            onChange={(e) => setEditorialForm({ ...editorialForm, imageUrl: e.target.value })}
                            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 mb-2"
                          />
                          <button
                            type="button"
                            onClick={() => setShowImageSelector(true)}
                            className="w-full py-2 bg-teal-50 dark:bg-teal-900/30 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-teal-700 dark:text-teal-400 font-bold text-xs rounded-lg transition-colors border border-teal-200 dark:border-teal-800 flex items-center justify-center gap-2"
                          >
                            Select Image (Web / Assets / Upload)
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Published Editorials Sidebar */}
                <div className="lg:col-span-1">
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden sticky top-6">
                    <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
                        Published Editorials
                      </h3>
                    </div>
                    <div className="divide-y divide-zinc-200 dark:divide-zinc-800 max-h-[600px] overflow-y-auto">
                      {loading ? (
                        <div className="p-6 text-center text-sm text-zinc-500 flex items-center justify-center">
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </div>
                      ) : editorials.length === 0 ? (
                        <div className="p-6 text-center text-sm text-zinc-500">
                          You haven't published any editorials yet.
                        </div>
                      ) : (
                        editorials.map((ed: any) => (
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
                                  onClick={() => handleEditEditorial(ed)}
                                  className="p-1 text-zinc-400 hover:text-teal-600 transition-colors"
                                  title="Edit"
                                >
                                  <FileEdit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteEditorial(ed.id)}
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
      </div>

      {showImageSelector && (
        <ImageSelectorModal
          onClose={() => setShowImageSelector(false)}
          onSelect={(url) => {
            setEditorialForm(prev => ({ ...prev, imageUrl: url }));
            setShowImageSelector(false);
          }}
        />
      )}
    </div>
  );
}
