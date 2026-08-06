import React from 'react';

export interface RepositoryItem {
  id: string;
  title: string;
  subtitle: string;
  img: string;
  category: string;
  date: string;
  logo?: string;
  productName?: string;
}

export default function BannerMarquee() {
  const [bannerItems, setBannerItems] = React.useState<RepositoryItem[]>([]);

  React.useEffect(() => {
    Promise.all([
      fetch('/api/repository').then(res => res.json()),
      fetch('/api/admin/slider-settings').then(res => res.json())
    ])
    .then(([repoData, settingsData]) => {
      if (Array.isArray(repoData)) {
        const selectedIds = settingsData?.selectedIds || [];
        const maxItems = settingsData?.maxItems || 3;
        
        // Filter and limit items based on settings
        const activeItems = repoData
          .filter(item => selectedIds.includes(item.id))
          .slice(0, maxItems);
          
        setBannerItems(activeItems);
      }
    })
    .catch(err => console.error("Error fetching banner data:", err));
  }, []);

  if (bannerItems.length === 0) return null;

  // Duplicate twice so the CSS translateX(-50%) creates a seamless loop
  const items = [...bannerItems, ...bannerItems];

  const handleBannerClick = (item: RepositoryItem) => {
    window.history.pushState({}, "", "/repository?q=" + encodeURIComponent(item.title));
    window.dispatchEvent(new Event("popstate"));
  };

  return (
    <div className="w-full overflow-hidden bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 py-4 shadow-sm">
      <div className="flex w-max animate-marquee hover:pause">
        {items.map((item, idx) => (
          <div 
            key={`${item.id}-${idx}`} 
            onClick={() => handleBannerClick(item)}
            className="relative w-[400px] flex flex-col mx-4 rounded-xl overflow-hidden shadow-lg group cursor-pointer shrink-0 bg-black"
          >
            <div className="relative h-[225px] w-full overflow-hidden">
              <img onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                src={item.img} 
                alt={item.title} 
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-contain group-hover:scale-105 transition-transform duration-700" 
              />
              
              {/* No overlays - display image only */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
