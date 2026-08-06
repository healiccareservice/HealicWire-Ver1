import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  X, 
  Search, 
  Image as ImageIcon, 
  UploadCloud, 
  FolderOpen,
  Loader2,
  CheckCircle
} from 'lucide-react';

interface ImageSelectorModalProps {
  onClose: () => void;
  onSelect: (url: string) => void;
}

interface ImageFolder {
  id: string;
  name: string;
}

interface ImageAsset {
  id: string;
  file_name: string;
  file_url: string;
}

export default function ImageSelectorModal({ onClose, onSelect }: ImageSelectorModalProps) {
  const [activeTab, setActiveTab] = useState<'web' | 'assets' | 'upload'>('web');
  
  // Web Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSearchQuery, setLastSearchQuery] = useState('');
  const [searchOffset, setSearchOffset] = useState(0);
  const [webImages, setWebImages] = useState<any[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Assets State
  const [folders, setFolders] = useState<ImageFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [assets, setAssets] = useState<ImageAsset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);

  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadFolderId, setUploadFolderId] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'assets' || activeTab === 'upload') {
      fetchFolders();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedFolderId) {
      fetchAssets(selectedFolderId);
    }
  }, [selectedFolderId]);

  const fetchFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('image_folders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setFolders(data || []);
      if (data && data.length > 0 && !uploadFolderId) {
        setUploadFolderId(data[0].id);
      }
    } catch (err: any) {
      console.error("Error fetching folders:", err);
    }
  };

  const fetchAssets = async (folderId: string) => {
    setIsLoadingAssets(true);
    try {
      const { data, error } = await supabase
        .from('image_assets')
        .select('*')
        .eq('folder_id', folderId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAssets(data || []);
    } catch (err: any) {
      console.error("Error fetching assets:", err);
    } finally {
      setIsLoadingAssets(false);
    }
  };

  const handleWebSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError('');

    let currentOffset = searchOffset;
    if (searchQuery !== lastSearchQuery) {
      currentOffset = 0;
      setLastSearchQuery(searchQuery);
    } else {
      currentOffset += 10;
    }
    setSearchOffset(currentOffset);

    // Enrich query with healthcare context for better relevance
    const healthQuery = `${searchQuery} medical healthcare`;
    const page = Math.floor(currentOffset / 10) + 1;

    const validExts = ['.jpg', '.jpeg', '.png', '.svg', '.gif', '.webp'];
    const isValidUrl = (url: string) => {
      if (!url) return false;
      const base = url.split('?')[0].toLowerCase();
      return validExts.some(ext => base.endsWith(ext));
    };

    try {
      // Run all sources in parallel
      const [wikiResult, openverseResult] = await Promise.allSettled([

        // 1. Wikimedia Commons
        fetch(`https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(healthQuery)}&gsrnamespace=6&gsrlimit=10&gsroffset=${currentOffset}&prop=imageinfo&iiprop=url&format=json&origin=*`)
          .then(r => r.json())
          .then(data => {
            if (!data.query?.pages) return [];
            return Object.values(data.query.pages as Record<string, any>)
              .map((p: any) => p.imageinfo?.[0]?.url)
              .filter(isValidUrl);
          }),

        // 2. OpenVerse (Creative Commons search — free, no API key needed)
        fetch(`https://api.openverse.org/v1/images/?q=${encodeURIComponent(healthQuery)}&page=${page}&page_size=10&license_type=commercial,modification`, {
          headers: { 'User-Agent': 'HealicWire/1.0 (healthcare platform)' }
        })
          .then(r => r.json())
          .then(data => {
            if (!data.results) return [];
            return data.results
              .map((img: any) => img.url)
              .filter(isValidUrl);
          }),
      ]);

      // Merge results, Wikimedia first (more medically accurate), then OpenVerse
      const wikiUrls = wikiResult.status === 'fulfilled' ? wikiResult.value : [];
      const openverseUrls = openverseResult.status === 'fulfilled' ? openverseResult.value : [];

      // Interleave sources for diversity, deduplicate
      const merged: string[] = [];
      const seen = new Set<string>();
      const maxLen = Math.max(wikiUrls.length, openverseUrls.length);
      for (let i = 0; i < maxLen; i++) {
        if (wikiUrls[i] && !seen.has(wikiUrls[i])) { merged.push(wikiUrls[i]); seen.add(wikiUrls[i]); }
        if (openverseUrls[i] && !seen.has(openverseUrls[i])) { merged.push(openverseUrls[i]); seen.add(openverseUrls[i]); }
      }

      if (merged.length > 0) {
        setWebImages(merged);
        setCurrentImageIndex(0);
        setSearchError('');
      } else {
        setWebImages([]);
        setCurrentImageIndex(0);
        setSearchError('No images found. Try a different keyword.');
      }
    } catch (err) {
      setSearchError('Failed to search images. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    let targetFolderId = uploadFolderId;
    
    // If no folders exist, create a generic one
    if (!targetFolderId) {
      try {
        const { data, error } = await supabase
          .from('image_folders')
          .insert([{ name: 'General Uploads' }])
          .select()
          .single();
        if (error) throw error;
        targetFolderId = data.id;
        setFolders([data, ...folders]);
        setUploadFolderId(data.id);
      } catch (err: any) {
        alert("Could not create target folder: " + err.message);
        return;
      }
    }

    if (!targetFolderId) return;

    const file = files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${targetFolderId}/${fileName}`;
    
    setIsUploading(true);
    try {
      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });
        
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(filePath);
      
      const { error: dbError } = await supabase
        .from('image_assets')
        .insert([{
          folder_id: targetFolderId,
          file_name: file.name,
          file_url: publicUrl
        }]);
        
      if (dbError) throw dbError;
      
      onSelect(publicUrl);
    } catch (err: any) {
      alert("Error uploading file: " + err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-teal-600" />
            Select Image
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-2 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('web')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap ${activeTab === 'web' ? 'border-teal-600 text-teal-600' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          >
            Web Search
          </button>
          <button 
            onClick={() => setActiveTab('assets')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap ${activeTab === 'assets' ? 'border-teal-600 text-teal-600' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          >
            Platform Assets
          </button>
          <button 
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap ${activeTab === 'upload' ? 'border-teal-600 text-teal-600' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          >
            Upload New
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-50/50 dark:bg-zinc-900">
          
          {/* TAB: WEB SEARCH */}
          {activeTab === 'web' && (
            <div className="space-y-6">
              <form onSubmit={handleWebSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for medical images (e.g. 'kidney', 'surgery')..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isSearching || !searchQuery.trim()}
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-colors"
                >
                  {isSearching ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Search'}
                </button>
              </form>

              {searchError && <div className="text-center text-red-500 text-sm">{searchError}</div>}

              {webImages.length > 0 && (
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative w-full max-w-2xl aspect-video rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 border-2 border-zinc-300 dark:border-zinc-700 shadow-sm">
                    <img 
                      src={webImages[currentImageIndex]} 
                      alt={`Search result ${currentImageIndex + 1}`} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between w-full max-w-2xl bg-white dark:bg-zinc-950 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
                    <button 
                      onClick={() => setCurrentImageIndex(i => Math.max(0, i - 1))}
                      disabled={currentImageIndex === 0}
                      className="px-4 py-2 font-bold text-sm bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-zinc-700 dark:text-zinc-300 transition-colors"
                    >
                      &larr; Previous
                    </button>
                    
                    <span className="text-sm font-mono font-bold text-zinc-500">
                      {currentImageIndex + 1} / {webImages.length}
                    </span>
                    
                    <button 
                      onClick={() => {
                        if (currentImageIndex === webImages.length - 1) {
                          handleWebSearch();
                        } else {
                          setCurrentImageIndex(i => i + 1);
                        }
                      }}
                      disabled={isSearching}
                      className="px-4 py-2 font-bold text-sm bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-zinc-700 dark:text-zinc-300 transition-colors"
                    >
                      {currentImageIndex === webImages.length - 1 ? (isSearching ? 'Loading...' : 'Load Next 10 \u2192') : 'Next \u2192'}
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => { onSelect(webImages[currentImageIndex]); onClose(); }}
                    className="mt-2 w-full max-w-2xl py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Use This Image
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB: ASSETS */}
          {activeTab === 'assets' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-zinc-400" />
                <select 
                  value={selectedFolderId || ''}
                  onChange={(e) => setSelectedFolderId(e.target.value)}
                  className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-sm rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="">Select a folder...</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              {isLoadingAssets ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                </div>
              ) : selectedFolderId && assets.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 dark:text-zinc-400 text-sm">
                  This folder is empty.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                  {assets.map(asset => (
                    <div 
                      key={asset.id} 
                      onClick={() => { onSelect(asset.file_url); onClose(); }}
                      className="aspect-square rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 cursor-pointer border-2 border-transparent hover:border-teal-500 group relative"
                    >
                      <img src={asset.file_url} alt={asset.file_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-teal-500/0 group-hover:bg-teal-500/20 transition-colors flex items-center justify-center">
                        <CheckCircle className="text-white w-8 h-8 opacity-0 group-hover:opacity-100 drop-shadow-md" />
                      </div>
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-[10px] text-white truncate">{asset.file_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: UPLOAD */}
          {activeTab === 'upload' && (
            <div className="max-w-md mx-auto space-y-6 pt-4">
              
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">Save to Folder</label>
                <select 
                  value={uploadFolderId || ''}
                  onChange={(e) => setUploadFolderId(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-sm rounded-lg px-3 py-2.5 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                  {folders.length === 0 && <option value="">(Will create "General Uploads" automatically)</option>}
                </select>
              </div>

              <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-8 text-center bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors relative">
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center py-4">
                    <Loader2 className="w-10 h-10 text-teal-600 animate-spin mb-4" />
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Uploading to Cloud Storage...</p>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-12 h-12 text-teal-600 mx-auto mb-4" />
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">Upload New Image</h3>
                    <p className="text-xs text-zinc-500 mb-6">JPEG, PNG, SVG up to 10MB</p>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-sm transition-colors shadow-sm"
                    >
                      Choose File
                    </button>
                  </>
                )}
                <input 
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
