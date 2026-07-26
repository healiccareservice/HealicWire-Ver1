import React, { useState, useEffect } from 'react';
import { Search, Share2, Download } from 'lucide-react';
import HealicLogo from './HealicLogo';

interface RepositoryItem {
  id: string;
  title: string;
  subtitle: string;
  img: string;
  category: string;
  date: string;
  logo?: string;
  productName?: string;
}

export default function RepositoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [items, setItems] = useState<RepositoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
      setSearchQuery(q);
    }

    fetch('/api/repository')
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then(data => {
        setItems(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching repository:", err);
        setLoading(false);
      });
  }, []);

  const categories = ['All', ...Array.from(new Set(items.map(item => item.category)))];

  // Sort by date (descending) and filter based on state
  const filteredItems = items
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter(item => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

  const captureCardSync = (id: string, item: any): Blob | null => {
    try {
      const imgElement = document.querySelector(`#card-${id} img`) as HTMLImageElement;
      if (!imgElement) return null;

      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 675; // 16:9
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Draw background image
      ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);

      // Draw gradient
      const gradient = ctx.createLinearGradient(0, canvas.height * 0.4, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, canvas.height * 0.4, canvas.width, canvas.height * 0.6);

      // Draw Logo Box
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.beginPath();
      ctx.roundRect(40, 40, 80, 80, 16);
      ctx.fill();
      
      // Draw Actual Healic Logo
      ctx.save();
      ctx.translate(40 + (80 - 120 * 0.5) / 2, 40 + (80 - 90 * 0.5) / 2);
      ctx.scale(0.5, 0.5);

      // Left Pillar
      ctx.fillStyle = '#041E42';
      ctx.beginPath();
      ctx.roundRect(8, 5, 17, 80, 3.5);
      ctx.fill();

      // Right Pillar
      ctx.fillStyle = '#149B9E';
      ctx.beginPath();
      ctx.roundRect(50, 5, 16, 80, 3.5);
      ctx.fill();

      // White stroke path
      const pathLine = new Path2D("M 8 60 C 8 46 16 38 28 38 L 68 38 L 72 48 L 78 12 L 85 68 L 90 38 L 112 38");
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke(pathLine);

      // Blue Heartbeat Line
      ctx.strokeStyle = '#0A60B3';
      ctx.lineWidth = 5;
      ctx.stroke(pathLine);

      ctx.restore();

      // Draw Title
      ctx.fillStyle = 'white';
      ctx.textAlign = 'left';
      ctx.font = 'bold 80px sans-serif';
      ctx.fillText(item.title, 40, canvas.height - 120);
      
      // Draw Subtitle
      ctx.font = '40px sans-serif';
      ctx.fillStyle = '#e4e4e7';
      ctx.fillText(item.subtitle, 40, canvas.height - 50);

      const dataUrl = canvas.toDataURL('image/png');
      const arr = dataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    } catch (err) {
      console.error('Synchronous capture failed:', err);
      return null;
    }
  };

  const handleShare = async (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    const blob = captureCardSync(item.id, item);
    if (!blob) return;

    const file = new File([blob], `${item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`, { type: 'image/png' });
    
    // Try native share first
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file]
        });
        return;
      } catch (err) {
        console.log('Share was cancelled or failed:', err);
      }
    }
    
    // Fallback: Copy to clipboard
    try {
      if (navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob
          })
        ]);
        alert('Image copied to clipboard! You can now paste (Ctrl+V or Cmd+V) into WhatsApp, LinkedIn, Twitter, or any social media.');
      } else {
        // Ultimate fallback
        triggerDownload(file);
      }
    } catch (err) {
      console.error('Clipboard write failed', err);
      triggerDownload(file);
    }
  };

  const handleDownload = async (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    const blob = captureCardSync(item.id, item);
    if (!blob) return;
    const file = new File([blob], `${item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`, { type: 'image/png' });
    triggerDownload(file);
  };

  const triggerDownload = (file: File) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-serif text-slate-900 dark:text-white">
            Public Repository
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Browse our comprehensive collection of healthcare banners, events, and highlights.
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search keywords, brands, or events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all text-slate-900 dark:text-white"
            />
          </div>
          <div className="w-full md:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all text-slate-900 dark:text-white"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(item => (
              <div 
                key={item.id} 
                id={`card-${item.id}`}
                className="relative aspect-video rounded-xl overflow-hidden shadow-lg group bg-black"
              >
                <img 
                  src={item.img} 
                  alt={item.title} 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                
                <div className="absolute top-4 left-4 w-10 h-10 bg-white/95 rounded-lg shadow-md flex items-center justify-center p-1.5 z-10 border border-white/20 pointer-events-none">
                  {item.logo ? (
                    <img src={item.logo} alt="Logo" className="w-full h-full object-contain rounded-md" />
                  ) : (
                    <HealicLogo className="w-full h-full" />
                  )}
                </div>
                
                <div 
                  id={`actions-${item.id}`}
                  className="absolute top-4 right-4 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20"
                >
                  <button 
                    onClick={(e) => handleDownload(e, item)}
                    className="p-2 bg-white/95 hover:bg-white text-zinc-900 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95"
                    title="Download Image"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => handleShare(e, item)}
                    className="p-2 bg-teal-600/95 hover:bg-teal-600 text-white rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95"
                    title="Share to Social Media"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="absolute inset-0 flex flex-col justify-end p-5 pointer-events-none">
                  <h3 className="text-white font-bold font-sans tracking-wide text-lg leading-tight drop-shadow-lg mb-1.5 line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-zinc-200 text-sm font-sans leading-snug line-clamp-2 drop-shadow-md">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-zinc-800 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No results found</h3>
            <p className="text-slate-500 dark:text-slate-400">
              Try adjusting your search query or category filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
