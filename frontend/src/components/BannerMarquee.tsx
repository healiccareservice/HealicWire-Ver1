import React from 'react';
import HealicLogo from './HealicLogo';

import { bannerItems } from '../data/bannerData';

export default function BannerMarquee() {
  // Duplicate twice so the CSS translateX(-50%) creates a seamless loop
  const items = [...bannerItems, ...bannerItems];

  const handleBannerClick = (item: typeof bannerItems[0]) => {
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
            className="relative w-[400px] h-[225px] mx-4 rounded-xl overflow-hidden shadow-lg group cursor-pointer shrink-0"
          >
            <img 
              src={item.img} 
              alt={item.title} 
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            {/* Logo in the top-left corner */}
            <div className="absolute top-4 left-4 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-lg shadow-md flex items-center justify-center p-1.5 z-10 border border-white/20">
              <HealicLogo className="w-full h-full" />
            </div>
            <div className="absolute inset-0 flex flex-col justify-end p-5">
              <h3 className="text-white font-bold font-sans tracking-wide text-base leading-tight drop-shadow-lg mb-1.5 line-clamp-1">
                {item.title}
              </h3>
              <p className="text-zinc-200 text-xs font-sans leading-snug line-clamp-2 drop-shadow-md">
                {item.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
