import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database, FileText, Calendar, Pill, ShieldAlert, BookOpen, User, Edit2, X, Check, Image as ImageIcon, Search } from 'lucide-react';

const SECTIONS_MAP = [
  { label: 'Treatment Update', table: 'treatment_update', icon: FileText },
  { label: 'Scientific Events', table: 'scientific_events', icon: Calendar },
  { label: 'Pharma and Drugs', table: 'drugs', icon: Pill },
  { label: 'Clinical Alerts', table: 'hospital_alerts', icon: ShieldAlert },
  { label: 'Current Guidelines', table: 'current_guidelines', icon: BookOpen },
  { label: 'Healthcare Providers', table: 'current_guidelines', icon: User },
];

export function GeneratedArticlesViewer() {
  const [selectedSection, setSelectedSection] = useState(SECTIONS_MAP[0]);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ 
    headline: '', 
    image_url: '',
    subhead: '',
    summary_30s: '',
    status: '',
    source_url: ''
  });
  const [saving, setSaving] = useState(false);
  const [showWikiSearch, setShowWikiSearch] = useState(false);
  const [wikiQuery, setWikiQuery] = useState('');
  const [wikiResults, setWikiResults] = useState<string[]>([]);
  const [isSearchingWiki, setIsSearchingWiki] = useState(false);

  const medicalKeywords = ['hospital', 'doctor', 'surgery', 'medicine', 'clinic', 'nurse', 'pharmacy', 'stethoscope', 'laboratory', 'medical research', 'mri', 'x-ray', 'patient', 'health', 'biology', 'virus', 'bacteria', 'dna', 'genetics'];

  const handleWikiSearch = async (queryOverride?: string) => {
    const queryToUse = queryOverride || wikiQuery;
    if (!queryToUse.trim()) return;
    setIsSearchingWiki(true);
    try {
      const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(queryToUse)}&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url&format=json&origin=*`;
      const response = await fetch(url);
      const data = await response.json();
      const pages = data.query?.pages;
      if (pages) {
        const urls = Object.values(pages)
          .map((p: any) => p.imageinfo?.[0]?.url)
          .filter(Boolean);
        setWikiResults(urls);
      } else {
        setWikiResults([]);
      }
    } catch (err) {
      console.error('Error searching Wikimedia', err);
    }
    setIsSearchingWiki(false);
  };

  const handleToggleOrRefreshSearch = () => {
    setShowWikiSearch(true);
    const randomKeyword = medicalKeywords[Math.floor(Math.random() * medicalKeywords.length)];
    setWikiQuery(randomKeyword);
    handleWikiSearch(randomKeyword);
  };

  useEffect(() => {
    async function fetchArticles() {
      setLoading(true);
      try {
        let { data, error } = await supabase
          .from(selectedSection.table)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
          
        if (error) {
           // fallback order if created_at doesn't exist
           const { data: data2 } = await supabase.from(selectedSection.table).select('*').limit(50);
           setArticles(data2 || []);
        } else {
           setArticles(data || []);
        }
      } catch (err) {
        console.error("Error fetching articles", err);
      }
      setLoading(false);
    }
    fetchArticles();
  }, [selectedSection]);

  const handleEdit = (article: any) => {
    setEditingArticle(article);
    setEditForm({
      headline: article.headline || article.title || article.name || '',
      image_url: article.image_url || article.poster_url || '',
      subhead: article.subhead || '',
      summary_30s: article.summary_30s || article.ai_summary || '',
      status: article.status || 'published',
      source_url: article.source_url || article.registration_url || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingArticle) return;
    setSaving(true);
    try {
      // Determine the primary key field (usually id)
      const pkField = 'id';
      
      // Determine which field holds the title/headline
      const titleField = editingArticle.hasOwnProperty('title') ? 'title' : 
                         editingArticle.hasOwnProperty('name') ? 'name' : 'headline';
                         
      // Determine which field holds the image
      const imageField = editingArticle.hasOwnProperty('poster_url') ? 'poster_url' : 'image_url';

      const updatePayload: any = {
        [titleField]: editForm.headline,
        [imageField]: editForm.image_url,
        updated_at: new Date().toISOString()
      };
      
      if (editingArticle.hasOwnProperty('subhead')) updatePayload.subhead = editForm.subhead;
      if (editingArticle.hasOwnProperty('summary_30s')) updatePayload.summary_30s = editForm.summary_30s;
      else if (editingArticle.hasOwnProperty('ai_summary')) updatePayload.ai_summary = editForm.summary_30s;
      
      if (editingArticle.hasOwnProperty('status')) updatePayload.status = editForm.status;
      
      if (editingArticle.hasOwnProperty('source_url')) updatePayload.source_url = editForm.source_url;
      else if (editingArticle.hasOwnProperty('registration_url')) updatePayload.registration_url = editForm.source_url;

      const { error } = await supabase
        .from(selectedSection.table)
        .update(updatePayload)
        .eq(pkField, editingArticle.id);

      if (error) throw error;

      // Update local state
      setArticles(prev => prev.map(a => {
        if (a.id === editingArticle.id) {
          return { ...a, ...updatePayload };
        }
        return a;
      }));
      setEditingArticle(null);
    } catch (err) {
      console.error("Error updating article", err);
      alert("Failed to update the article. Please check the console for details.");
    }
    setSaving(false);
  };

  return (
    <div className="mt-8 bg-white dark:bg-zinc-950 p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
      <div className="flex items-center space-x-3 border-b border-zinc-100 dark:border-zinc-900 pb-4">
        <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600">
          <Database className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-zinc-900 dark:text-white uppercase font-mono tracking-tight">
            Database Viewer
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            View articles currently saved in the Supabase database.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-mono font-bold uppercase text-zinc-700 dark:text-zinc-300 mb-2">
            Select Section to View
          </label>
          <div className="relative">
            <select
              value={selectedSection.label}
              onChange={(e) => {
                const found = SECTIONS_MAP.find(s => s.label === e.target.value);
                if (found) setSelectedSection(found);
              }}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 appearance-none"
            >
              {SECTIONS_MAP.map(s => (
                <option key={s.label} value={s.label}>{s.label} (Table: public.{s.table})</option>
              ))}
            </select>
            <selectedSection.icon className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
          </div>
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-zinc-500 text-xs font-mono flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              <span>Fetching from {selectedSection.table}...</span>
            </div>
          ) : articles.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs font-mono">
              No articles found in {selectedSection.table}.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs relative">
                <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300">Title / Headline</th>
                    <th className="px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300">Status</th>
                    <th className="px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300">Date</th>
                    <th className="px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-300 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {articles.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100 font-medium">
                        {item.headline || item.title || item.name || 'Untitled'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold font-mono ${
                          item.status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                          item.status === 'active' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {item.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 font-mono text-[10px]">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : 
                         item.published_at ? new Date(item.published_at).toLocaleDateString() : 
                         item.start_date ? new Date(item.start_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 text-zinc-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-lg transition-colors"
                          title="Edit Article"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal Overlay */}
      {editingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center space-x-2">
                <Edit2 className="w-4 h-4 text-teal-600" />
                <span>Edit Article</span>
              </h3>
              <button 
                onClick={() => setEditingArticle(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Headline / Title
                </label>
                <input
                  type="text"
                  value={editForm.headline}
                  onChange={(e) => setEditForm({ ...editForm, headline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  placeholder="Enter headline..."
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Image
                </label>
                <div className="flex items-start space-x-4">
                  <div 
                    onClick={handleToggleOrRefreshSearch}
                    className="relative w-20 h-20 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex-shrink-0 cursor-pointer group hover:border-teal-500 transition-colors"
                  >
                    {editForm.image_url ? (
                      <img src={editForm.image_url} alt="Thumbnail" className="w-full h-full object-contain group-hover:opacity-50 transition-opacity" onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }} />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-zinc-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    )}
                    <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-center p-1">
                      <span className="text-[9px] text-white font-bold leading-tight">Change Image</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="relative">
                      <input
                        type="url"
                        value={editForm.image_url}
                        onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                        placeholder="Image URL..."
                      />
                      <ImageIcon className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                    </div>
                    <button
                      onClick={handleToggleOrRefreshSearch}
                      className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center space-x-1"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Search Wikimedia Commons</span>
                    </button>
                  </div>
                </div>
                
                {showWikiSearch && (
                  <div className="mt-4 p-4 rounded-xl border border-teal-200 dark:border-teal-900 bg-teal-50/50 dark:bg-teal-950/20 space-y-4">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={wikiQuery}
                        onChange={(e) => setWikiQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleWikiSearch()}
                        placeholder="Search for medical images..."
                        className="flex-1 px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                      <button
                        onClick={() => handleWikiSearch()}
                        disabled={isSearchingWiki}
                        className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold disabled:opacity-50 flex items-center space-x-1.5"
                      >
                        {isSearchingWiki ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Search className="w-3.5 h-3.5" />
                        )}
                        <span>Search</span>
                      </button>
                    </div>
                    
                    {wikiResults.length > 0 && (
                      <div className="grid grid-cols-4 gap-2">
                        {wikiResults.map((url, i) => (
                          <div 
                            key={i} 
                            onClick={() => {
                              setEditForm({ ...editForm, image_url: url });
                              setShowWikiSearch(false);
                            }}
                            className="aspect-square rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:border-teal-500 hover:ring-2 hover:ring-teal-500/50 transition-all"
                          >
                            <img onError={(e) => { e.currentTarget.style.display = 'none'; }} src={url} alt="Result" className="w-full h-full object-contain" />
                          </div>
                        ))}
                      </div>
                    )}
                    {wikiResults.length === 0 && !isSearchingWiki && wikiQuery && (
                      <p className="text-xs text-zinc-500 text-center">No images found.</p>
                    )}
                  </div>
                )}
              </div>
              
              {(editingArticle?.hasOwnProperty('subhead')) && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Subhead
                  </label>
                  <input
                    type="text"
                    value={editForm.subhead}
                    onChange={(e) => setEditForm({ ...editForm, subhead: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              )}
              
              {(editingArticle?.hasOwnProperty('summary_30s') || editingArticle?.hasOwnProperty('ai_summary')) && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Summary / AI Summary
                  </label>
                  <textarea
                    rows={3}
                    value={editForm.summary_30s}
                    onChange={(e) => setEditForm({ ...editForm, summary_30s: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              )}
              
              {(editingArticle?.hasOwnProperty('source_url') || editingArticle?.hasOwnProperty('registration_url')) && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Source URL
                  </label>
                  <input
                    type="url"
                    value={editForm.source_url}
                    onChange={(e) => setEditForm({ ...editForm, source_url: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              )}
              
              {(editingArticle?.hasOwnProperty('status')) && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-end p-4 border-t border-zinc-100 dark:border-zinc-800 space-x-3 bg-zinc-50 dark:bg-zinc-950/50">
              <button
                onClick={() => setEditingArticle(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors flex items-center space-x-1.5 disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
