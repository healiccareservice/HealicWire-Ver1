export interface BannerItem {
  id: number;
  title: string;
  subtitle: string;
  img: string;
  category: string;
  date: string;
}

export const bannerItems: BannerItem[] = [
  { 
    id: 1, 
    title: 'Global Cardio Summit 2026', 
    subtitle: 'Join leading experts for breakthroughs in cardiovascular care.',
    img: '/marquee/scientific_events.png',
    category: 'Event',
    date: '2026-08-15'
  },
  { 
    id: 2, 
    title: 'World Health Organization', 
    subtitle: 'World Mental Health Day - October 10th',
    img: '/marquee/health_days.png',
    category: 'Brand',
    date: '2026-08-10'
  },
  { 
    id: 3, 
    title: 'Apollo Hospitals', 
    subtitle: 'Experience state-of-the-art robotic surgery for precision care.',
    img: '/marquee/hospital_ads.png',
    category: 'Hospital',
    date: '2026-08-05'
  },
  { 
    id: 4, 
    title: 'HealicWire Wellness', 
    subtitle: 'Manage hypertension effectively with low-sodium diets and daily walks.',
    img: '/marquee/health_tips.png',
    category: 'Brand',
    date: '2026-08-01'
  },
  { 
    id: 5, 
    title: 'Ministry of Health & Family Welfare', 
    subtitle: 'Updated guidelines released for seasonal influenza vaccination.',
    img: '/marquee/health_info.png',
    category: 'Brand',
    date: '2026-07-25'
  }
];
