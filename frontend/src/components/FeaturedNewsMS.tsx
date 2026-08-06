import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Save, Layout, CheckCircle, Plus, X, Database, Trash2 } from 'lucide-react';
import { Article } from '../types';

const CATEGORIES = [
  { label: 'Treatment Update', table: 'treatment_update' },
  { label: 'Scientific Events', table: 'scientific_events' },
  { label: 'Pharma and Drugs', table: 'drugs' },
  { label: 'Clinical Alerts', table: 'hospital_alerts' },
  { label: 'Current Guidelines', table: 'current_guidelines' },
  { label: 'Healthcare Providers', table: 'providers' }
];

export default function FeaturedNewsMS() {
  const [isLoading, setIsLoading] = useState(true);
  
  const [slot1Items, setSlot1Items] = useState<{table: string, id: string, label?: string}[]>([]);
  const [slot2Items, setSlot2Items] = useState<{table: string, id: string, label?: string}[]>([]);
  
  const [tempSlot1, setTempSlot1] = useState<{table: string, id: string}>({ table: '', id: '' });
  const [tempSlot2, setTempSlot2] = useState<{table: string, id: string}>({ table: '', id: '' });
  
  const [slot1Options, setSlot1Options] = useState<any[]>([]);
  const [slot2Options, setSlot2Options] = useState<any[]>([]);

  const [dbFeaturedArticles, setDbFeaturedArticles] = useState<any[]>([]);
  const [isFetchingDb, setIsFetchingDb] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/admin/featured-news-settings');
        const settings = await res.json();
        
        if (settings.slots && settings.slots.length > 0) {
          // Handle backwards compatibility where slot is a single object
          const s1Raw = settings.slots[0];
          const s2Raw = settings.slots.length > 1 ? settings.slots[1] : null;
          
          const s1Array = Array.isArray(s1Raw) ? s1Raw : (s1Raw && s1Raw.table ? [s1Raw] : []);
          const s2Array = Array.isArray(s2Raw) ? s2Raw : (s2Raw && s2Raw.table ? [s2Raw] : []);
          
          setSlot1Items(s1Array);
          setSlot2Items(s2Array);
        }
      } catch (err) {
        console.error("Error loading featured news MS:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettings();
    fetchDbFeatured();
  }, []);

  const fetchDbFeatured = async () => {
    setIsFetchingDb(true);
    try {
      const res = await fetch('/api/admin/featured-articles-db');
      if (res.ok) {
        const data = await res.json();
        setDbFeaturedArticles(data);
      }
    } catch (err) {
      console.error("Error fetching db featured articles:", err);
    } finally {
      setIsFetchingDb(false);
    }
  };

  const fetchOptionsForTable = async (table: string) => {
    if (!table) return [];
    try {
      const { data, error } = await supabase.from(table).select('*').limit(50);
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error(`Error fetching from ${table}:`, err);
      return [];
    }
  };

  const handleCategoryChange = async (slot: 1 | 2, table: string) => {
    if (slot === 1) {
      setTempSlot1({ table, id: '' });
      const data = await fetchOptionsForTable(table);
      setSlot1Options(data);
    } else {
      setTempSlot2({ table, id: '' });
      const data = await fetchOptionsForTable(table);
      setSlot2Options(data);
    }
  };

  const getLabel = (item: any) => item.headline || item.title || item.condition || item.name || 'Untitled';

  const handleAddItem = (slot: 1 | 2) => {
    if (slot === 1) {
      if (!tempSlot1.table || !tempSlot1.id) return;
      const opt = slot1Options.find(o => o.id === tempSlot1.id);
      setSlot1Items([...slot1Items, { ...tempSlot1, label: opt ? getLabel(opt) : 'Saved Item' }]);
      setTempSlot1({ table: tempSlot1.table, id: '' });
    } else {
      if (!tempSlot2.table || !tempSlot2.id) return;
      const opt = slot2Options.find(o => o.id === tempSlot2.id);
      setSlot2Items([...slot2Items, { ...tempSlot2, label: opt ? getLabel(opt) : 'Saved Item' }]);
      setTempSlot2({ table: tempSlot2.table, id: '' });
    }
  };

  const handleRemoveItem = (slot: 1 | 2, index: number) => {
    if (slot === 1) {
      setSlot1Items(slot1Items.filter((_, i) => i !== index));
    } else {
      setSlot2Items(slot2Items.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      // Send arrays
      const slots = [
        slot1Items.map(i => ({ table: i.table, id: i.id })),
        slot2Items.map(i => ({ table: i.table, id: i.id }))
      ];
      const res = await fetch('/api/admin/featured-news-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots })
      });
      
      if (!res.ok) throw new Error("Failed to save settings");
      setSaveMessage("Featured News settings updated successfully!");
      
      // Refresh DB list after saving since the backend synced the DB
      await fetchDbFeatured();

      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFromDb = async (table: string, id: string) => {
    if (!confirm("Are you sure you want to remove this article from featured news? This will unset its featured status and remove it from the slots above.")) return;
    try {
      const res = await fetch(`/api/admin/featured-articles-db/${table}/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        // Refresh everything
        setDbFeaturedArticles(prev => prev.filter(a => !(a._table === table && a.id === id)));
        setSlot1Items(prev => prev.filter(a => !(a.table === table && a.id === id)));
        setSlot2Items(prev => prev.filter(a => !(a.table === table && a.id === id)));
      } else {
        throw new Error("Failed to delete article");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
      </div>
    );
  }

  const renderSelectedItems = (items: any[], slotNum: 1 | 2) => {
    if (items.length === 0) return <p className="text-xs text-zinc-500 italic mt-3">No articles selected yet.</p>;
    return (
      <div className="mt-4 space-y-2">
        {items.map((item, idx) => {
          const catLabel = CATEGORIES.find(c => c.table === item.table)?.label || item.table;
          return (
            <div key={idx} className="flex items-center justify-between bg-white dark:bg-zinc-950 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center space-x-2 overflow-hidden">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">
                  {catLabel}
                </span>
                <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate font-medium">
                  {item.label || `ID: ${item.id.substring(0, 8)}...`}
                </span>
              </div>
              <button 
                onClick={() => handleRemoveItem(slotNum, idx)}
                className="text-zinc-400 hover:text-red-500 transition-colors p-1"
                title="Remove item"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      <div className="bg-white dark:bg-zinc-950 p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-4 mb-6">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase font-mono flex items-center space-x-2">
            <Layout className="w-5 h-5 text-indigo-600" />
            <span>Featured News Layout (Hero Section)</span>
          </h3>
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-6">
          Select multiple news articles to feature prominently at the top of the homepage in the new 3-column layout. 
          If you add more than one article per slot, they will automatically rotate every 3 seconds.
        </p>

        <div className="space-y-8">
          {/* SLOT 1 */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center justify-between">
              Slot 1 (Left Column)
              <span className="text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full">
                {slot1Items.length} item{slot1Items.length !== 1 && 's'}
              </span>
            </h4>
            
            <div className="flex flex-col md:flex-row gap-3 items-end mb-2">
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Category</label>
                <select
                  value={tempSlot1.table}
                  onChange={(e) => handleCategoryChange(1, e.target.value)}
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
                  value={tempSlot1.id}
                  onChange={(e) => setTempSlot1({ ...tempSlot1, id: e.target.value })}
                  disabled={!tempSlot1.table}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-white disabled:opacity-50"
                >
                  <option value="">-- Select News --</option>
                  {slot1Options.map(a => (
                    <option key={a.id} value={a.id}>{getLabel(a)}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => handleAddItem(1)}
                disabled={!tempSlot1.table || !tempSlot1.id}
                className="w-full md:w-auto px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-200 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-bold disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            {renderSelectedItems(slot1Items, 1)}
          </div>

          {/* SLOT 2 */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center justify-between">
              Slot 2 (Middle Column)
              <span className="text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full">
                {slot2Items.length} item{slot2Items.length !== 1 && 's'}
              </span>
            </h4>
            
            <div className="flex flex-col md:flex-row gap-3 items-end mb-2">
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Category</label>
                <select
                  value={tempSlot2.table}
                  onChange={(e) => handleCategoryChange(2, e.target.value)}
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
                  value={tempSlot2.id}
                  onChange={(e) => setTempSlot2({ ...tempSlot2, id: e.target.value })}
                  disabled={!tempSlot2.table}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-white disabled:opacity-50"
                >
                  <option value="">-- Select News --</option>
                  {slot2Options.map(a => (
                    <option key={a.id} value={a.id}>{getLabel(a)}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => handleAddItem(2)}
                disabled={!tempSlot2.table || !tempSlot2.id}
                className="w-full md:w-auto px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-200 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-bold disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            {renderSelectedItems(slot2Items, 2)}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-end gap-4">
          {saveMessage && (
            <div className="text-green-600 dark:text-green-400 text-xs font-bold flex items-center space-x-1.5 animate-in fade-in slide-in-from-right-4 duration-300">
              <CheckCircle className="w-4 h-4" />
              <span>{saveMessage}</span>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-sans text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center space-x-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Feature Settings</span>
          </button>
        </div>
      </div>

      {/* DB Featured Items List */}
      <div className="bg-white dark:bg-zinc-950 p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-4 mb-6">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase font-mono flex items-center space-x-2">
            <Database className="w-5 h-5 text-indigo-600" />
            <span>Currently Featured Articles in Database</span>
          </h3>
        </div>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-6">
          These articles currently have `featured = true` in the database. Deleting them here will set their status to FALSE and automatically remove them from the slots above.
        </p>

        {isFetchingDb ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
          </div>
        ) : dbFeaturedArticles.length === 0 ? (
          <div className="text-center py-10 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 font-medium">No featured articles found in the database.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dbFeaturedArticles.map((article, idx) => {
              const catLabel = CATEGORIES.find(c => c.table === article._table)?.label || article._table;
              return (
                <div key={idx} className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-md whitespace-nowrap">
                      {catLabel}
                    </span>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm text-zinc-900 dark:text-white truncate font-bold">
                        {getLabel(article)}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        ID: {article.id}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteFromDb(article._table, article.id)}
                    className="flex-shrink-0 text-zinc-400 hover:text-red-500 bg-white dark:bg-zinc-950 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 transition-all ml-4"
                    title="Remove from featured"
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
