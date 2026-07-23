/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Search, Calendar, MapPin, Laptop, Sparkles, Plus, Clock, 
  Award, CheckCircle, ExternalLink, User, DollarSign, X, AlertCircle, RefreshCw, FileText,
  Filter, Share2, Bookmark, BookmarkCheck, ChevronRight, MessageSquare, BookOpen, Layers,
  Send, ThumbsUp, Star, ShieldCheck, Download, Trash2, Check, ArrowRight, Compass, Users
} from "lucide-react";
import { ScientificEvent, EventRegistration, LiveQnAItem, AiSummaryData } from "../types";
import { supabase, mapEventFromDB, mapArticleFromDB } from "../lib/supabase";

export default function ScientificEvents() {
  const [events, setEvents] = useState<ScientificEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [scopeFilter, setScopeFilter] = useState<"All" | "Local" | "Nationwide" | "International">("All");
  const [professionFilter, setProfessionFilter] = useState<string>("All");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("All");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("All");
  const [formatFilter, setFormatFilter] = useState<"All" | "In-Person" | "Online" | "Hybrid">("All");
  const [viewMode, setViewMode] = useState<"priority" | "grid" | "calendar">("priority");

  // User Dashboard & Storage
  const [savedEventIds, setSavedEventIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("healic_saved_events");
    return saved ? JSON.parse(saved) : [];
  });
  
  const [registeredEvents, setRegisteredEvents] = useState<EventRegistration[]>(() => {
    const saved = localStorage.getItem("healic_registered_events_list");
    return saved ? JSON.parse(saved) : [];
  });

  const [earnedCredits, setEarnedCredits] = useState<number>(() => {
    const saved = localStorage.getItem("healic_earned_cme_credits");
    return saved ? Number(saved) : 12;
  });

  // Modal Controls
  const [selectedEvent, setSelectedEvent] = useState<ScientificEvent | null>(null);
  const [registeringEvent, setRegisteringEvent] = useState<ScientificEvent | null>(null);
  const [aiAssistantEvent, setAiAssistantEvent] = useState<ScientificEvent | null>(null);
  const [aiSummaryEvent, setAiSummaryEvent] = useState<ScientificEvent | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showDashboardModal, setShowDashboardModal] = useState(false);
  const [showAiRecommendModal, setShowAiRecommendModal] = useState(false);

  // Form & Registration State
  const [regName, setRegName] = useState("Dr. Ananya Sharma");
  const [regEmail, setRegEmail] = useState("ananya.sharma@healicwire.org");
  const [regProfession, setRegProfession] = useState("MD/MS");
  const [regSpecialty, setRegSpecialty] = useState("Internal Medicine");
  const [activeTicket, setActiveTicket] = useState<EventRegistration | null>(null);

  // AI Assistant Chat State
  const [aiChatQuery, setAiChatQuery] = useState("");
  const [aiChatHistory, setAiChatHistory] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [aiChatLoading, setAiChatLoading] = useState(false);

  // AI Summary State
  const [aiSummaryData, setAiSummaryData] = useState<AiSummaryData | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);

  // Recommendation Engine State
  const [recSpecialty, setRecSpecialty] = useState("General Medicine");
  const [recProfession, setRecProfession] = useState("MD/MS");
  const [recResults, setRecResults] = useState<{ event: ScientificEvent; score: number; reason: string }[]>([]);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const [portalEvents, setPortalEvents] = useState<any[]>([]);

  // Fetch events from backend API
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('scientific_events')
        .select('*');
      if (error) throw error;
      if (data) setEvents(data.map(mapEventFromDB));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    // Fetch portal events
    const fetchPortalEvents = async () => {
      try {
        const { data, error } = await supabase.from('articles').select('*');
        if (error) throw error;
        if (data) {
          const generated = data.filter((a: any) =>
            (a.source_name === "HealicWire Special Page Engine" || a.headline?.startsWith("Scientific Events:")) &&
            !a.headline?.startsWith("Treatment Update:") &&
            a.category !== "Pharma and Drugs"
          );
          setPortalEvents(generated.map(mapArticleFromDB));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchPortalEvents();
  }, []);

  // Sync LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem("healic_saved_events", JSON.stringify(savedEventIds));
    } catch (error) {
      console.warn("Failed to save to localStorage:", error);
    }
  }, [savedEventIds]);

  useEffect(() => {
    try {
      localStorage.setItem("healic_registered_events_list", JSON.stringify(registeredEvents));
    } catch (error) {
      console.warn("Failed to save to localStorage:", error);
    }
  }, [registeredEvents]);

  useEffect(() => {
    try {
      localStorage.setItem("healic_earned_cme_credits", String(earnedCredits));
    } catch (error) {
      console.warn("Failed to save to localStorage:", error);
    }
  }, [earnedCredits]);

  // Toggle Save Event
  const toggleSaveEvent = (eventId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (savedEventIds.includes(eventId)) {
      setSavedEventIds(prev => prev.filter(id => id !== eventId));
      showToast("Event removed from bookmarks.");
    } else {
      setSavedEventIds(prev => [...prev, eventId]);
      showToast("Event bookmarked to your dashboard!");
    }
  };

  // Registration Handler
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registeringEvent) return;

    const newReg: EventRegistration = {
      id: "reg-" + Date.now(),
      eventId: registeringEvent.id,
      eventName: registeringEvent.title,
      attendeeName: regName,
      email: regEmail,
      profession: regProfession,
      specialty: regSpecialty,
      registrationId: "HEALIC-EVT-" + Math.floor(100000 + Math.random() * 900000),
      registrationDate: new Date().toISOString().split("T")[0],
      cmeClaimed: false
    };

    setRegisteredEvents(prev => [newReg, ...prev]);
    setActiveTicket(newReg);
    showToast(`Registered successfully for "${registeringEvent.title}"!`);
  };

  // CME Claim Handler
  const handleClaimCme = (registrationId: string, credits: number) => {
    setRegisteredEvents(prev => prev.map(r => r.id === registrationId ? { ...r, cmeClaimed: true } : r));
    setEarnedCredits(prev => prev + credits);
    showToast(`Claimed ${credits} CME Credits!`);
  };

  // Calendar Export Utility (.ics format download)
  const downloadIcsFile = (event: ScientificEvent) => {
    const startDate = event.startDate.replace(/-/g, "");
    const endDate = (event.endDate || event.startDate).replace(/-/g, "");
    const icsData = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//HealicWire Medical Scientific Events//EN",
      "BEGIN:VEVENT",
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description.replace(/\n/g, " ")}`,
      `LOCATION:${event.venue}, ${event.city}`,
      `DTSTART:${startDate}T090000Z`,
      `DTEND:${endDate}T170000Z`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\n");

    const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Downloaded calendar event file (.ics)");
  };

  // Google Calendar Link
  const getGoogleCalendarUrl = (event: ScientificEvent) => {
    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(`${event.description}\n\nOrganized by: ${event.organizer}`);
    const location = encodeURIComponent(`${event.venue}, ${event.city}`);
    const start = event.startDate.replace(/-/g, "");
    const end = (event.endDate || event.startDate).replace(/-/g, "");
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${start}/${end}`;
  };

  // AI Assistant Chat Handler
  const handleSendAiChat = async (questionText?: string) => {
    const q = questionText || aiChatQuery;
    if (!q.trim() || !aiAssistantEvent) return;

    const userMsg = { role: "user" as const, text: q };
    setAiChatHistory(prev => [...prev, userMsg]);
    setAiChatQuery("");
    setAiChatLoading(true);

    try {
      const res = await fetch(`/api/scientific-events/${aiAssistantEvent.id}/ai-assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q })
      });
      const data = await res.json();
      setAiChatHistory(prev => [...prev, { role: "assistant", text: data.text || "I was unable to summarize this session." }]);
    } catch (err) {
      setAiChatHistory(prev => [...prev, { role: "assistant", text: "Error connecting to AI Assistant engine." }]);
    } finally {
      setAiChatLoading(false);
    }
  };

  // AI Summary Fetcher
  const handleFetchAiSummary = async (event: ScientificEvent) => {
    setAiSummaryEvent(event);
    setAiSummaryData(event.aiSummary || null);
    if (event.aiSummary) return;

    setAiSummaryLoading(true);
    try {
      const res = await fetch(`/api/scientific-events/${event.id}/ai-summary`, { method: "POST" });
      const data = await res.json();
      setAiSummaryData(data);
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, aiSummary: data } : e));
    } catch (err) {
      showToast("Failed to generate AI Conference Summary.");
    } finally {
      setAiSummaryLoading(false);
    }
  };

  // Recommendation Engine
  const runRecommendationEngine = () => {
    const scored = events.map(evt => {
      let score = 50;
      let reasons: string[] = [];

      if (evt.specialties.includes(recSpecialty)) {
        score += 35;
        reasons.push(`Matches your specialty in ${recSpecialty}`);
      }
      if (evt.targetProfessions?.includes(recProfession)) {
        score += 15;
        reasons.push(`Tailored for ${recProfession} candidates`);
      }
      if (evt.cmeCredits >= 8) {
        score += 10;
        reasons.push(`High CME Credit Yield (${evt.cmeCredits} Hours)`);
      }
      if (evt.scope === "Local") {
        score += 5;
        reasons.push("Convenient Local Venue");
      }

      return {
        event: evt,
        score: Math.min(99, score),
        reason: reasons.join(" • ") || "General Academic Alignment"
      };
    });

    scored.sort((a, b) => b.score - a.score);
    setRecResults(scored);
  };

  // Dropdown Lists
  const ALL_PROFESSIONS = [
    "All", "MBBS", "MD/MS", "DM/MCh", "Dentistry", "Nursing", "Pharmacy", 
    "Physiotherapy", "Allied Health Sciences", "Public Health", "Medical Education", "Researchers"
  ];

  const ALL_SPECIALTIES = [
    "All", "General Medicine", "General Surgery", "Pediatrics", "Obstetrics & Gynecology", 
    "Orthopaedics", "Psychiatry", "Dermatology", "Anaesthesiology", "Radiology", 
    "Pathology", "Pharmacology", "Microbiology", "Community Medicine", "Cardiology", 
    "Neurology", "Nephrology", "Gastroenterology", "Endocrinology", "Oncology", 
    "Pulmonology", "Emergency Medicine", "Family Medicine", "ENT", "Ophthalmology", 
    "Plastic Surgery", "Urology", "Neurosurgery", "Cardiothoracic Surgery", "Medical Education", "Health Technology"
  ];

  const ALL_EVENT_TYPES = [
    "All", "Conference", "Workshop", "CME", "Webinar", "Journal Club", "Symposium", 
    "Seminar", "Hands-on Training", "Fellowship Course", "Certification Program", 
    "Faculty Development Program", "Research Methodology Workshop", "AI in Medicine Event", 
    "Case Discussion", "Grand Rounds", "Quiz Competition"
  ];

  // Filtering Logic
  const filteredEvents = events.filter(evt => {
    const matchesSearch = 
      evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.organizer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (evt.keynoteSpeakers && evt.keynoteSpeakers.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesScope = scopeFilter === "All" || evt.scope === scopeFilter;
    const matchesFormat = formatFilter === "All" || evt.format === formatFilter;
    const matchesSpecialty = specialtyFilter === "All" || evt.specialties.includes(specialtyFilter);
    const matchesProfession = professionFilter === "All" || !evt.targetProfessions || evt.targetProfessions.includes(professionFilter);
    const matchesType = eventTypeFilter === "All" || evt.eventType === eventTypeFilter;

    return matchesSearch && matchesScope && matchesFormat && matchesSpecialty && matchesProfession && matchesType;
  });

  const localEvents = filteredEvents.filter(e => e.scope === "Local");
  const nationwideEvents = filteredEvents.filter(e => e.scope === "Nationwide");
  const internationalEvents = filteredEvents.filter(e => e.scope === "International");

  // Helper renderer for Event Cards
  const renderEventCard = (evt: ScientificEvent) => {
    const isSaved = savedEventIds.includes(evt.id);
    const isRegistered = registeredEvents.some(r => r.eventId === evt.id);

    return (
      <div 
        key={evt.id}
        className="group relative rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
      >
        {/* Poster Header Banner */}
        <div className="relative h-44 w-full bg-zinc-800 overflow-hidden">
          <img 
            src={evt.imageUrl || "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80"} 
            alt={evt.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

          {/* Scope & Mode Badges Overlay */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className={`px-2.5 py-1 rounded-lg text-[10.5px] font-mono font-extrabold uppercase tracking-wider shadow-md ${
                evt.scope === "Local" 
                  ? "bg-teal-600 text-white" 
                  : evt.scope === "Nationwide" 
                  ? "bg-blue-600 text-white" 
                  : "bg-indigo-600 text-white"
              }`}>
                {evt.scope}
              </span>

              <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[10.5px] font-mono font-bold border border-white/20 uppercase">
                {evt.format}
              </span>
            </div>

            <button
              onClick={(e) => toggleSaveEvent(evt.id, e)}
              className="p-2 rounded-xl bg-black/60 backdrop-blur-md text-white hover:bg-teal-600 transition-colors border border-white/20"
              title="Save Event"
            >
              {isSaved ? <BookmarkCheck className="w-4 h-4 text-amber-400" /> : <Bookmark className="w-4 h-4" />}
            </button>
          </div>

          <div className="absolute bottom-3 left-3 flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-md bg-amber-500 text-zinc-950 font-mono text-[11px] font-black uppercase flex items-center space-x-1 shadow-md">
              <Award className="w-3.5 h-3.5" />
              <span>{evt.cmeCredits} CME Credits</span>
            </span>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {evt.specialties.map(spec => (
                <span 
                  key={spec}
                  className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-mono uppercase"
                >
                  {spec}
                </span>
              ))}
              <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20 text-[10px] font-mono font-bold">
                {evt.eventType}
              </span>
            </div>

            <h3 
              onClick={() => setSelectedEvent(evt)}
              className="text-lg font-bold text-zinc-900 dark:text-white font-serif hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer line-clamp-2 transition-colors"
            >
              {evt.title}
            </h3>

            <p className="text-xs text-zinc-500 font-mono">
              Organized by: <strong className="text-zinc-700 dark:text-zinc-300 font-bold">{evt.organizer}</strong>
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-900 text-xs font-mono">
              <div className="flex items-center space-x-1.5 text-zinc-600 dark:text-zinc-400">
                <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span className="truncate">
                  {new Date(evt.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </div>

              <div className="flex items-center space-x-1.5 text-zinc-600 dark:text-zinc-400">
                <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span className="truncate">{evt.venue}, {evt.city}</span>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 pt-1 font-sans">
              {evt.description}
            </p>

            {evt.keynoteSpeakers && evt.keynoteSpeakers.length > 0 && (
              <div className="text-[11px] font-mono text-zinc-500 flex items-center space-x-1 pt-1">
                <User className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span className="truncate"><strong>Speakers:</strong> {evt.keynoteSpeakers.join(", ")}</span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-900 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-zinc-400">Fee: <strong className="text-zinc-900 dark:text-white font-bold">{evt.cost}</strong></span>
              <button
                onClick={() => downloadIcsFile(evt)}
                className="text-[10.5px] text-teal-600 dark:text-teal-400 font-bold hover:underline flex items-center space-x-1"
                title="Add to Calendar"
              >
                <Calendar className="w-3 h-3" />
                <span>+ Calendar</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedEvent(evt)}
                className="py-2 px-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 rounded-xl font-mono text-xs font-bold transition-all border border-zinc-200 dark:border-zinc-800 text-center"
              >
                View Details
              </button>

              {isRegistered ? (
                <button
                  onClick={() => {
                    const reg = registeredEvents.find(r => r.eventId === evt.id);
                    if (reg) setActiveTicket(reg);
                    setShowDashboardModal(true);
                  }}
                  className="py-2 px-3 bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center space-x-1"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Registered</span>
                </button>
              ) : (
                <button
                  onClick={() => setRegisteringEvent(evt)}
                  className="py-2 px-3 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-mono text-xs font-bold transition-all shadow-2xs uppercase tracking-wider"
                >
                  Register Now
                </button>
              )}
            </div>

            <div className="flex items-center justify-between pt-1 font-mono text-[10.5px]">
              <button
                onClick={() => {
                  setAiAssistantEvent(evt);
                  setAiChatHistory([]);
                }}
                className="text-teal-600 dark:text-teal-400 hover:underline flex items-center space-x-1 font-bold"
              >
                <MessageSquare className="w-3 h-3" />
                <span>AI Assistant</span>
              </button>

              <button
                onClick={() => handleFetchAiSummary(evt)}
                className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1 font-bold"
              >
                <BookOpen className="w-3 h-3" />
                <span>AI Pearls & Notes</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-teal-800 dark:bg-teal-900 text-white font-mono text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 border border-teal-600 animate-slideUp">
          <CheckCircle className="w-4 h-4 text-teal-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl font-serif">
          Scientific Events
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
          Discover local institutional grand rounds, national medical conferences, and global symposia. Track mandatory CME credits, download digital attendance passes, and leverage AI conference assistants.
        </p>
      </div>

      {/* GENERATED SCIENTIFIC EVENTS - ALWAYS ON TOP BELOW HEADER */}
      {portalEvents.length > 0 && (
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-purple-900/10 via-indigo-900/10 to-blue-900/10 dark:from-purple-950/40 dark:via-indigo-950/40 dark:to-blue-950/40 border border-purple-200 dark:border-purple-800/60 shadow-xs space-y-4 font-sans">
          <div className="flex items-center justify-between border-b border-purple-200/60 dark:border-purple-800/40 pb-3">
            <div className="flex items-center space-x-2.5">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 animate-pulse shrink-0" />
              <div>
                <h2 className="text-base font-extrabold text-zinc-900 dark:text-white uppercase font-mono tracking-tight">
                  Featured Portal Events & Symposia
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Published scientific events & portal pages generated via HealicWire Control Panel.
                </p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-purple-600 text-white uppercase tracking-wider shrink-0">
              Top Priority Events ({portalEvents.length})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {portalEvents.map(pEvt => (
              <div
                key={pEvt.id}
                className="bg-white dark:bg-zinc-950 p-5 rounded-xl border border-purple-200/80 dark:border-purple-800/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 uppercase">
                      {pEvt.category || "Scientific Event"}
                    </span>
                    <span className="text-[10.5px] font-mono text-zinc-400">
                      {new Date(pEvt.publishedAt || Date.now()).toLocaleDateString("en-IN")}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white leading-snug">
                    {pEvt.headline}
                  </h3>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {pEvt.summary30s || pEvt.bodyAnalysis}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 text-[11px] text-zinc-500 font-mono">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span>12 CME Credits</span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedEvent({
                        id: pEvt.id,
                        title: pEvt.headline,
                        organizer: pEvt.sourceName || "HealicWire Special Page Engine",
                        scope: "Nationwide",
                        eventType: "Conference",
                        startDate: pEvt.publishedAt?.split("T")[0] || "2026-07-25",
                        endDate: "2026-07-27",
                        venue: "Main Medical Auditorium & Online Hybrid Stream",
                        city: "New Delhi",
                        country: "India",
                        format: "Hybrid",
                        specialties: pEvt.specialties || ["Cardiology", "Internal Medicine"],
                        cmeCredits: 12,
                        description: pEvt.summary30s || pEvt.bodyAnalysis,
                        cost: "Complimentary / CME Accredited",
                        registrationUrl: "#",
                        imageUrl: pEvt.imageUrl
                      });
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-2xs transition-all flex items-center space-x-1"
                  >
                    <span>View Event Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Control Bar */}
      <div className="bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-850 shadow-xs mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-2/3">
            <input
              type="text"
              placeholder="Search by conference name, hospital, speaker, topic, or city..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
            <Search className="w-4.5 h-4.5 absolute left-3.5 top-3 text-zinc-400" />
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
            <span className="text-xs font-mono text-zinc-400 mr-1">View:</span>
            <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 font-mono text-xs">
              <button
                onClick={() => setViewMode("priority")}
                className={`px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-all ${
                  viewMode === "priority" ? "bg-white dark:bg-zinc-950 text-teal-700 dark:text-teal-400 font-bold shadow-2xs" : "text-zinc-500"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Priority Tiers</span>
              </button>

              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-all ${
                  viewMode === "grid" ? "bg-white dark:bg-zinc-950 text-teal-700 dark:text-teal-400 font-bold shadow-2xs" : "text-zinc-500"
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>All Grid</span>
              </button>

              <button
                onClick={() => setViewMode("calendar")}
                className={`px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-all ${
                  viewMode === "calendar" ? "bg-white dark:bg-zinc-950 text-teal-700 dark:text-teal-400 font-bold shadow-2xs" : "text-zinc-500"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Calendar View</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-900 font-mono text-xs">
          <div>
            <label className="block text-[10px] text-zinc-400 uppercase font-bold mb-1">Scope / Location</label>
            <select value={scopeFilter} onChange={e => setScopeFilter(e.target.value as any)} className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-sans">
              <option value="All">All Tiers</option>
              <option value="Local">Local (Hospital/City)</option>
              <option value="Nationwide">Nationwide (India)</option>
              <option value="International">International</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-zinc-400 uppercase font-bold mb-1">Profession</label>
            <select value={professionFilter} onChange={e => setProfessionFilter(e.target.value)} className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-sans">
              {ALL_PROFESSIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-zinc-400 uppercase font-bold mb-1">Specialty</label>
            <select value={specialtyFilter} onChange={e => setSpecialtyFilter(e.target.value)} className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-sans">
              {ALL_SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-zinc-400 uppercase font-bold mb-1">Event Category</label>
            <select value={eventTypeFilter} onChange={e => setEventTypeFilter(e.target.value)} className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-sans">
              {ALL_EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-zinc-400 uppercase font-bold mb-1">Mode</label>
            <select value={formatFilter} onChange={e => setFormatFilter(e.target.value as any)} className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-sans">
              <option value="All">All Formats</option>
              <option value="In-Person">In-Person</option>
              <option value="Online">Online / Webinar</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchQuery("");
                setScopeFilter("All");
                setProfessionFilter("All");
                setSpecialtyFilter("All");
                setEventTypeFilter("All");
                setFormatFilter("All");
              }}
              className="w-full py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 rounded-lg text-xs font-mono font-bold transition-all border border-zinc-200 dark:border-zinc-800 flex items-center justify-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => <div key={i} className="h-44 bg-zinc-100 dark:bg-zinc-900 rounded-2xl animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="text-center py-12 border border-dashed border-red-200 dark:border-red-900 bg-red-50/10 rounded-2xl max-w-lg mx-auto">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <p className="text-sm text-red-600 font-semibold mb-2">Error connecting to server</p>
          <button onClick={fetchEvents} className="px-4 py-2 bg-red-600 text-white text-xs font-mono rounded-lg">Retry</button>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg mx-auto">
          <Calendar className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm text-zinc-600 font-bold mb-1">No scientific events match your criteria</p>
          <button onClick={() => setSearchQuery("")} className="px-4 py-2 bg-teal-700 text-white text-xs font-mono rounded-lg font-bold">Clear Search</button>
        </div>
      ) : (
        <>
          {viewMode === "priority" && (
            <div className="space-y-12">
              {(scopeFilter === "All" || scopeFilter === "Local") && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b-2 border-teal-600 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-teal-600 text-white text-[10px] font-mono font-black uppercase">Priority 1</span>
                      <h2 className="text-xl font-bold font-serif text-zinc-900 dark:text-white">Local Institutional & Regional Events ({localEvents.length})</h2>
                    </div>
                    <span className="text-xs text-teal-600 font-mono font-bold">Same Hospital / City / District</span>
                  </div>
                  {localEvents.length === 0 ? (
                    <p className="text-xs text-zinc-400 font-mono py-4 italic">No local institutional events match filters.</p>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{localEvents.map(evt => renderEventCard(evt))}</div>
                  )}
                </div>
              )}

              {(scopeFilter === "All" || scopeFilter === "Nationwide") && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[10px] font-mono font-black uppercase">Priority 2</span>
                      <h2 className="text-xl font-bold font-serif text-zinc-900 dark:text-white">Nationwide Conferences & CMEs ({nationwideEvents.length})</h2>
                    </div>
                  </div>
                  {nationwideEvents.length === 0 ? (
                    <p className="text-xs text-zinc-400 font-mono py-4 italic">No nationwide events match filters.</p>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{nationwideEvents.map(evt => renderEventCard(evt))}</div>
                  )}
                </div>
              )}

              {(scopeFilter === "All" || scopeFilter === "International") && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[10px] font-mono font-black uppercase">Priority 3</span>
                      <h2 className="text-xl font-bold font-serif text-zinc-900 dark:text-white">International Congresses & WHO Symposia ({internationalEvents.length})</h2>
                    </div>
                  </div>
                  {internationalEvents.length === 0 ? (
                    <p className="text-xs text-zinc-400 font-mono py-4 italic">No international events match filters.</p>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{internationalEvents.map(evt => renderEventCard(evt))}</div>
                  )}
                </div>
              )}
            </div>
          )}

          {viewMode === "grid" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{filteredEvents.map(evt => renderEventCard(evt))}</div>
          )}

          {viewMode === "calendar" && (
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold font-serif text-zinc-900 dark:text-white flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-teal-600" />
                <span>Academic Calendar & Session Timelines</span>
              </h3>
              <div className="space-y-3">
                {filteredEvents.map(evt => (
                  <div key={evt.id} onClick={() => setSelectedEvent(evt)} className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/50 hover:border-teal-500 cursor-pointer transition-all flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-mono bg-teal-500/10 text-teal-700 px-2 py-0.5 rounded font-bold uppercase">{evt.scope}</span>
                      <h4 className="text-base font-bold font-serif text-zinc-900 dark:text-white mt-1">{evt.title}</h4>
                      <p className="text-xs font-mono text-zinc-500">{evt.organizer} • {evt.venue}, {evt.city}</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-teal-600">{evt.cmeCredits} CME Credits</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL 1: EVENT DETAILS */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-3xl rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl relative p-6 max-h-[90vh] overflow-y-auto animate-scaleIn">
            
            {/* Prominent Top Right Close Button */}
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-3 right-3 z-30 p-2.5 rounded-full bg-zinc-900/85 hover:bg-zinc-900 text-white border border-white/40 shadow-xl backdrop-blur-md transition-all cursor-pointer flex items-center justify-center"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6">
              <div className="relative h-48 rounded-xl overflow-hidden bg-zinc-900">
                <img src={selectedEvent.imageUrl || "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80"} alt={selectedEvent.title} className="w-full h-full object-cover opacity-80" />
                <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
                  <span className="px-2.5 py-0.5 rounded bg-teal-600 text-[10px] font-mono font-bold uppercase">{selectedEvent.scope}</span>
                  <h2 className="text-xl sm:text-2xl font-bold font-serif">{selectedEvent.title}</h2>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl font-mono text-xs">
                <div><span className="text-[10px] text-zinc-400 uppercase font-bold block">Organizer</span><span className="font-bold">{selectedEvent.organizer}</span></div>
                <div><span className="text-[10px] text-zinc-400 uppercase font-bold block">Date</span><span className="font-bold">{selectedEvent.startDate}</span></div>
                <div><span className="text-[10px] text-zinc-400 uppercase font-bold block">Venue</span><span className="font-bold">{selectedEvent.venue}, {selectedEvent.city}</span></div>
                <div><span className="text-[10px] text-zinc-400 uppercase font-bold block">CME Credits</span><span className="font-bold text-teal-600">{selectedEvent.cmeCredits} Hours</span></div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-mono font-bold uppercase text-zinc-900 dark:text-white">Overview</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-sans">{selectedEvent.description}</p>
              </div>

              {selectedEvent.objectives && selectedEvent.objectives.length > 0 && (
                <div className="space-y-2 bg-teal-50/50 dark:bg-teal-950/20 p-4 rounded-xl border border-teal-200/50">
                  <h4 className="text-xs font-mono font-bold uppercase text-teal-700 dark:text-teal-400">Objectives</h4>
                  <ul className="space-y-1 text-xs text-zinc-700 dark:text-zinc-300 list-disc list-inside">
                    {selectedEvent.objectives.map((obj, i) => <li key={i}>{obj}</li>)}
                  </ul>
                </div>
              )}

              {selectedEvent.schedule && selectedEvent.schedule.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-mono font-bold uppercase text-zinc-900 dark:text-white">Scientific Schedule</h3>
                  <div className="space-y-2 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-850 text-xs font-mono">
                    {selectedEvent.schedule.map((slot, sIdx) => (
                      <div key={sIdx} className="p-3 bg-zinc-50/30 dark:bg-zinc-900/30 flex justify-between gap-2">
                        <span className="font-bold text-teal-700 shrink-0 w-36">{slot.time}</span>
                        <div className="flex-1"><p className="font-sans font-bold text-zinc-900 dark:text-white">{slot.title}</p><p className="text-[11px] text-zinc-500">Speaker: {slot.speaker}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Action Bar with Register, Calendar, and Close */}
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-900 flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    setSelectedEvent(null);
                    setRegisteringEvent(selectedEvent);
                  }}
                  className="flex-1 min-w-[160px] py-3 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-mono text-xs font-bold uppercase transition-all"
                >
                  Register For Event
                </button>
                
                <a
                  href={getGoogleCalendarUrl(selectedEvent)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-xl font-mono text-xs font-bold flex items-center justify-center space-x-1.5 transition-all"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Google Calendar</span>
                </a>

                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-5 py-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-xl font-mono text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Close</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTRATION & DIGITAL TICKET */}
      {registeringEvent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
            <button onClick={() => { setRegisteringEvent(null); setActiveTicket(null); }} className="absolute top-4 right-4 text-zinc-400">
              <X className="w-5 h-5" />
            </button>

            {!activeTicket ? (
              <form onSubmit={handleRegisterSubmit} className="space-y-4 font-sans">
                <div>
                  <span className="text-[10px] font-mono font-bold text-teal-600 uppercase">CME Attendance Log</span>
                  <h3 className="text-xl font-bold font-serif text-zinc-900 dark:text-white line-clamp-1">Register: {registeringEvent.title}</h3>
                </div>

                <div className="space-y-3 text-xs font-mono">
                  <div>
                    <label className="block text-zinc-500 mb-1">Full Name</label>
                    <input required value={regName} onChange={e => setRegName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-zinc-500 mb-1">Email</label>
                    <input type="email" required value={regEmail} onChange={e => setRegEmail(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white" />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setRegisteringEvent(null)} className="flex-1 py-2.5 bg-zinc-100 dark:bg-zinc-900 font-mono text-xs font-bold">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 bg-teal-700 text-white font-mono text-xs font-bold uppercase">Confirm & Issue Ticket</button>
                </div>
              </form>
            ) : (
              <div className="space-y-5 text-center font-sans">
                <CheckCircle className="w-10 h-10 text-teal-600 mx-auto" />
                <h3 className="text-xl font-bold font-serif">Digital Pass Issued</h3>
                <div className="border border-dashed border-teal-500/40 bg-teal-50/5 dark:bg-zinc-900 rounded-2xl p-4 text-left font-mono text-xs space-y-2">
                  <p className="font-bold text-sm">{activeTicket.eventName}</p>
                  <p className="text-zinc-500">Attendee: {activeTicket.attendeeName}</p>
                  <p className="text-teal-600 font-bold">Ticket ID: {activeTicket.registrationId}</p>
                </div>
                <button onClick={() => { setRegisteringEvent(null); setActiveTicket(null); }} className="w-full py-2.5 bg-teal-700 text-white font-mono text-xs font-bold">Done</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: AI ASSISTANT CHAT */}
      {aiAssistantEvent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-2xl rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 h-[80vh] flex flex-col justify-between">
            <button onClick={() => setAiAssistantEvent(null)} className="absolute top-4 right-4 text-zinc-400">
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-zinc-100 dark:border-zinc-900 pb-3 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-teal-600" />
              <h3 className="text-base font-bold font-serif">AI Conference Assistant: {aiAssistantEvent.title}</h3>
            </div>

            <div className="flex-1 overflow-y-auto my-4 space-y-3 font-sans text-xs">
              {aiChatHistory.length === 0 && (
                <div className="text-center py-6 text-zinc-400 font-mono">Ask about session timings, cardiology talks, or flashcards.</div>
              )}
              {aiChatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`p-3 rounded-xl max-w-[85%] ${msg.role === "user" ? "bg-teal-700 text-white" : "bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200"}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex space-x-2">
              <input
                value={aiChatQuery}
                onChange={e => setAiChatQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSendAiChat()}
                placeholder="Ask AI Assistant..."
                className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
              />
              <button onClick={() => handleSendAiChat()} className="p-2 bg-teal-700 text-white rounded-xl"><Send className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: AI SUMMARY */}
      {aiSummaryEvent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-2xl rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 max-h-[85vh] overflow-y-auto space-y-4">
            <button onClick={() => setAiSummaryEvent(null)} className="absolute top-4 right-4 text-zinc-400">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold font-serif">AI Conference Summary & Notes</h3>
            {aiSummaryLoading ? (
              <p className="text-xs font-mono text-zinc-400">Generating summary...</p>
            ) : aiSummaryData ? (
              <div className="space-y-4 text-xs font-sans">
                <p className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl leading-relaxed">{aiSummaryData.executiveSummary}</p>
                <div>
                  <h4 className="font-bold text-teal-600 font-mono mb-1">High-Yield Clinical Pearls</h4>
                  <ul className="space-y-1 list-disc list-inside">{aiSummaryData.keyPearls?.map((p, i) => <li key={i}>{p}</li>)}</ul>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* MODAL 5: SUBMIT EVENT */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
            <button onClick={() => setShowSubmitModal(false)} className="absolute top-4 right-4 text-zinc-400">
              <X className="w-5 h-5" />
            </button>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const payload = {
                title: formData.get("title") as string,
                organizer: formData.get("organizer") as string,
                scope: formData.get("scope") as string,
                startDate: formData.get("startDate") as string,
                venue: formData.get("venue") as string,
                city: formData.get("city") as string,
                cost: formData.get("cost") as string || "Free",
                description: formData.get("description") as string
              };
              const res = await fetch("/api/scientific-events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
              const created = await res.json();
              setEvents(prev => [created, ...prev]);
              setShowSubmitModal(false);
              showToast("Event submitted!");
            }} className="space-y-3 font-sans text-xs">
              <h3 className="text-lg font-bold font-serif">Index Scientific Event</h3>
              <input name="title" required placeholder="Event Title *" className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900" />
              <input name="organizer" required placeholder="Organizer *" className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900" />
              <div className="grid grid-cols-2 gap-2">
                <select name="scope" className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                  <option value="Local">Local</option>
                  <option value="Nationwide">Nationwide</option>
                  <option value="International">International</option>
                </select>
                <input type="date" name="startDate" required className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900" />
              </div>
              <input name="venue" required placeholder="Venue *" className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900" />
              <input name="city" required placeholder="City *" className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900" />
              <textarea name="description" rows={3} placeholder="Description..." className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900" />
              <button type="submit" className="w-full py-2.5 bg-teal-700 text-white font-mono text-xs font-bold uppercase">Index Event</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: DASHBOARD */}
      {showDashboardModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-2xl rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
            <button onClick={() => setShowDashboardModal(false)} className="absolute top-4 right-4 text-zinc-400">
              <X className="w-5 h-5" />
            </button>
            <div className="flex justify-between items-center border-b pb-3 border-zinc-100 dark:border-zinc-900">
              <h3 className="text-xl font-bold font-serif">Clinician Dashboard</h3>
              <span className="text-xl font-mono font-bold text-teal-600">{earnedCredits} CME Credits</span>
            </div>
            <div className="space-y-2 text-xs font-mono">
              <h4 className="font-bold text-zinc-900 dark:text-white uppercase">Registered Events ({registeredEvents.length})</h4>
              {registeredEvents.map(reg => (
                <div key={reg.id} className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl flex justify-between items-center">
                  <div><p className="font-bold font-sans">{reg.eventName}</p><p className="text-zinc-500">ID: {reg.registrationId}</p></div>
                  {!reg.cmeClaimed ? (
                    <button onClick={() => handleClaimCme(reg.id, 4)} className="px-3 py-1 bg-amber-500 text-zinc-950 font-bold rounded">Claim 4 CME</button>
                  ) : <span className="text-teal-600 font-bold">Claimed ✓</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: AI RECOMMENDATIONS */}
      {showAiRecommendModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-xl rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
            <button onClick={() => setShowAiRecommendModal(false)} className="absolute top-4 right-4 text-zinc-400">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold font-serif">AI Academic Recommendations</h3>
            <div className="flex gap-2">
              <select value={recSpecialty} onChange={e => setRecSpecialty(e.target.value)} className="flex-1 px-3 py-2 border rounded-lg text-xs bg-white dark:bg-zinc-900">
                {ALL_SPECIALTIES.filter(s => s !== "All").map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={runRecommendationEngine} className="px-4 py-2 bg-teal-700 text-white font-mono text-xs font-bold rounded-lg">Run Match</button>
            </div>
            <div className="space-y-2 text-xs font-sans">
              {recResults.map(({ event, score, reason }) => (
                <div key={event.id} className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="font-mono text-[10px] text-teal-600 font-bold">{score}% Match</span>
                    <p className="font-bold">{event.title}</p>
                    <p className="text-[11px] text-zinc-500">{reason}</p>
                  </div>
                  <button onClick={() => { setSelectedEvent(event); setShowAiRecommendModal(false); }} className="px-2.5 py-1 bg-teal-700 text-white rounded font-mono text-[11px]">View</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
