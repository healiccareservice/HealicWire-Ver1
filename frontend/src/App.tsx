/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, useState, useEffect, useRef } from "react";
import { Sparkles, Activity, ShieldAlert, BookOpen, Search, User, SlidersHorizontal, Eye, Star, Heart, FileText, CheckCircle, Mail, HelpCircle, Landmark, Bell, AlertTriangle, UserCheck, ChevronRight, ChevronDown, Clock, ChevronLeft } from "lucide-react";
import HealicLogo from "./components/HealicLogo";
import Header from "./components/Header";
import ArticleCard from "./components/ArticleCard";
import ArticleDetail from "./components/ArticleDetail";
import LivingGuidelines from "./components/LivingGuidelines";
import HospitalIntelligence from "./components/HospitalIntelligence";
import AdminCMS from "./components/AdminCMS";
import ProposalPortal from "./components/ProposalPortal";
import ScientificEvents from "./components/ScientificEvents";
import ScientificEventPage from "./components/ScientificEventPage";
import PortalPage from "./components/PortalPage";
import EditorialsPage from "./components/EditorialsPage";
import ClinicalInsightsPage from "./components/ClinicalInsightsPage";
import WhatWeDoSlider from "./components/WhatWeDoSlider";
import Login from "./components/Login";
import EditorialCMS from "./components/EditorialCMS";
import ClinicalInsightsCMS from "./components/ClinicalInsightsCMS";
import ProvidersPage from "./components/ProvidersPage";
import BannerMarquee from "./components/BannerMarquee";
import RepositoryPage from "./components/RepositoryPage";
import { supabase, mapArticleFromDB, mapAlertFromDB } from "./lib/supabase";
import { Article, HospitalAlert, ImpactSeverity } from "./types";

interface ErrorBoundaryProps { children: React.ReactNode; }
interface ErrorBoundaryState { hasError: boolean; error: any; }

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare state: ErrorBoundaryState;
  declare props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  render() { 
    if (this.state.hasError) return <div style={{padding: '50px', background: 'red', color: 'white', zIndex: 9999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0}}><h1>ERROR!</h1><pre>{this.state.error?.stack || this.state.error?.toString()}</pre></div>; 
    return this.props.children; 
  }
}

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [showAdmin, setShowAdmin] = useState(() => {
    return window.location.pathname.startsWith("/contrl-panl") || window.location.pathname.startsWith("/admin");
  });
  const [showEditorialAccess, setShowEditorialAccess] = useState(() => {
    return window.location.pathname.startsWith("/editorialsaccess");
  });
  const [showClinicalInsightsAccess, setShowClinicalInsightsAccess] = useState(() => {
    return window.location.pathname.startsWith("/clinicalinsightsaccess");
  });
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      setCurrentPath(path);
      if (path.startsWith("/contrl-panl") || path.startsWith("/admin")) {
        setShowAdmin(true);
      } else {
        setShowAdmin(false);
      }
      
      if (path.startsWith("/editorialsaccess")) {
        setShowEditorialAccess(true);
      } else {
        setShowEditorialAccess(false);
      }

      if (path.startsWith("/clinicalinsightsaccess")) {
        setShowClinicalInsightsAccess(true);
      } else {
        setShowClinicalInsightsAccess(false);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const openAdmin = () => {
    window.history.pushState({}, "", "/contrl-panl");
    setCurrentPath("/contrl-panl");
    setShowAdmin(true);
  };

  const closeAdmin = () => {
    window.history.pushState({}, "", "/");
    setCurrentPath("/");
    setShowAdmin(false);
    fetchArticles();
  };

  const closeEditorialAccess = () => {
    window.history.pushState({}, "", "/");
    setCurrentPath("/");
    setShowEditorialAccess(false);
    fetchArticles();
  };

  const closeClinicalInsightsAccess = () => {
    window.history.pushState({}, "", "/");
    setCurrentPath("/");
    setShowClinicalInsightsAccess(false);
    fetchArticles();
  };

  
  let currentTab = "news";
  let eventPageSlug: string | null = null;
  let portalPageSlug: string | null = null;
  let portalPageSection: string | null = null;

  if (currentPath.startsWith("/treatmentupdate")) {
    currentTab = "treatment-updates";
    if (currentPath.startsWith("/treatmentupdate/")) {
      const sub = currentPath.replace("/treatmentupdate/", "").split("/")[0].trim();
      if (sub) { portalPageSection = "treatment-updates"; portalPageSlug = sub; }
    }
  } else if (currentPath.startsWith("/scientificevents")) {
    currentTab = "events";
    if (currentPath.startsWith("/scientificevents/")) {
      const sub = currentPath.replace("/scientificevents/", "").split("/")[0].trim();
      if (sub) eventPageSlug = sub;
    }
  } else if (currentPath.startsWith("/editorials")) {
    currentTab = "editorials";
  } else if (currentPath.startsWith("/clinicalinsights")) {
    currentTab = "clinical-insights";
  } else if (currentPath.startsWith("/guidelines")) {
    currentTab = "guidelines";
    if (currentPath.startsWith("/guidelines/")) {
      const sub = currentPath.replace("/guidelines/", "").split("/")[0].trim();
      if (sub) { portalPageSection = "guidelines"; portalPageSlug = sub; }
    }
  } else if (currentPath.startsWith("/pharmadrugs")) {
    currentTab = "pharma-drugs";
    if (currentPath.startsWith("/pharmadrugs/")) {
      const sub = currentPath.replace("/pharmadrugs/", "").split("/")[0].trim();
      if (sub) { portalPageSection = "pharma-drugs"; portalPageSlug = sub; }
    }
  } else if (currentPath.startsWith("/alerts")) {
    currentTab = "alerts";
    if (currentPath.startsWith("/alerts/")) {
      const sub = currentPath.replace("/alerts/", "").split("/")[0].trim();
      if (sub) { portalPageSection = "alerts"; portalPageSlug = sub; }
    }
  } else if (currentPath.startsWith("/pages/")) {
    currentTab = "pages";
    const sub = currentPath.replace("/pages/", "").split("/")[0].trim();
    if (sub) { portalPageSection = "pages"; portalPageSlug = sub; }
  } else if (currentPath.startsWith("/proposal")) {
    currentTab = "proposal";
  } else if (currentPath.startsWith("/providers")) {
    currentTab = "providers";
  } else if (currentPath.startsWith("/repository")) {
    currentTab = "repository";
  }

  const setCurrentTab = (tab: string) => {
    let newPath = "/";
    if (tab === "treatment-updates") newPath = "/treatmentupdate";
    else if (tab === "events") newPath = "/scientificevents";
    else if (tab === "editorials") newPath = "/editorials";
    else if (tab === "clinical-insights") newPath = "/clinicalinsights";
    else if (tab === "guidelines") newPath = "/guidelines";
    else if (tab === "pharma-drugs") newPath = "/pharmadrugs";
    else if (tab === "alerts") newPath = "/alerts";
    else if (tab === "proposal") newPath = "/proposal";
    else if (tab === "providers") newPath = "/providers";
    else if (tab === "repository") newPath = "/repository";
    
    window.history.pushState({}, "", newPath);
    setCurrentPath(newPath);
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"comfortable" | "compact">("comfortable");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Paginated News State (20 articles per page click)
  const [visibleCount, setVisibleCount] = useState(20);

  useEffect(() => {
    setVisibleCount(20);
  }, [searchQuery, currentPath]);

  // Core data states
  const [articles, setArticles] = useState<Article[]>([]);
  const [alerts, setAlerts] = useState<HospitalAlert[]>([]);
  
  const clinicalInsightsScrollRef = useRef<HTMLDivElement>(null);
  const scrollClinicalInsights = (direction: 'left' | 'right') => {
    if (clinicalInsightsScrollRef.current) {
      const scrollAmount = window.innerWidth < 640 ? 300 : 380;
      clinicalInsightsScrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };
  const [latestEditorial, setLatestEditorial] = useState<Article | null>(null);
  const [latestEditorialProfile, setLatestEditorialProfile] = useState<any | null>(null);
  const [clinicalInsights, setClinicalInsights] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // Interface overlays
  const [showPolicies, setShowPolicies] = useState<"about" | "editorial" | "disclaimer" | null>(null);

  // Local persistence states
  const [savedArticleIds, setSavedArticleIds] = useState<string[]>([]);

  // Newsletter form
  const [newsEmail, setNewsEmail] = useState("");
  const [newsSpecialty, setNewsSpecialty] = useState("General Medicine");
  const [newsFrequency, setNewsFrequency] = useState<"daily" | "weekly">("weekly");
  const [newsSuccess, setNewsSuccess] = useState<string | null>(null);

  // Load theme & saved articles on mount
  useEffect(() => {
    // Force Light theme as requested
    setTheme("light");
    document.documentElement.classList.remove("dark");
    try {
      localStorage.setItem("healic_theme", "light");
    } catch (e) {
      console.warn("localStorage full, couldn't save theme", e);
    }

    try {
      const savedIds = localStorage.getItem("healic_saved_ids");
      if (savedIds) {
        setSavedArticleIds(JSON.parse(savedIds));
      }
    } catch (e) {
      console.warn("localStorage read failed", e);
    }

    try {
      const savedMode = localStorage.getItem("healic_view_mode") as "comfortable" | "compact";
      if (savedMode) {
        setViewMode(savedMode);
      }
    } catch (e) { console.warn("localStorage view mode read failed", e); }

    fetchArticles();
    fetchAlerts();
    fetchLatestEditorial();
    fetchClinicalInsights();
  }, []);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setArticles(data.map(mapArticleFromDB));
      }
    } catch (err) {
      console.error("Failed to fetch articles:", err);
    }
  };

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('hospital_alerts')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      if (data) {
        setAlerts(data.map(mapAlertFromDB));
      }
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
    }
  };

  const fetchLatestEditorial = async () => {
    try {
      const { data, error } = await supabase
        .from('editorials')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let finalData = data;
      if (!data) {
        console.warn("Editorials table missing or empty, falling back to articles table for latest editorial");
        const { data: artData, error: artError } = await supabase
          .from('articles')
          .select('*')
          .eq('category', 'Editorial')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (!artError) {
          finalData = artData;
        }
      }

      if (finalData) {
        const mappedEditorial = mapArticleFromDB(finalData);
        setLatestEditorial(mappedEditorial);
        
        if (mappedEditorial.sourceName) {
          // Fetch the profile corresponding to this editorial's author via API to bypass RLS
          try {
            const profilesRes = await fetch('/api/profiles');
            if (profilesRes.ok) {
              const profilesData = await profilesRes.json();
              const profData = profilesData.find((p: any) => 
                p.name === mappedEditorial.sourceName || p.email === mappedEditorial.sourceName
              );
              setLatestEditorialProfile(profData || null);
            } else {
              setLatestEditorialProfile(null);
            }
          } catch (e) {
            console.error("Failed to fetch profile for latest editorial", e);
            setLatestEditorialProfile(null);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch latest editorial:", err);
    }
  };

  const fetchClinicalInsights = async () => {
    try {
      const { data, error } = await supabase
        .from('clinical_insights')
        .select('*')
        .order('created_at', { ascending: false });

      let finalData = data;
      if (!data || data.length === 0) {
        console.warn("Clinical insights table missing or empty, falling back to articles table");
        const { data: artData } = await supabase
          .from('articles')
          .select('*')
          .eq('category', 'Clinical Insights')
          .eq('status', 'published')
          .order('created_at', { ascending: false });
        finalData = artData;
      }

      if (finalData && finalData.length > 0) {
        const authorsMap: Record<string, any> = {
          "Advances in Continuous Glucose Monitoring (CGM) for Type 2 Diabetes Management": { name: 'Dr. Priya Nair', qual: 'MBBS, MD (General Medicine), DM (Endocrinology)', title: 'Consultant Endocrinologist & Diabetologist', image: 'https://randomuser.me/api/portraits/women/44.jpg' },
          "Redefining HFpEF Management: From Diagnostic Dilemmas to Targeted Phenotype-Driven Pharmacotherapy": { name: 'Dr. Arjun Sharma', qual: 'MBBS, MD (General Medicine), DM (Cardiology)', title: 'Consultant Cardiologist', image: 'https://randomuser.me/api/portraits/men/32.jpg' },
          "Optimizing Disease-Modifying Therapy in Early-Stage Alzheimer's Disease: Biomarker Protocols, Amyloid-Related Imaging Abnormalities (ARIA), and Practical Management Algorithms": { name: 'Dr. Rahul Mehta', qual: 'MBBS, MD (General Medicine), DM (Neurology)', title: 'Consultant Neurologist', image: 'https://randomuser.me/api/portraits/men/45.jpg' },
          "SGLT2 Inhibitors and Non-Diabetic Chronic Kidney Disease: Redefining Renal Protection and Clinical Pathways": { name: 'Dr. Sneha Iyer', qual: 'MBBS, MD (General Medicine), DM (Nephrology)', title: 'Consultant Nephrologist', image: 'https://randomuser.me/api/portraits/women/68.jpg' },
          "Paradigm Shift in MASH Management: Integrating Targeted Pharmacotherapy and Incretin Agonists into Gastroenterology Practice": { name: 'Dr. Vikram Reddy', qual: 'MBBS, MD (General Medicine), DM (Gastroenterology)', title: 'Consultant Gastroenterologist', image: 'https://randomuser.me/api/portraits/men/22.jpg' },
          "Redefining the HER2 Paradigm: Clinical Insights into Antibody-Drug Conjugates for HER2-Low Metastatic Breast Cancer": { name: 'Dr. Ananya Banerjee', qual: 'MBBS, MD (General Medicine), DM (Medical Oncology)', title: 'Consultant Medical Oncologist', image: 'https://randomuser.me/api/portraits/women/33.jpg' },
          "Navigating Relapsed/Refractory Multiple Myeloma: The Paradigm Shift Towards Bispecific T-Cell Engagers and CAR-T Therapies": { name: 'Dr. Karthik Rao', qual: 'MBBS, MD (General Medicine), DM (Clinical Hematology)', title: 'Consultant Hematologist', image: 'https://randomuser.me/api/portraits/men/55.jpg' },
          "Resetting the Autoreactive Immune Memory: CD19-Targeted CAR-T Cell Therapy and B-Cell Depletion Paradigms in Refractory Systemic Lupus Erythematosus": { name: 'Dr. Meera Joshi', qual: 'MBBS, MD (General Medicine), DM (Clinical Immunology & Rheumatology)', title: 'Consultant Rheumatologist', image: 'https://randomuser.me/api/portraits/women/29.jpg' },
          "Navigating Phenotypic Heterogeneity in Severe Refractory Asthma: Precision Biologic Selection and Biomarker Integration": { name: 'Dr. Sandeep Kulkarni', qual: 'MBBS, MD (General Medicine), DM (Pulmonary, Critical Care & Sleep Medicine)', title: 'Consultant Pulmonologist', image: 'https://randomuser.me/api/portraits/men/66.jpg' },
          "First-Line Whole Genome Sequencing in Undiagnosed Genetic Disorders: Shifting the Paradigm from Diagnostic Odysseys to Precision Medicine": { name: 'Dr. Ritu Verma', qual: 'MBBS, MD (General Medicine), DM (Medical Genetics)', title: 'Consultant Medical Geneticist', image: 'https://randomuser.me/api/portraits/women/12.jpg' },
          "Paradigm Shift in Endourology: Thulium Fiber Laser versus Holmium:YAG Laser in Urolithiasis and BPH Management": { name: 'Dr. Nikhil Desai', qual: 'MBBS, MS (General Surgery), MCh (Urology)', title: 'Consultant Urologist', image: 'https://randomuser.me/api/portraits/men/17.jpg' },
          "Awake Craniotomy and Intraoperative Functional Mapping: Balancing Oncological Resection with Functional Preservation in Eloquent Cortex Gliomas": { name: 'Dr. Pooja Kapoor', qual: 'MBBS, MS (General Surgery), MCh (Neurosurgery)', title: 'Consultant Neurosurgeon', image: 'https://randomuser.me/api/portraits/women/55.jpg' },
          "Evolving Paradigms in Mitral Valve Repair: Minimally Invasive Thoracoscopic vs. Conventional Median Sternotomy Approaches": { name: 'Dr. Ajay Menon', qual: 'MBBS, MS (General Surgery), MCh (Cardiothoracic & Vascular Surgery)', title: 'Consultant Cardiothoracic Surgeon', image: 'https://randomuser.me/api/portraits/men/19.jpg' },
          "Navigating Organ Preservation in Locally Advanced Rectal Cancer: A Surgical Oncologist’s Perspective on Total Neoadjuvant Therapy and the Watch-and-Wait Protocol": { name: 'Dr. Kavita Patil', qual: 'MBBS, MS (General Surgery), MCh (Surgical Oncology)', title: 'Consultant Surgical Oncologist', image: 'https://randomuser.me/api/portraits/women/22.jpg' },
          "Targeted Muscle Reinnervation (TMR) and Regenerative Peripheral Nerve Interfaces (RPNI): Paradigm Shifts in Neuroma Prevention and Amputee Rehabilitation": { name: 'Dr. Rohit Chandra', qual: 'MBBS, MS (General Surgery), MCh (Plastic & Reconstructive Surgery)', title: 'Consultant Plastic & Reconstructive Surgeon', image: 'https://randomuser.me/api/portraits/men/12.jpg' },
          "Navigating the Paradigm Shift in Pediatric Developmental and Epileptic Encephalopathies: From Anti-Seizure Medications to Precision Disease-Modifying Therapies": { name: 'Dr. Neha Gupta', qual: 'MBBS, MD (Pediatrics), DM (Pediatric Neurology)', title: 'Consultant Pediatric Neurologist', image: 'https://randomuser.me/api/portraits/women/61.jpg' },
          "Navigating Carbapenem-Resistant Enterobacterales (CRE) Infections: Newer Beta-Lactam/Beta-Lactamase Inhibitor Combinations and Stewardship Strategies": { name: 'Dr. Harish Bhat', qual: 'MBBS, MD (General Medicine), DM (Infectious Diseases)', title: 'Consultant Infectious Disease Specialist', image: 'https://randomuser.me/api/portraits/men/77.jpg' },
          "Navigating DOAC Dosing Dilemmas in Extreme Obesity and End-Stage Kidney Disease: A Pharmacokinetic and Pharmacodynamic Paradigm Shift": { name: 'Dr. Shalini Krishnan', qual: 'MBBS, MD (General Medicine), DM (Clinical Pharmacology)', title: 'Consultant Clinical Pharmacologist', image: 'https://randomuser.me/api/portraits/women/88.jpg' },
          "Navigating Heterogeneity in Septic Shock: Phenotype-Driven Resuscitation and Hemodynamic Tailoring in the Modern ICU": { name: 'Dr. Vivek Agarwal', qual: 'MBBS, MD (General Medicine), DM (Critical Care Medicine)', title: 'Consultant Intensivist & Critical Care Specialist', image: 'https://randomuser.me/api/portraits/men/91.jpg' },
          "Genicular Artery Embolization (GAE) in Knee Osteoarthritis: Clinical Efficacy, Technical Nuances, and Practice Takeaways": { name: 'Dr. Aditi Singh', qual: 'MBBS, MD (Radiodiagnosis), Fellowship in Interventional Radiology', title: 'Consultant Interventional Radiologist', image: 'https://randomuser.me/api/portraits/women/90.jpg' }
        };

        const mappedInsights = finalData.map((insightData: any) => {
          const headline = insightData.article_title || insightData.headline;
          const mappedAuthor = authorsMap[headline];

          return {
            id: insightData.id,
            slug: insightData.id,
            headline: headline,
            summary30s: insightData.recent_clinical_update || insightData.summary30s,
            bodyAnalysis: insightData.detailed_article ? `${insightData.detailed_article}\n\n### Why This Matters\n${insightData.why_this_matters}\n\n### Clinical Pearls\n${insightData.clinical_pearls}\n\n### Future Directions\n${insightData.future_directions}\n\n### Evidence Summary\n${insightData.evidence_summary}\n\n### References\n${insightData.references}` : insightData.bodyAnalysis,
            category: 'Clinical Insights',
            publishedAt: insightData.created_at || insightData.published_at || new Date().toISOString(),
            status: 'published',
            sourceName: 'HealicWire Experts Board',
            author_name: mappedAuthor ? mappedAuthor.name : insightData.author_name,
            author_qualifications: mappedAuthor ? mappedAuthor.qual : insightData.author_qualifications,
            author_title: mappedAuthor ? mappedAuthor.title : insightData.author_title,
            author_image: mappedAuthor ? mappedAuthor.image : "https://randomuser.me/api/portraits/women/44.jpg"
          } as Article & { author_image?: string };
        });

        setClinicalInsights(mappedInsights);
      }
    } catch (err) {
      console.error("Failed to fetch clinical insights:", err);
    }
  };

  const handleRefreshArticleDetail = async () => {
    if (!selectedArticle) return;
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', selectedArticle.id)
        .single();

      if (error) throw error;
      if (data) {
        setSelectedArticle(mapArticleFromDB(data));
        fetchArticles();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("healic_theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleToggleSave = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    let newSaved = [...savedArticleIds];
    if (newSaved.includes(id)) {
      newSaved = newSaved.filter(savedId => savedId !== id);
    } else {
      newSaved.push(id);
    }
    setSavedArticleIds(newSaved);
    localStorage.setItem("healic_saved_ids", JSON.stringify(newSaved));
  };

  const handleToggleViewMode = () => {
    const newMode = viewMode === "comfortable" ? "compact" : "comfortable";
    setViewMode(newMode);
    localStorage.setItem("healic_view_mode", newMode);
  };

  // Newsletter signup submission
  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsEmail) return;

    fetch("/api/newsletter/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newsEmail, specialty: newsSpecialty, frequency: newsFrequency })
    })
      .then(res => res.json())
      .then(data => {
        setNewsSuccess(data.message || "Subscribed successfully!");
        setNewsEmail("");
        setTimeout(() => {
          setNewsSuccess(null);
        }, 3000);
      })
      .catch(err => console.error(err));
  };

  // Core filtering logic for search
  let filteredArticles = articles.filter(a => 
    a.sourceName !== "HealicWire Special Page Engine" && 
    !(a as any).isPortalPage &&
    !a.headline.startsWith("Scientific Events:") &&
    !a.headline.startsWith("Treatment Update:")
  );

  // Advanced search prefixes (e.g. category:Clinical, region:india, saved:true)
  const isQueryPrefix = searchQuery.trim().startsWith("category:");
  const isRegionPrefix = searchQuery.trim().startsWith("region:");
  
  if (isQueryPrefix) {
    const cat = searchQuery.split(":")[1].trim().toLowerCase();
    filteredArticles = filteredArticles.filter(a => a.category.toLowerCase() === cat);
  } else if (isRegionPrefix) {
    const reg = searchQuery.split(":")[1].trim().toLowerCase();
    filteredArticles = filteredArticles.filter(a => a.region.toLowerCase() === reg);
  } else if (searchQuery.trim().toLowerCase() === "saved:true") {
    filteredArticles = filteredArticles.filter(a => savedArticleIds.includes(a.id));
  } else if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredArticles = filteredArticles.filter(
      a =>
        a.headline.toLowerCase().includes(q) ||
        a.subhead.toLowerCase().includes(q) ||
        a.bodyAnalysis.toLowerCase().includes(q) ||
        a.specialties.some(s => s.toLowerCase().includes(q))
    );
  }

  // Find critical/urgent alert to show in Alert Strip
  const criticalAlert = alerts.find(a => a.severity === ImpactSeverity.CRITICAL);

  // Separate Lead story (newest Clinical/Research article) from grid
  const leadStory = filteredArticles.length > 0 ? filteredArticles[0] : null;
  const feedStories = leadStory ? filteredArticles.slice(1) : [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-150 flex flex-col font-sans transition-colors duration-200 selection:bg-teal-700/10 selection:text-teal-900">
      {/* Dynamic Sticky Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          setSelectedArticle(null);
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenAdmin={openAdmin}
        alertCount={alerts.filter(a => a.severity === ImpactSeverity.CRITICAL || a.severity === ImpactSeverity.URGENT).length}
      />

      {/* CRITICAL ALERTS TICKER BAR */}
      {criticalAlert && (
        <div className="bg-red-600 dark:bg-red-950 border-b border-red-700 dark:border-red-900 text-white py-1.5 px-3 sm:px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 text-xs font-semibold">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-red-100 animate-pulse" />
              <span className="font-mono uppercase tracking-wider text-[9px] bg-red-700 dark:bg-red-900 px-1.5 py-0.5 rounded font-bold shrink-0">
                Critical Alert
              </span>
              <p className="text-red-50 dark:text-red-200 text-[11px] sm:text-xs truncate font-medium">
                {criticalAlert.headline}
              </p>
            </div>
            <button
              onClick={() => setCurrentTab("alerts")}
              className="px-2.5 py-0.5 rounded bg-white/15 hover:bg-white/25 text-white border border-white/25 text-[10px] font-mono shrink-0 uppercase tracking-wider font-bold transition-all"
            >
              Action Protocol
            </button>
          </div>
        </div>
      )}

      {/* BANNER MARQUEE (Global Display) */}
      <BannerMarquee />

      {/* MAIN CONTENT PORT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {selectedArticle ? (
          /* Render Detailed Article page */
          <ArticleDetail
            article={selectedArticle}
            onBack={() => setSelectedArticle(null)}
            isSaved={savedArticleIds.includes(selectedArticle.id)}
            onToggleSave={handleToggleSave}
            onRefreshArticle={handleRefreshArticleDetail}
          />
        ) : portalPageSlug && portalPageSection ? (
          /* Render Generated Portal / Specialty Page */
          <PortalPage 
            section={portalPageSection} 
            slug={portalPageSlug} 
            onBack={() => setCurrentTab(portalPageSection === "pages" ? "news" : portalPageSection)} 
          />
        ) : currentTab === "editorials" ? (
          /* Render Editorials Page */
          <EditorialsPage onSelectArticle={setSelectedArticle} />
        ) : currentTab === "clinical-insights" ? (
          /* Render Clinical Insights Page */
          <ClinicalInsightsPage onSelectArticle={setSelectedArticle} />
        ) : currentTab === "guidelines" ? (
          /* Render Current Guidelines */
          <LivingGuidelines />
        ) : currentTab === "pharma-drugs" ? (
          /* Render Pharma and Drugs Intelligence */
          <LivingGuidelines 
            title="Pharma & Drugs Intelligence" 
            subtitle="CDSCO drug advisories, FDA safety warnings, bioequivalence parameters, and novel therapeutic molecule approvals." 
          />
        ) : currentTab === "alerts" ? (
          /* Render Hospital Alerts */
          <HospitalIntelligence />
        ) : currentTab === "treatment-updates" ? (
          /* Render Clinical Treatment Updates */
          <LivingGuidelines 
            title="Clinical Treatment Updates" 
            subtitle="Real-time clinical protocols, dosage changes, and therapeutic advancements for evidence-based patient care." 
          />
        ) : currentTab === "events" ? (
          /* Render Scientific Events or Specific Event Page */
          eventPageSlug ? (
            <ScientificEventPage slug={eventPageSlug} onBack={() => setCurrentTab("events")} />
          ) : (
            <ErrorBoundary><ScientificEvents /></ErrorBoundary>
          )
        ) : currentTab === "proposal" ? (
          /* Render Strategic Blueprint Proposal */
          <ProposalPortal />
        ) : currentTab === "providers" ? (
          /* Render Providers Page */
          <ProvidersPage onSelectArticle={setSelectedArticle} />
        ) : currentTab === "repository" ? (
          /* Render Repository Page */
          <RepositoryPage />
        ) : (
          /* Render Interactive News Feed (Comfortable/Compact layouts) */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Feed area (Left 2 columns) */}
            <div className="lg:col-span-2 space-y-6 sm:space-y-8">
              
              {/* Header Toggles */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-850">
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-zinc-900 dark:text-white uppercase font-mono">
                    {searchQuery ? "Search Outcomes" : "Global Healthcare News & Intel"}
                  </h2>
                </div>

                <div className="flex items-center space-x-2 sm:space-x-3 text-xs font-mono">
                  {/* View Saved Articles Toggle */}
                  <button
                    onClick={() => setSearchQuery(searchQuery === "saved:true" ? "" : "saved:true")}
                    className={`px-3 py-1 rounded-full border transition-all text-xs ${
                      searchQuery === "saved:true"
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-600 font-bold"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-200"
                    }`}
                  >
                    Saved Offline ({savedArticleIds.length})
                  </button>

                  <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800" />

                  {/* View Mode Switcher */}
                  <button
                    onClick={handleToggleViewMode}
                    className="flex items-center space-x-1 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 text-xs"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span className="capitalize">{viewMode} Mode</span>
                  </button>
                </div>
              </div>

              {/* Empty state */}
              {filteredArticles.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950">
                  <SlidersHorizontal className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-3 animate-pulse" />
                  <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">No Intelligence Reports Match Query</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">Clear filters or try searching another clinical keyword.</p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mt-4 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* 1. Comfortable/Compact View Rendering */}
                  {viewMode === "comfortable" ? (
                    <div className="space-y-6">
                      {/* Lead Story Featured layout */}
                      {leadStory && !searchQuery && (
                        <div
                          id={`lead-story-${leadStory.id}`}
                          onClick={() => setSelectedArticle(leadStory)}
                          className="group relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950 shadow-sm hover:shadow-md hover:border-teal-500/30 transition-all duration-200 cursor-pointer grid grid-cols-1 md:grid-cols-2"
                        >
                          <div className="aspect-[16/10] md:aspect-auto relative w-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-900">
                            <img src={leadStory.imageUrl} alt={leadStory.headline} referrerPolicy="no-referrer" className="object-cover w-full h-full group-hover:scale-102 transition-transform duration-300" />
                            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                              <span className="text-[9.5px] font-mono font-semibold px-2 py-0.5 rounded bg-teal-600 text-white shadow-sm uppercase tracking-wider">
                                Featured Lead Intel
                              </span>
                            </div>
                          </div>
                          <div className="p-6 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center space-x-2 text-[10px] font-mono text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-2.5">
                                <span>{leadStory.category}</span>
                                <span>•</span>
                                <span>{new Date(leadStory.publishedAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>
                              </div>
                              <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors mb-2 line-clamp-3">
                                {leadStory.headline}
                              </h3>
                              <p className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed line-clamp-4 font-sans font-medium mb-4">
                                {leadStory.summary30s}
                              </p>
                            </div>
                            <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-900 pt-3 text-[10.5px] font-mono text-zinc-400">
                              <span>Source: <strong>{leadStory.sourceName}</strong></span>
                              <span className="shrink-0">{leadStory.readingTimeMinutes}m read</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* MOBILE INTELLIGENCE BRIEFING WIDGET (Visible only on mobile/tablet screens < lg) */}
                      <div className="lg:hidden space-y-4 my-4">
                        {/* TODAY'S CLINICAL BRIEFING - MOBILE */}
                        <div className="bg-gradient-to-r from-teal-500/5 via-white to-teal-500/5 dark:from-teal-950/30 dark:via-zinc-950 dark:to-teal-950/30 p-4 rounded-xl border border-teal-500/20 dark:border-teal-500/30 shadow-xs space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-teal-500/10 dark:border-teal-500/20">
                            <div className="flex items-center space-x-2">
                              <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
                                Today&apos;s Clinical Briefing
                              </h3>
                            </div>
                            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-teal-600 text-white">
                              EXPRESS INTEL
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {articles.slice(0, 3).map((art, idx) => (
                              <div
                                key={art.id}
                                onClick={() => setSelectedArticle(art)}
                                className="group cursor-pointer bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60 hover:border-teal-500 transition-all"
                              >
                                <div className="text-[8.5px] font-mono text-teal-600 dark:text-teal-400 font-bold uppercase mb-1">
                                  Brief {idx + 1}
                                </div>
                                <h4 className="text-xs font-bold text-zinc-850 dark:text-zinc-200 group-hover:text-teal-600 transition-colors leading-tight line-clamp-2">
                                  {art.headline}
                                </h4>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* EDITOR'S HIGH-IMPACT PICKS - MOBILE */}
                        <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-amber-500/20 dark:border-amber-500/30 shadow-xs space-y-3">
                          <div className="flex items-center space-x-2 pb-2 border-b border-zinc-100 dark:border-zinc-900">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
                              Editor&apos;s High-Impact Picks
                            </h3>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {articles
                              .filter(a => a.clinicalImpactScore && a.clinicalImpactScore >= 8)
                              .slice(0, 3)
                              .map(art => (
                                <div
                                  key={art.id}
                                  onClick={() => setSelectedArticle(art)}
                                  className="group cursor-pointer bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60 hover:border-amber-500 transition-all"
                                >
                                  <div className="flex items-center space-x-1 text-[8.5px] font-mono text-amber-600 dark:text-amber-400 font-bold uppercase mb-1">
                                    <span>Impact {art.clinicalImpactScore}/10</span>
                                  </div>
                                  <h4 className="text-xs font-bold text-zinc-850 dark:text-zinc-200 group-hover:text-amber-600 transition-colors leading-tight line-clamp-2">
                                    {art.headline}
                                  </h4>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>

                      {/* Main Stories Grid with Infinite Scroll for Older News */}
                      {(() => {
                        const storiesToDisplay = searchQuery ? filteredArticles : feedStories;
                        const visibleStories = storiesToDisplay.slice(0, visibleCount);
                        
                        return (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {visibleStories.map(art => (
                                <ArticleCard
                                  key={art.id}
                                  article={art}
                                  onSelect={setSelectedArticle}
                                  viewMode="comfortable"
                                  isSaved={savedArticleIds.includes(art.id)}
                                  onToggleSave={handleToggleSave}
                                />
                              ))}
                            </div>

                            {/* Load 20 More News Button / End of Archive Banner */}
                            {visibleCount < storiesToDisplay.length ? (
                              <div className="text-center py-8">
                                <button
                                  onClick={() => setVisibleCount(prev => prev + 20)}
                                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-sans text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2.5 mx-auto cursor-pointer"
                                >
                                  <ChevronDown className="w-4 h-4 text-white" />
                                  <span>Load 20 More Medical News ({visibleStories.length} shown)</span>
                                </button>
                              </div>
                            ) : storiesToDisplay.length > 0 ? (
                              <div className="text-center py-6 border-t border-zinc-200 dark:border-zinc-800 mt-8">
                                <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                                  ✓ You have reached the end of the medical news archive
                                </span>
                              </div>
                            ) : null}
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    /* Compact List View with Infinite Scroll */
                    <div className="space-y-4">
                      <div className="border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950 rounded-xl overflow-hidden shadow-xs divide-y divide-zinc-100 dark:divide-zinc-900">
                        {filteredArticles.slice(0, visibleCount).map(art => (
                          <ArticleCard
                            key={art.id}
                            article={art}
                            onSelect={setSelectedArticle}
                            viewMode="compact"
                            isSaved={savedArticleIds.includes(art.id)}
                            onToggleSave={handleToggleSave}
                          />
                        ))}
                      </div>

                      {visibleCount < filteredArticles.length ? (
                        <div className="text-center py-6">
                          <button
                            onClick={() => setVisibleCount(prev => prev + 20)}
                            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-sans text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2.5 mx-auto cursor-pointer"
                          >
                            <ChevronDown className="w-4 h-4 text-white" />
                            <span>Load 20 More Medical News ({Math.min(visibleCount, filteredArticles.length)} shown)</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-6 border-t border-zinc-200 dark:border-zinc-800 mt-4">
                          <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                            ✓ You have reached the end of the medical news archive
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Side columns (Right 1 column) */}
            <div className="space-y-8">
              
              {/* EDITORIALS SECTION WITH PHOTO & EDITOR INFORMATION */}
              {(() => {
                if (!latestEditorial) {
                  return (
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-mono shrink-0">Editorial</h3>
                        <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 leading-tight border-l-2 border-teal-500/30 pl-2.5">
                          Editorial presents thought-provoking perspectives from the HealicWire Editorial Board
                        </p>
                      </div>
                      <div className="bg-zinc-50 dark:bg-zinc-900/20 p-6 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center text-center space-y-2 h-32">
                        <span className="text-[10px] text-zinc-400 font-mono font-bold uppercase tracking-widest">Editorials</span>
                        <p className="text-xs text-zinc-500 font-sans">No editorials published yet.</p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-mono shrink-0">Editorial</h3>
                      <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 leading-tight border-l-2 border-teal-500/30 pl-2.5">
                        Editorial presents thought-provoking perspectives from the HealicWire Editorial Board
                      </p>
                    </div>
                    <div 
                      className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-teal-200/80 dark:border-teal-800/80 shadow-sm space-y-3 font-sans cursor-pointer group hover:border-teal-500 transition-all" 
                      onClick={() => setCurrentTab("editorials")}
                    >
                      {/* Author Profile Banner - Integrated inside the box */}
                      <div className="p-4 rounded-xl bg-gradient-to-r from-teal-900/10 via-emerald-900/10 to-cyan-900/10 dark:from-teal-950/50 dark:via-emerald-950/50 dark:to-cyan-950/50 border border-teal-200/50 dark:border-teal-800/50 shadow-xs flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-center gap-3 transition-colors">
                        {latestEditorialProfile?.avatar_url ? (
                          <img
                            src={latestEditorialProfile.avatar_url}
                            alt={latestEditorialProfile.name || latestEditorial.sourceName}
                            className="w-14 h-14 rounded-full object-cover border-2 border-teal-600 shadow-sm shrink-0 bg-white"
                          />
                        ) : (!latestEditorialProfile && (!latestEditorial.sourceName || latestEditorial.sourceName === "Dr. K. Narayana K")) ? (
                          <img
                            src="/images/dr_narayana.jpg"
                            alt="Dr. K. Narayana K"
                            className="w-14 h-14 rounded-full object-cover border-2 border-teal-600 shadow-sm shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full border-2 border-teal-600 shadow-sm shrink-0 bg-teal-100 dark:bg-teal-900 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold text-xl">
                            {(latestEditorialProfile?.name || latestEditorial.sourceName || "H").charAt(0)}
                          </div>
                        )}
                        <div className="space-y-0.5 flex-1">
                          <h2 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                            {latestEditorialProfile?.name || latestEditorial.sourceName || "Dr. K. Narayana K"}
                          </h2>
                          {(latestEditorialProfile?.degree || (!latestEditorialProfile && (!latestEditorial.sourceName || latestEditorial.sourceName === "Dr. K. Narayana K"))) && (
                            <p className="text-[9px] font-mono text-zinc-600 dark:text-zinc-400 font-semibold tracking-wide">
                              {latestEditorialProfile?.degree || "MBBS, MD, DipIBLM, FHPE"}
                            </p>
                          )}
                          {(latestEditorialProfile?.role || (!latestEditorialProfile && (!latestEditorial.sourceName || latestEditorial.sourceName === "Dr. K. Narayana K"))) && (
                            <p className="text-[10px] font-sans text-teal-700 dark:text-teal-400 font-bold">
                              {latestEditorialProfile?.role || "Editor-in-Chief & Lead Strategist"}
                            </p>
                          )}
                        </div>
                      </div>

                      <article
                        className="bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-200/80 dark:border-zinc-850/80 shadow-xs transition-all overflow-hidden flex flex-col justify-between"
                      >
                        <div className="p-4 space-y-2">
                          {/* Headline */}
                          <h2 className="text-base font-extrabold text-zinc-900 dark:text-white font-serif leading-snug">
                            {latestEditorial.headline}
                          </h2>

                          {/* 30-Second Summary */}
                          <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans line-clamp-2">
                            {latestEditorial.summary30s}
                          </p>
                        </div>

                        {/* Footer Action Strip */}
                        <div className="px-4 py-2.5 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-900 flex flex-wrap items-center justify-between text-[11px]">
                          <div className="flex items-center space-x-1 font-mono font-bold text-teal-600 dark:text-teal-400 group-hover:underline">
                            <span>Read Editorial</span>
                            <ChevronRight className="w-3 h-3" />
                          </div>
                        </div>
                      </article>
                    </div>
                  </div>
                );
              })()}

              {/* CLINICAL INSIGHTS SECTION WITH PHOTO & EDITOR INFORMATION */}
              {(() => {
                if (clinicalInsights.length === 0) {
                  return (
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-mono shrink-0">Clinical Insights</h3>
                        <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 leading-tight border-l-2 border-teal-500/30 pl-2.5">
                          Curated articles by experts associated with HealicWire
                        </p>
                      </div>
                      <div className="bg-zinc-50 dark:bg-zinc-900/20 p-6 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center text-center space-y-2 h-32">
                        <span className="text-[10px] text-zinc-400 font-mono font-bold uppercase tracking-widest">Clinical Insights</span>
                        <p className="text-xs text-zinc-500 font-sans">No clinical insights published yet.</p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-mono shrink-0">Clinical Insights</h3>
                        <p className="hidden sm:block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 leading-tight border-l-2 border-teal-500/30 pl-2.5">
                          Curated articles by experts associated with HealicWire
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button 
                          onClick={() => scrollClinicalInsights('left')}
                          className="p-1.5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-teal-600 hover:border-teal-500 transition-colors shadow-sm cursor-pointer"
                          aria-label="Scroll left"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => scrollClinicalInsights('right')}
                          className="p-1.5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-teal-600 hover:border-teal-500 transition-colors shadow-sm cursor-pointer"
                          aria-label="Scroll right"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div 
                      ref={clinicalInsightsScrollRef}
                      className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth"
                    >
                      {clinicalInsights.map((insight, idx) => (
                        <div 
                          key={insight.id || idx}
                          className="min-w-[300px] sm:min-w-[380px] w-full max-w-full bg-white dark:bg-zinc-950 p-4 rounded-xl border border-teal-200/80 dark:border-teal-800/80 shadow-sm space-y-3 font-sans cursor-pointer group hover:border-teal-500 transition-all snap-center shrink-0 flex flex-col" 
                          onClick={() => setCurrentTab("clinical-insights")}
                        >
                          {/* Author Profile Banner - Integrated inside the box */}
                          <div className="p-4 rounded-xl bg-gradient-to-r from-teal-900/10 via-emerald-900/10 to-cyan-900/10 dark:from-teal-950/50 dark:via-emerald-950/50 dark:to-cyan-950/50 border border-teal-200/50 dark:border-teal-800/50 shadow-xs flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-center gap-3 transition-colors">
                            <img
                              src={(insight as any).author_image || "https://randomuser.me/api/portraits/women/44.jpg"}
                              alt={(insight as any).author_name || "Dr. Priya Nair"}
                              className="w-14 h-14 rounded-full object-cover border-2 border-teal-600 shadow-sm shrink-0"
                            />
                            <div className="space-y-0.5 flex-1 min-w-0">
                              <h2 className="text-sm font-extrabold text-zinc-900 dark:text-white truncate">
                                {(insight as any).author_name || "Dr. Priya Nair"}
                              </h2>
                              <p className="text-[9px] font-mono text-zinc-600 dark:text-zinc-400 font-semibold tracking-wide truncate">
                                {(insight as any).author_qualifications || "MBBS, MD (General Medicine), DM (Endocrinology)"}
                              </p>
                              <p className="text-[10px] font-sans text-teal-700 dark:text-teal-400 font-bold truncate">
                                {(insight as any).author_title || "Consultant Endocrinologist & Diabetologist"}
                              </p>
                            </div>
                          </div>

                          <article
                            className="bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-200/80 dark:border-zinc-850/80 shadow-xs transition-all overflow-hidden flex flex-col flex-1"
                          >
                            <div className="p-4 space-y-2 flex-1">
                              {/* Headline */}
                              <h2 className="text-base font-extrabold text-zinc-900 dark:text-white font-serif leading-snug line-clamp-2">
                                {insight.headline}
                              </h2>

                              {/* 30-Second Summary */}
                              <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans line-clamp-2">
                                {insight.summary30s}
                              </p>
                            </div>

                            {/* Footer Action Strip */}
                            <div className="px-4 py-2.5 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-900 flex flex-wrap items-center justify-between text-[11px] mt-auto">
                              <div className="flex items-center space-x-1 font-mono font-bold text-teal-600 dark:text-teal-400 group-hover:underline">
                                <span>Read Clinical Insights</span>
                                <ChevronRight className="w-3 h-3" />
                              </div>
                            </div>
                          </article>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* TODAY'S CLINICAL BRIEFING */}
              <div className="bg-white dark:bg-zinc-950 p-5 rounded-xl border border-zinc-200 dark:border-zinc-850 shadow-sm space-y-4">
                <div className="flex items-center space-x-2 pb-2 border-b border-zinc-100 dark:border-zinc-900">
                  <Activity className="w-4 h-4 text-teal-600" />
                  <h3 className="text-xs font-mono font-bold uppercase text-zinc-700 dark:text-zinc-350">
                    Today&apos;s Clinical Briefing
                  </h3>
                </div>
                <div className="space-y-3">
                  {articles.slice(0, 3).map((art, idx) => (
                    <div
                      key={art.id}
                      onClick={() => setSelectedArticle(art)}
                      className="group cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/30 p-2 rounded-lg transition-all"
                    >
                      <div className="text-[9px] font-mono text-teal-600 dark:text-teal-400 font-bold uppercase">
                        Brief {idx + 1}
                      </div>
                      <h4 className="text-xs font-bold text-zinc-850 dark:text-zinc-200 group-hover:text-teal-600 transition-colors leading-tight line-clamp-2 mt-0.5">
                        {art.headline}
                      </h4>
                    </div>
                  ))}
                </div>
              </div>

              {/* EDITORS' CHOICES */}
              <div className="bg-white dark:bg-zinc-950 p-5 rounded-xl border border-zinc-200 dark:border-zinc-850 shadow-sm space-y-4">
                <div className="flex items-center space-x-2 pb-2 border-b border-zinc-100 dark:border-zinc-900">
                  <Star className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-mono font-bold uppercase text-zinc-700 dark:text-zinc-300">
                    Editor&apos;s High-Impact Picks
                  </h3>
                </div>
                <div className="space-y-3 text-xs">
                  {articles
                    .filter(art => (art.impactScores?.clinicalPractice || 0) + (art.impactScores?.publicHealth || 0) >= 8)
                    .slice(0, 5)
                    .map(art => {
                      const totalImpact = (art.impactScores?.clinicalPractice || 0) + (art.impactScores?.publicHealth || 0);
                      return (
                        <div
                          key={art.id}
                          onClick={() => setSelectedArticle(art)}
                          className="flex items-start gap-2 cursor-pointer hover:text-teal-600 transition-all font-sans"
                        >
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 font-bold shrink-0">
                            Impact {totalImpact}/10
                          </span>
                          <span className="font-semibold text-zinc-800 dark:text-zinc-300 line-clamp-2">{art.headline}</span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* CLINICIAN INTERACTIVE NEWSLETTER FORM */}
              <div className="bg-white dark:bg-zinc-950 p-5 rounded-xl border border-zinc-200 dark:border-zinc-850 shadow-sm space-y-4">
                <div className="flex items-center space-x-2 pb-2 border-b border-zinc-100 dark:border-zinc-900">
                  <Mail className="w-4 h-4 text-teal-600" />
                  <h3 className="text-xs font-mono font-bold uppercase text-zinc-700 dark:text-zinc-300">
                    Clinician intelligence Digest
                  </h3>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal font-sans">
                  Join 42,000+ clinicians. Get peer-reviewed healthcare news summaries, guideline updates, and hospital alert digests straight to your inbox.
                </p>

                {newsSuccess ? (
                  <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>{newsSuccess}</span>
                  </div>
                ) : (
                  <form onSubmit={handleNewsletterSubmit} className="space-y-3">
                    <div>
                      <input
                        type="email"
                        required
                        placeholder="Clinical Email address (e.g. dr@hospital.in)"
                        value={newsEmail}
                        onChange={e => setNewsEmail(e.target.value)}
                        className="w-full px-3 py-1.8 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                      <select
                        value={newsSpecialty}
                        onChange={e => setNewsSpecialty(e.target.value)}
                        className="p-1.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                      >
                        <option value="General Medicine">General Medicine</option>
                        <option value="Cardiology">Cardiology</option>
                        <option value="Infectious Diseases">Infectious Diseases</option>
                        <option value="Hospital Operations">Hospital Admin</option>
                        <option value="Pediatrics">Pediatrics</option>
                      </select>
                      <select
                        value={newsFrequency}
                        onChange={e => setNewsFrequency(e.target.value as any)}
                        className="p-1.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                      >
                        <option value="weekly">Weekly Digest</option>
                        <option value="daily">Daily Brief</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-mono text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md shadow-teal-500/15"
                    >
                      Subscribe Digest
                    </button>
                  </form>
                )}
              </div>

              {/* WHAT WE DO INTERACTIVE SLIDER */}
              <WhatWeDoSlider
                onSelectTab={(tabKey) => {
                  setCurrentTab(tabKey);
                  setSelectedArticle(null);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />

              {/* PLATFORM METADATA FOOTNOTE */}
              <div className="p-3 sm:p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-850 text-[9.5px] sm:text-[11px] font-mono text-zinc-500 dark:text-zinc-400 space-y-1 bg-zinc-50/50 dark:bg-zinc-950/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span>Publisher: <strong className="text-zinc-700 dark:text-zinc-300">Healic Health Care Solutions</strong></span>
                  <span>Regulatory: <strong className="text-zinc-700 dark:text-zinc-300">Clinical Evidence Aware (ICMR/CDSCO)</strong></span>
                </div>
                <div className="pt-1 border-t border-dashed border-zinc-200 dark:border-zinc-850">
                  <span>Verification: <strong className="text-teal-600 dark:text-teal-400">AI Augmented & Human Reviewed</strong></span>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* FOOTER POLICIES & SECTIONS */}
      <footer className="border-t border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-900 py-8 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-2">
            <HealicLogo className="w-5 h-5" />
            <span className="font-bold font-mono tracking-tight text-zinc-900 dark:text-white">
              Healic<span className="text-teal-600">Wire</span>
            </span>
            <span className="text-zinc-300 dark:text-zinc-800">|</span>
            <span>© 2026 Healic Care. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap gap-4 font-mono text-[10.5px]">
            <button onClick={() => {
              setCurrentTab("proposal");
              setSelectedArticle(null);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }} className={`hover:text-teal-600 ${currentTab === "proposal" ? "text-teal-600 font-bold" : ""}`}>What we do</button>
            <button onClick={() => setShowPolicies("about")} className="hover:text-teal-600">About HealicWire</button>
            <button onClick={() => setShowPolicies("editorial")} className="hover:text-teal-600">Editorial Policy</button>
            <button onClick={() => setShowPolicies("disclaimer")} className="hover:text-teal-600">Medical Disclaimer</button>
          </div>
        </div>
      </footer>

      {/* ADMIN CMS INTERFACE DIALOG OVERLAY */}
      {showAdmin && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto">
          {!session ? (
            <Login onLogin={() => {}} />
          ) : (
            <AdminCMS onClose={closeAdmin} session={session} />
          )}
        </div>
      )}

      {/* EDITORIAL ACCESS INTERFACE DIALOG OVERLAY */}
      {showEditorialAccess && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto flex items-center justify-center">
          {!session ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
              <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-white uppercase">
                  Editorial <span className="text-teal-600">Access</span>
                </h1>
                <p className="text-zinc-500 text-sm font-mono mt-2">Login to manage your publications</p>
              </div>
              <div className="w-full max-w-md shadow-2xl rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                <Login onLogin={() => {}} />
              </div>
            </div>
          ) : (
            <EditorialCMS onClose={closeEditorialAccess} session={session} />
          )}
        </div>
      )}

      {/* CLINICAL INSIGHTS ACCESS INTERFACE DIALOG OVERLAY */}
      {showClinicalInsightsAccess && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto flex items-center justify-center">
          {!session ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
              <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold font-mono tracking-tight text-zinc-900 dark:text-white uppercase">
                  Clinical Insights <span className="text-teal-600">Access</span>
                </h1>
                <p className="text-zinc-500 text-sm font-mono mt-2">Login to manage your clinical insights</p>
              </div>
              <div className="w-full max-w-md shadow-2xl rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                <Login onLogin={() => {}} />
              </div>
            </div>
          ) : (
            <ClinicalInsightsCMS onClose={closeClinicalInsightsAccess} session={session} />
          )}
        </div>
      )}

      {/* POLICY/MODAL PORTALS */}
      {showPolicies && (
        <div className="fixed inset-0 z-55 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-lg p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl relative animate-scaleIn">
            <button
              onClick={() => setShowPolicies(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-zinc-450 hover:text-zinc-650"
            >
              <X className="w-5 h-5" />
            </button>

            {showPolicies === "about" && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-teal-600 dark:text-teal-400">
                  <Landmark className="w-5 h-5" />
                  <h3 className="font-bold uppercase font-mono">About HealicWire</h3>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-450 leading-relaxed font-sans">
                  HealicWire is a futuristic clinical news and evidence intelligence platform owned by Healic Health Care Solutions.
                  We operate on a unique clinical journalism workflow where global healthcare releases, regulatory approvals, and journal preprints are captured, summarized, and explained with audience-specific guidelines.
                  Our primary mission is to support continuous medical education and real-time clinical preparedness for healthcare practitioners.
                </p>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 rounded border border-zinc-150 dark:border-zinc-850 font-mono text-[10px]">
                  <strong>Our Motto:</strong> From News to Knowledge to Action.
                </div>
              </div>
            )}

            {showPolicies === "editorial" && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-teal-600 dark:text-teal-400">
                  <FileText className="w-5 h-5" />
                  <h3 className="font-bold uppercase font-mono">Editorial Policy & AI Safety</h3>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-450 leading-relaxed font-sans">
                  HealicWire enforces a strict code of healthcare safety and news authenticity. We NEVER invent medical facts, trial outcomes, drug approvals, or statistical quotas. 
                  <br /><br />
                  <strong>AI Usage Principles:</strong> Google AI Based API is leveraged to organize, draft summaries, suggest MCQ parameters, and identify verification references. However, all AI drafts must pass rigorous human editor review before moving to the published state. We maintain fully auditable logs of AI prompts and edits to ensure clinical safety and intellectual transparency.
                </p>
              </div>
            )}

            {showPolicies === "disclaimer" && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                  <h3 className="font-bold uppercase font-mono">Medical Disclaimer</h3>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-450 leading-relaxed font-sans">
                  All content published on HealicWire (including articles, clinical analyses, current guidelines, AI clinical assistant replies, and interactive exam quizzes) is provided for informational, educational, and institutional warning purposes only.
                  <br /><br />
                  This content does NOT constitute medical advice, personalized diagnosis, or active treatment prescriptions. It should not be used as a substitute for professional medical consultation or expert clinical judgement.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Simple absolute close SVG
function X({ className, ...props }: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}
