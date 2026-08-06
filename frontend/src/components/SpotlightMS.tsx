import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Save, Layout, CheckCircle, Plus, X, Database, Trash2, Sparkles } from 'lucide-react';

const CATEGORIES = [
  { label: 'Treatment Update', table: 'treatment_update' },
  { label: 'Scientific Events', table: 'scientific_events' },
  { label: 'Pharma and Drugs', table: 'drugs' },
  { label: 'Current Guidelines', table: 'current_guidelines' },
  { label: 'Health Care Providers', table: 'providers' }
];

export default function SpotlightMS() {
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [options, setOptions] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  
  const [spotlightArticles, setSpotlightArticles] = useState<any[]>([]);
  const [isFetchingDb, setIsFetchingDb] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchAllSpotlight();
  }, []);

  const fetchAllSpotlight = async () => {
    setIsFetchingDb(true);
    let allSpotlights: any[] = [];
    try {
      for (const cat of CATEGORIES) {
        const { data, error } = await supabase.from(cat.table).select('*').eq('spotlight', true);
        if (!error && data) {
          allSpotlights = [...allSpotlights, ...data.map(d => ({ ...d, _table: cat.table }))];
        }
      }
      setSpotlightArticles(allSpotlights);
    } catch (err) {
      console.error("Error fetching spotlight articles:", err);
    } finally {
      setIsFetchingDb(false);
    }
  };

  const handleCategoryChange = async (table: string) => {
    setActiveCategory(table);
    setSelectedId('');
    if (!table) return;
    try {
      const { data, error } = await supabase.from(table).select('*').limit(50);
      if (!error && data) {
        setOptions(data);
      }
    } catch (err) {
      console.error(`Error fetching from ${table}:`, err);
    }
  };

  const getLabel = (item: any) => item.headline || item.title || item.condition || item.name || 'Untitled';

  const handleAddSpotlight = async () => {
    if (!activeCategory || !selectedId) return;
    
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch(`/api/admin/spotlight-articles-db/${activeCategory}/${selectedId}`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error("Failed to add article to Spotlight");
      
      setSaveMessage("Article successfully added to Spotlight!");
      await fetchAllSpotlight();
      setSelectedId('');
      
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      alert("Error adding to spotlight: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveSpotlight = async (table: string, id: string) => {
    if (!confirm("Are you sure you want to remove this article from the Spotlight?")) return;
    try {
      const res = await fetch(`/api/admin/spotlight-articles-db/${table}/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error("Failed to remove article from Spotlight");
      
      setSpotlightArticles(prev => prev.filter(a => !(a._table === table && a.id === id)));
    } catch (err: any) {
      alert("Error removing from spotlight: " + err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans mt-8">
      <div className="bg-white dark:bg-zinc-950 p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-4 mb-6">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase font-mono flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-teal-600" />
            <span>Spotlight MS</span>
          </h3>
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-6">
          Select news articles to feature in the Spotlight section of their respective categories.
          Adding an article here will set `spotlight = TRUE` in the database.
        </p>

        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col md:flex-row gap-3 items-end mb-2">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Category</label>
              <select
                value={activeCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-white"
              >
                <option value="">-- Select Category --</option>
                {CATEGORIES.map(c => (
                  <option key={c.table} value={c.table}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Specific News</label>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                disabled={!activeCategory}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-white disabled:opacity-50"
              >
                <option value="">-- Select News --</option>
                {options.map(a => (
                  <option key={a.id} value={a.id}>{getLabel(a)}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAddSpotlight}
              disabled={!activeCategory || !selectedId || isSaving}
              className="w-full md:w-auto px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-200 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-bold disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add to Spotlight
            </button>
          </div>
          {saveMessage && (
            <div className="mt-3 text-teal-600 dark:text-teal-400 text-xs font-bold flex items-center space-x-1.5 animate-in fade-in duration-300">
              <CheckCircle className="w-4 h-4" />
              <span>{saveMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* DB Spotlight Items List */}
      <div className="bg-white dark:bg-zinc-950 p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-4 mb-6">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase font-mono flex items-center space-x-2">
            <Database className="w-5 h-5 text-teal-600" />
            <span>Currently in Spotlight</span>
          </h3>
        </div>

        {isFetchingDb ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
          </div>
        ) : spotlightArticles.length === 0 ? (
          <div className="text-center py-10 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 font-medium">No spotlight articles found across these categories.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {spotlightArticles.map((article, idx) => {
              const catLabel = CATEGORIES.find(c => c.table === article._table)?.label || article._table;
              return (
                <div key={idx} className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2.5 py-1 rounded-md whitespace-nowrap">
                      {catLabel}
                    </span>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm text-zinc-900 dark:text-white truncate font-bold">
                        {getLabel(article)}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        ID: {article.id}
                        {(article.author_name || article.author_email) && (
                          <span className="ml-2">
                            | Pub: {article.author_name || "Unknown"} {article.author_email ? `(${article.author_email})` : ""}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemoveSpotlight(article._table, article.id)}
                    className="flex-shrink-0 text-zinc-400 hover:text-red-500 bg-white dark:bg-zinc-950 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 transition-all ml-4"
                    title="Remove from spotlight"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
