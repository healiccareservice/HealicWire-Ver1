import React, { useState, useEffect, useRef } from 'react';
import { UserPlus, Edit2, Trash2, Check, X, RefreshCw, FileText, UploadCloud, ImageIcon, User } from 'lucide-react';
import ImageSelectorModal from './ImageSelectorModal';
import { authFetch } from '../lib/api';

interface HealthcareProfessional {
  id: string;
  name: string;
  role: string;
  degree: string;
  bio: string;
  email?: string;
  avatar_url?: string;
  show_in_public_insights?: boolean;
}

interface ClinicalInsight {
  id: string;
  article_title: string;
  detailed_article: string;
  recent_clinical_update: string;
  why_this_matters: string;
  clinical_pearls: string;
  future_directions: string;
  evidence_summary: string;
  references: string;
  author_ids: string[];
  image_url?: string;
  created_at: string;
}

export default function ClinicalInsightsMS() {
  const [professionals, setProfessionals] = useState<HealthcareProfessional[]>([]);
  const [insights, setInsights] = useState<ClinicalInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Form state
  const [showProfForm, setShowProfForm] = useState(false);
  const [editingProf, setEditingProf] = useState<HealthcareProfessional | null>(null);
  const [formData, setFormData] = useState({ name: '', role: '', degree: '', bio: '', email: '', avatar_url: '', show_in_public_insights: false });
  const [editingInsight, setEditingInsight] = useState<ClinicalInsight | null>(null);
  const [savingInsight, setSavingInsight] = useState(false);

  // Dropdown state
  const [dropdownSelectedId, setDropdownSelectedId] = useState<string>('');
  const [displayedProfId, setDisplayedProfId] = useState<string | null>(null);
  const [imageSelectorTarget, setImageSelectorTarget] = useState<string | null>(null);
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Write Insight Modal state
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [writeTitle, setWriteTitle] = useState('');
  const [writeProfId, setWriteProfId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profRes, insRes] = await Promise.all([
        authFetch('/api/admin/user-profiles'),
        authFetch('/api/admin/clinical_insights')
      ]);

      if (profRes.ok) {
        const profData = await profRes.json();
        setProfessionals(profData.filter((p: any) => 
          p.permissions && Array.isArray(p.permissions) && p.permissions.includes('clinical_insights')
        ));
      }
      if (insRes.ok) setInsights(await insRes.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfessional = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const method = editingProf ? 'PUT' : 'POST';
      const url = editingProf ? `/api/admin/user-profiles/${editingProf.id}` : '/api/admin/user-profiles';

      const res = await authFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error(await res.text());

      await fetchData();
      setShowProfForm(false);
      setEditingProf(null);
      setFormData({ name: '', role: '', degree: '', bio: '', email: '', avatar_url: '', show_in_public_insights: false });
    } catch (err: any) {
      alert("Error saving professional: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `avatar_${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        try {
          const res = await authFetch("/api/admin/upload-avatar-storage", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ 
              name: file.name, 
              dataUrl, 
              category: "avatar", 
              size: (file.size / 1024).toFixed(1) + " KB" 
            })
          });
          
          if (!res.ok) throw new Error(await res.text());
          const data = await res.json();
          
          if (data.url) {
            setFormData(prev => ({ ...prev, avatar_url: data.url }));
          } else {
            throw new Error("No URL returned");
          }
        } catch (err: any) {
          alert("Error uploading image: " + err.message);
        } finally {
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      alert("Error reading file: " + err.message);
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };


  const handleGenerateInsight = async () => {
    if (!writeProfId) return alert("Select a professional first.");
    if (!writeTitle) return alert("Please enter a title.");
    
    try {
      setGenerating(true);
      const selectedProfs = professionals.filter(p => p.id === writeProfId);

      const res = await authFetch('/api/admin/clinical_insights/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ professionals: selectedProfs, title: writeTitle })
      });
      
      if (!res.ok) throw new Error(await res.text());
      await fetchData();
      setShowWriteModal(false);
      setWriteTitle('');
    } catch (err: any) {
      alert("Error generating insight: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteProfessional = async (id: string) => {
    if (!confirm("Delete this professional?")) return;
    try {
      const res = await authFetch(`/api/admin/user-profiles/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(await res.text());
      setProfessionals(prev => prev.filter(p => p.id !== id));
      if (dropdownSelectedId === id) setDropdownSelectedId('');
      if (displayedProfId === id) setDisplayedProfId(null);
    } catch (err: any) {
      alert("Error deleting: " + err.message);
    }
  };

  const handleDeleteInsight = async (id: string) => {
    if (!confirm('Are you sure you want to delete this insight?')) return;
    try {
      const res = await authFetch(`/api/admin/clinical_insights/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchData();
    } catch (err: any) {
      alert("Error deleting insight: " + err.message);
    }
  };

  const handleUpdateInsight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInsight) return;
    try {
      setSavingInsight(true);
      const res = await authFetch(`/api/admin/clinical_insights/${editingInsight.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingInsight)
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchData();
      setEditingInsight(null);
    } catch (err: any) {
      alert("Error saving insight: " + err.message);
    } finally {
      setSavingInsight(false);
    }
  };

  const handleImageSelect = async (url: string) => {
    try {
      const res = await authFetch(`/api/admin/clinical_insights/${imageSelectorTarget}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image_url: url })
      });
      if (res.ok) {
        if (editingInsight && editingInsight.id === imageSelectorTarget) {
          setEditingInsight({ ...editingInsight, image_url: url });
        }
        fetchData();
      } else {
        alert("Failed to update image");
      }
    } catch(e) {
      console.error(e);
    }
    setImageSelectorTarget(null);
  };

  if (loading) return <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">Loading Clinical Insights MS...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Clinical Insights MS</h2>
        <p className="text-zinc-600 dark:text-zinc-400">Manage healthcare professionals and generate clinical insights based on their expertise.</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Healthcare Professionals</h3>
          <button
            onClick={() => {
              setEditingProf(null);
              setFormData({ name: '', role: '', degree: '', bio: '', email: '', avatar_url: '', show_in_public_insights: false });
              setShowProfForm(!showProfForm);
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            {showProfForm ? <X className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
            {showProfForm ? 'Cancel' : 'Add Professional'}
          </button>
        </div>

        {showProfForm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-2xl w-full p-6 shadow-xl border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                  {editingProf ? 'Edit Profile Details' : 'Add Professional'}
                </h3>
                <button 
                  onClick={() => setShowProfForm(false)}
                  className="p-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveProfessional} className="space-y-4 max-w-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-transparent text-zinc-900 dark:text-white"
                      placeholder="Dr. Jane Doe"
                    />
                  </div>
                  {!editingProf && (
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-transparent text-zinc-900 dark:text-white"
                        placeholder="jane@example.com"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Role / Specialty</label>
                    <input
                      type="text"
                      value={formData.role}
                      onChange={e => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-transparent text-zinc-900 dark:text-white"
                      placeholder="Consultant Cardiologist"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Degrees</label>
                    <input
                      type="text"
                      value={formData.degree}
                      onChange={e => setFormData({ ...formData, degree: e.target.value })}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-transparent text-zinc-900 dark:text-white"
                      placeholder="MD, DM"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Avatar URL</label>
                    <div className="flex items-center space-x-4">
                      {formData.avatar_url ? (
                        <img src={formData.avatar_url} alt="Preview" className="w-12 h-12 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shrink-0 flex items-center justify-center">
                          <User className="w-5 h-5 text-zinc-400" />
                        </div>
                      )}
                      <div className="flex-1 flex space-x-2">
                        <input
                          type="text"
                          value={formData.avatar_url}
                          onChange={e => setFormData({ ...formData, avatar_url: e.target.value })}
                          className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-transparent text-zinc-900 dark:text-white min-w-0"
                          placeholder="https://example.com/avatar.jpg"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="flex shrink-0 items-center justify-center px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:bg-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                        >
                          {isUploading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                          Upload Image
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Biography / Expertise Area</label>
                  <textarea
                    value={formData.bio}
                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-transparent text-zinc-900 dark:text-white"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="show_public"
                    checked={formData.show_in_public_insights}
                    onChange={e => setFormData({ ...formData, show_in_public_insights: e.target.checked })}
                    className="h-4 w-4 text-blue-600 rounded border-zinc-300 dark:border-zinc-700 focus:ring-blue-500"
                  />
                  <label htmlFor="show_public" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Show this professional's insights in the public Clinical Insights section
                  </label>
                </div>
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                    Save Professional
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="p-6">
          {professionals.length === 0 ? (
            <p className="text-zinc-500 dark:text-zinc-400 text-center py-4">No healthcare professionals added yet.</p>
          ) : (
            <div className="flex flex-col sm:flex-row items-end space-y-4 sm:space-y-0 sm:space-x-4 mb-6 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <div className="flex-1 w-full">
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Select a Healthcare Professional</label>
                <select
                  value={dropdownSelectedId}
                  onChange={(e) => setDropdownSelectedId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white outline-none"
                >
                  <option value="">-- Choose Professional --</option>
                  {professionals.map(prof => (
                    <option key={prof.id} value={prof.id}>{prof.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setDisplayedProfId(dropdownSelectedId)}
                disabled={!dropdownSelectedId}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Show Data & Articles
              </button>
            </div>
          )}

          {/* DISPLAYED PROFESSIONAL DATA */}
          {displayedProfId && (() => {
            const prof = professionals.find(p => p.id === displayedProfId);
            if (!prof) return null;
            return (
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 bg-white dark:bg-zinc-900 shadow-sm transition-all relative">
                <div className="absolute top-6 right-6 flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingProf(prof);
                      setFormData({ name: prof.name || '', role: prof.role || '', degree: prof.degree || '', bio: prof.bio || '', email: prof.email || '', avatar_url: prof.avatar_url || '', show_in_public_insights: !!prof.show_in_public_insights });
                      setShowProfForm(true);
                    }}
                    className="p-2 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    title="Edit Profile"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProfessional(prof.id)}
                    className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Delete Profile"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex flex-col md:flex-row gap-6">
                  {prof.avatar_url ? (
                    <img src={prof.avatar_url} alt={prof.name} className="w-24 h-24 rounded-full object-cover border-2 border-zinc-100 dark:border-zinc-800 shadow-sm" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border-2 border-zinc-200 dark:border-zinc-700 shadow-sm">
                      <User className="w-10 h-10 text-zinc-400" />
                    </div>
                  )}
                  <div className="flex-1 pr-16">
                    <h4 className="text-xl font-bold text-zinc-900 dark:text-white">{prof.name}</h4>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1">{prof.degree} • {prof.role}</p>
                    {prof.bio && (
                      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
                        {prof.bio}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-end pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    onClick={() => {
                      setWriteProfId(prof.id);
                      setWriteTitle('');
                      setShowWriteModal(true);
                    }}
                    className="flex items-center px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm font-medium"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Write New Insight
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
            {displayedProfId ? `Clinical Insights by ${professionals.find(p => p.id === displayedProfId)?.name || 'Selected Professional'}` : 'All Generated Clinical Insights'}
          </h3>
        </div>
        <div className="p-6">
          {(() => {
            const displayedInsights = displayedProfId 
              ? insights.filter(i => i.author_ids && i.author_ids.includes(displayedProfId))
              : insights;
              
            if (displayedInsights.length === 0) {
              return <p className="text-zinc-500 dark:text-zinc-400 text-center py-4">No clinical insights found.</p>;
            }
            return (
              <div className="space-y-4">
                {displayedInsights.map(insight => (
                <div key={insight.id} className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-3">
                        {insight.image_url && (
                          <img src={insight.image_url} alt="Cover" className="w-12 h-12 rounded object-cover border border-zinc-200 dark:border-zinc-800" />
                        )}
                        <h4 className="font-semibold text-lg text-zinc-900 dark:text-white">{insight.article_title}</h4>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        Generated on {new Date(insight.created_at).toLocaleDateString()} 
                        {insight.author_ids?.length > 0 && ` • By ${insight.author_ids.length} Professional(s)`}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingInsight(insight)}
                        className="text-gray-400 hover:text-blue-600 p-1"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteInsight(insight.id)}
                        className="text-gray-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => setImageSelectorTarget(insight.id)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-md flex items-center transition-colors"
                    >
                      <ImageIcon className="w-3.5 h-3.5 mr-1.5" />
                      {insight.image_url ? 'Change Cover Image' : 'Add Cover Image'}
                    </button>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Clinical Pearls</h5>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-line">{insight.clinical_pearls}</div>
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Why This Matters</h5>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{insight.why_this_matters}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
        </div>
      </div>
    
      {/* EDIT INSIGHT MODAL */}
      {editingInsight && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-4xl w-full p-6 shadow-xl border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Edit Clinical Insight</h3>
            <form onSubmit={handleUpdateInsight} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Article Title</label>
                  <input
                    required
                    value={editingInsight.article_title}
                    onChange={(e) => setEditingInsight({ ...editingInsight, article_title: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none text-zinc-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Cover Image URL</label>
                  <div className="flex space-x-2">
                    <input
                      value={editingInsight.image_url || ''}
                      onChange={(e) => setEditingInsight({ ...editingInsight, image_url: e.target.value })}
                      className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none text-zinc-900 dark:text-white"
                      placeholder="https://..."
                    />
                    <button
                      type="button"
                      onClick={() => setImageSelectorTarget(editingInsight.id)}
                      className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-md transition-colors"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                  </div>
                  {editingInsight.image_url && (
                    <img src={editingInsight.image_url} alt="Preview" className="mt-2 h-20 w-auto rounded object-cover border border-zinc-200 dark:border-zinc-700" />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Recent Clinical Update</label>
                <textarea
                  rows={3}
                  value={editingInsight.recent_clinical_update}
                  onChange={(e) => setEditingInsight({ ...editingInsight, recent_clinical_update: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Why This Matters</label>
                <textarea
                  rows={3}
                  value={editingInsight.why_this_matters}
                  onChange={(e) => setEditingInsight({ ...editingInsight, why_this_matters: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Clinical Pearls (JSON array strings or free text)</label>
                <textarea
                  rows={4}
                  value={editingInsight.clinical_pearls}
                  onChange={(e) => setEditingInsight({ ...editingInsight, clinical_pearls: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none text-zinc-900 dark:text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Future Directions (JSON array strings or free text)</label>
                <textarea
                  rows={4}
                  value={editingInsight.future_directions}
                  onChange={(e) => setEditingInsight({ ...editingInsight, future_directions: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none text-zinc-900 dark:text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Evidence Summary (JSON array strings or free text)</label>
                <textarea
                  rows={4}
                  value={editingInsight.evidence_summary}
                  onChange={(e) => setEditingInsight({ ...editingInsight, evidence_summary: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none text-zinc-900 dark:text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">References (JSON array strings or free text)</label>
                <textarea
                  rows={3}
                  value={editingInsight.references}
                  onChange={(e) => setEditingInsight({ ...editingInsight, references: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none text-zinc-900 dark:text-white font-mono text-xs"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingInsight(null)}
                  className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-medium disabled:opacity-50"
                  disabled={savingInsight}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingInsight}
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
                >
                  {savingInsight ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {imageSelectorTarget && (
        <ImageSelectorModal
          onClose={() => setImageSelectorTarget(null)}
          onSelect={handleImageSelect}
        />
      )}

      {showWriteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-lg w-full p-6 shadow-xl border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Write New Insight</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Healthcare Professional</label>
                <select
                  value={writeProfId}
                  onChange={(e) => setWriteProfId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none text-zinc-900 dark:text-white"
                >
                  <option value="">-- Select Professional --</option>
                  {professionals.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Insight Title/Topic</label>
                <input
                  type="text"
                  value={writeTitle}
                  onChange={(e) => setWriteTitle(e.target.value)}
                  placeholder="e.g. Redefining the HER2 Paradigm..."
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none text-zinc-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowWriteModal(false)}
                  disabled={generating}
                  className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateInsight}
                  disabled={generating || !writeProfId || !writeTitle}
                  className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium disabled:opacity-50"
                >
                  {generating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                  Generate Clinical Insight
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
