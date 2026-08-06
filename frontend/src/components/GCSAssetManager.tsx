import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  FolderPlus, 
  Folder, 
  UploadCloud, 
  Copy, 
  CheckCircle, 
  Trash2, 
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  FolderOpen
} from 'lucide-react';

interface ImageFolder {
  id: string;
  name: string;
  created_at: string;
}

interface ImageAsset {
  id: string;
  folder_id: string;
  file_name: string;
  file_url: string;
  created_at: string;
}

export default function GCSAssetManager() {
  const [folders, setFolders] = useState<ImageFolder[]>([]);
  const [assets, setAssets] = useState<ImageAsset[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  
  const [isLoadingFolders, setIsLoadingFolders] = useState(true);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  
  const [isUploading, setIsUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Folders
  useEffect(() => {
    fetchFolders();
  }, []);

  // Load Assets when folder changes
  useEffect(() => {
    if (selectedFolderId) {
      fetchAssets(selectedFolderId);
    } else {
      setAssets([]);
    }
  }, [selectedFolderId]);

  const fetchFolders = async () => {
    setIsLoadingFolders(true);
    try {
      const { data, error } = await supabase
        .from('image_folders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching folders:", error);
        return;
      }
      setFolders(data || []);
      if (data && data.length > 0 && !selectedFolderId) {
        setSelectedFolderId(data[0].id);
      }
    } finally {
      setIsLoadingFolders(false);
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
      
      if (error) {
        console.error("Error fetching assets:", error);
        return;
      }
      setAssets(data || []);
    } finally {
      setIsLoadingAssets(false);
    }
  };

  const handleCreateFolder = async () => {
    const folderName = window.prompt("Enter new folder name:");
    if (!folderName || !folderName.trim()) return;
    
    setIsCreatingFolder(true);
    try {
      const { data, error } = await supabase
        .from('image_folders')
        .insert([{ name: folderName.trim() }])
        .select()
        .single();
        
      if (error) throw error;
      
      setFolders(prev => [data, ...prev]);
      setSelectedFolderId(data.id);
    } catch (err: any) {
      alert("Error creating folder: " + err.message);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleDeleteFolder = async (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this folder and all its images?")) return;
    
    try {
      const { error } = await supabase.from('image_folders').delete().eq('id', folderId);
      if (error) throw error;
      
      setFolders(prev => prev.filter(f => f.id !== folderId));
      if (selectedFolderId === folderId) {
        setSelectedFolderId(null);
      }
    } catch (err: any) {
      alert("Error deleting folder: " + err.message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedFolderId) return;
    
    const file = files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${selectedFolderId}/${fileName}`;
    
    setIsUploading(true);
    try {
      // 1. Upload to Supabase Storage 'assets' bucket
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('assets')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });
        
      if (uploadError) throw uploadError;
      
      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(filePath);
      
      // 3. Save to database
      const { error: dbError, data: dbData } = await supabase
        .from('image_assets')
        .insert([{
          folder_id: selectedFolderId,
          file_name: file.name,
          file_url: publicUrl
        }])
        .select()
        .single();
        
      if (dbError) throw dbError;
      
      setAssets(prev => [dbData, ...prev]);
    } catch (err: any) {
      alert("Error uploading file: " + err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAsset = async (assetId: string, fileUrl: string) => {
    if (!window.confirm("Delete this image?")) return;
    
    try {
      // Delete from DB (which could technically trigger a DB trigger to delete from storage, but we'll do both manually if we want)
      const { error } = await supabase.from('image_assets').delete().eq('id', assetId);
      if (error) throw error;
      
      setAssets(prev => prev.filter(a => a.id !== assetId));
    } catch (err: any) {
      alert("Error deleting asset: " + err.message);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
      
      {/* LEFT PANE: FOLDERS */}
      <div className="w-64 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-zinc-50/50 dark:bg-zinc-900/30">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-sm font-bold text-zinc-800 dark:text-white uppercase font-mono flex items-center space-x-2">
            <FolderOpen className="w-4 h-4 text-emerald-600" />
            <span>Folders</span>
          </h2>
        </div>
        
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
          <button 
            onClick={handleCreateFolder}
            disabled={isCreatingFolder}
            className="w-full flex items-center justify-center space-x-2 p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200 transition-colors text-xs font-bold disabled:opacity-50"
          >
            {isCreatingFolder ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderPlus className="w-4 h-4" />}
            <span>Create New Folder</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoadingFolders ? (
            <div className="p-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-zinc-400" /></div>
          ) : folders.length === 0 ? (
            <p className="text-xs text-center text-zinc-500 py-4 font-mono">No folders created yet.</p>
          ) : (
            folders.map(folder => (
              <div 
                key={folder.id}
                onClick={() => setSelectedFolderId(folder.id)}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                  selectedFolderId === folder.id 
                    ? 'bg-emerald-100/50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200' 
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-2 overflow-hidden">
                  <Folder className={`w-4 h-4 shrink-0 ${selectedFolderId === folder.id ? 'text-emerald-600' : 'text-zinc-400'}`} />
                  <span className="text-xs font-semibold truncate">{folder.name}</span>
                </div>
                <button 
                  onClick={(e) => handleDeleteFolder(folder.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
                  title="Delete Folder"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANE: IMAGES */}
      <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 relative">
        {!selectedFolderId ? (
          <div className="flex-1 flex items-center justify-center flex-col text-zinc-400">
            <ImageIcon className="w-12 h-12 mb-3 opacity-20" />
            <p className="font-mono text-sm">Select a folder to view or upload images</p>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
              <h2 className="text-sm font-bold text-zinc-800 dark:text-white flex items-center space-x-2">
                <span>{folders.find(f => f.id === selectedFolderId)?.name || 'Folder'}</span>
                <span className="px-1.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-[10px] text-zinc-600 dark:text-zinc-400">
                  {assets.length} items
                </span>
              </h2>
              
              <div className="flex items-center space-x-3">
                <button onClick={() => fetchAssets(selectedFolderId)} className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500">
                  <RefreshCw className="w-4 h-4" />
                </button>
                <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm">
                  {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                  <span>Upload Image</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {isLoadingAssets ? (
                <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-zinc-400" /></div>
              ) : assets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-400 space-y-3 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl m-4 p-12">
                  <UploadCloud className="w-10 h-10 text-zinc-300 dark:text-zinc-700" />
                  <p className="text-sm font-mono text-center">No images in this folder.<br/>Click "Upload Image" to add one.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {assets.map(asset => (
                    <div key={asset.id} className="group relative bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm hover:border-emerald-500 transition-colors">
                      <div className="aspect-square bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                        <img src={asset.file_url} alt={asset.file_name} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                      
                      {/* Hover Overlay Actions */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                        <div className="flex justify-end">
                          <button 
                            onClick={() => handleDeleteAsset(asset.id, asset.file_url)}
                            className="p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-lg backdrop-blur-sm transition-colors"
                            title="Delete Image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button 
                          onClick={() => copyToClipboard(asset.file_url, asset.id)}
                          className={`w-full py-1.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 backdrop-blur-sm transition-colors ${
                            copiedId === asset.id 
                              ? 'bg-emerald-500 text-white' 
                              : 'bg-white/90 text-zinc-900 hover:bg-white'
                          }`}
                        >
                          {copiedId === asset.id ? (
                            <><CheckCircle className="w-3.5 h-3.5" /><span>Copied!</span></>
                          ) : (
                            <><Copy className="w-3.5 h-3.5" /><span>Copy URL</span></>
                          )}
                        </button>
                      </div>
                      
                      <div className="px-2 py-1.5 border-t border-zinc-200 dark:border-zinc-800">
                        <p className="text-[10px] font-mono truncate text-zinc-600 dark:text-zinc-400" title={asset.file_name}>
                          {asset.file_name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
