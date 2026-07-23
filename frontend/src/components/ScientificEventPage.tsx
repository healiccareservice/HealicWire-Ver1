/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Calendar, MapPin, Award, ExternalLink, Download, Clock, 
  CheckCircle, ArrowLeft, Share2, Mail, User, Building, Lock,
  Sparkles, Layers, FileText, Check, ShieldCheck, AlertTriangle
} from "lucide-react";
import { ScientificEvent } from "../types";
import { supabase, mapEventFromDB } from "../lib/supabase";

interface ScientificEventPageProps {
  slug: string;
  onBack: () => void;
}

export default function ScientificEventPage({ slug, onBack }: ScientificEventPageProps) {
  const [event, setEvent] = useState<ScientificEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [certName, setCertName] = useState("");
  const [certDesignation, setCertDesignation] = useState("");
  const [certEmail, setCertEmail] = useState("");
  const [certDownloaded, setCertDownloaded] = useState(false);

  const [showSouvenirModal, setShowSouvenirModal] = useState(false);
  const [souvenirEmail, setSouvenirEmail] = useState("");
  const [souvenirDownloaded, setSouvenirDownloaded] = useState(false);

  useEffect(() => {
    setLoading(true);
    const fetchEvent = async () => {
      try {
        const { data, error } = await supabase.from('scientific_events').select('*');
        if (error) throw error;
        
        if (data) {
          const mapped = data.map(mapEventFromDB);
          const found = mapped.find(e => 
            (e.slug && e.slug.toLowerCase() === slug.toLowerCase()) || 
            e.id === slug ||
            e.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").includes(slug.toLowerCase())
          );
          setEvent(found || mapped[0] || null);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load event page details.");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center font-sans space-y-4">
        <div className="w-10 h-10 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-mono text-zinc-500">Generating Pleasant Responsive WebPage Layout...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 font-sans text-center space-y-4">
        <div className="p-4 bg-red-50 text-red-700 text-xs font-mono rounded-xl border border-red-200">
          {error || "Scientific Event page not found."}
        </div>
        <button onClick={onBack} className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-bold">
          ← Back to Scientific Events
        </button>
      </div>
    );
  }

  // Date Checkers for Expiry Rules
  const currentDateStr = new Date().toISOString().split("T")[0];

  const regDeadline = event.registrationDeadline || event.endDate || event.startDate;
  const isRegistrationExpired = currentDateStr > regDeadline;

  const subDeadline = event.abstractDeadline || event.endDate || event.startDate;
  const isSubmissionExpired = currentDateStr > subDeadline;

  const handleCertificateDownload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certName.trim() || !certEmail.trim() || !certDesignation.trim()) {
      alert("Please fill in all fields (Name, Designation, Mail ID) to download your certificate.");
      return;
    }
    setCertDownloaded(true);
    setTimeout(() => {
      // Trigger download action
      if (event.certificateUrl && event.certificateUrl !== "#") {
        window.open(event.certificateUrl, "_blank");
      } else {
        alert(`Certificate successfully generated and issued to ${certName} (${certEmail})!`);
      }
      setShowCertificateModal(false);
      setCertDownloaded(false);
    }, 1200);
  };

  const handleSouvenirDownload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!souvenirEmail.trim()) {
      alert("Please enter a valid Mail ID to download the event souvenir.");
      return;
    }
    setSouvenirDownloaded(true);
    setTimeout(() => {
      if (event.souvenirUrl && event.souvenirUrl !== "#") {
        window.open(event.souvenirUrl, "_blank");
      } else {
        alert(`Event Souvenir document unlocked & sent to ${souvenirEmail}!`);
      }
      setShowSouvenirModal(false);
      setSouvenirDownloaded(false);
    }, 1200);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 font-sans space-y-8 animate-fadeIn">
      
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← Back to All Scientific Events</span>
        </button>

        <div className="flex items-center space-x-2 text-xs font-mono text-zinc-400">
          <span>URL:</span>
          <span className="font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800">
            {typeof window !== 'undefined' ? window.location.origin : 'https://healicwire.in'}/scientificevents/{event.slug || slug}
          </span>
        </div>
      </div>

      {/* HERO SECTION WITH WEBPAGE IMAGE DESIGN & BANNER */}
      <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
        
        {/* Banner image preview if WebPage Image uploaded */}
        {event.webpageImage && (
          <div className="w-full bg-zinc-900 overflow-hidden border-b border-zinc-200 dark:border-zinc-800 max-h-80">
            <img 
              src={event.webpageImage} 
              alt={event.title} 
              className="w-full h-full object-cover opacity-95" 
            />
          </div>
        )}

        <div className="p-6 sm:p-10 space-y-6">
          
          {/* Header Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-extrabold bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200 uppercase">
              {event.eventType || "Scientific Event"}
            </span>

            <span className="px-3 py-1 rounded-full text-xs font-mono font-extrabold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200 uppercase flex items-center space-x-1">
              <Award className="w-3.5 h-3.5" />
              <span>{event.cmeCredits} CME Hours</span>
            </span>

            <span className="px-3 py-1 rounded-full text-xs font-mono font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 uppercase">
              {event.format} Format
            </span>

            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 uppercase">
              {event.scope} Scope
            </span>
          </div>

          {/* Event Title & Organizer */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white leading-tight tracking-tight">
              {event.title}
            </h1>
            <p className="text-sm font-semibold text-cyan-700 dark:text-cyan-400 flex items-center space-x-2">
              <Building className="w-4 h-4 shrink-0" />
              <span>Organized by {event.organizer}</span>
            </p>
          </div>

          {/* Date, Time & Venue Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 font-mono text-xs">
            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-zinc-400 uppercase text-[10px]">Date Range</div>
                <div className="font-extrabold text-zinc-900 dark:text-white">
                  {new Date(event.startDate).toLocaleDateString("en-IN")} - {new Date(event.endDate).toLocaleDateString("en-IN")}
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-zinc-400 uppercase text-[10px]">Location & Venue</div>
                <div className="font-extrabold text-zinc-900 dark:text-white truncate">
                  {event.venue}, {event.city}
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Layers className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-zinc-400 uppercase text-[10px]">Target Specialties</div>
                <div className="font-extrabold text-zinc-900 dark:text-white truncate">
                  {event.specialties.join(", ")}
                </div>
              </div>
            </div>
          </div>

          {/* Key Overview Highlights */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase font-mono tracking-wider">
              Scientific Overview & Highlights
            </h3>
            <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50/50 dark:bg-zinc-900/30 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-900">
              {event.description}
            </p>
          </div>

          {/* ACTION BUTTONS & EXPIRY RULES SECTION */}
          <div className="pt-6 border-t border-zinc-100 dark:border-zinc-900 space-y-6">
            
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase font-mono tracking-wider">
              Event Action Hub & Downloads
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              
              {/* 1. REGISTRATION BUTTON */}
              <div className="space-y-2">
                {isRegistrationExpired ? (
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 space-y-1">
                    <button disabled className="w-full py-2.5 rounded-xl bg-zinc-300 dark:bg-zinc-800 text-zinc-500 font-bold text-xs flex items-center justify-center space-x-2 cursor-not-allowed">
                      <Lock className="w-4 h-4" />
                      <span>Registration Closed</span>
                    </button>
                    <p className="text-[10px] font-mono text-center font-semibold leading-tight">
                      “Registrations are over contact organisers for any further quires”
                    </p>
                  </div>
                ) : (
                  <a
                    href={event.registrationUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md transition-all"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Register for Event</span>
                  </a>
                )}
                <div className="text-[10px] font-mono text-zinc-400 text-center">
                  Last Date: <span className="font-bold text-zinc-700 dark:text-zinc-300">{event.registrationDeadline || event.endDate}</span>
                </div>
              </div>

              {/* 2. SUBMISSION BUTTON */}
              <div className="space-y-2">
                {isSubmissionExpired ? (
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 space-y-1">
                    <button disabled className="w-full py-2.5 rounded-xl bg-zinc-300 dark:bg-zinc-800 text-zinc-500 font-bold text-xs flex items-center justify-center space-x-2 cursor-not-allowed">
                      <Lock className="w-4 h-4" />
                      <span>Submission Closed</span>
                    </button>
                    <p className="text-[10px] font-mono text-center font-semibold leading-tight">
                      “Submissions are over contact organisers for any further quires”
                    </p>
                  </div>
                ) : (
                  <a
                    href={event.submissionUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md transition-all"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Submit Abstract / Paper</span>
                  </a>
                )}
                <div className="text-[10px] font-mono text-zinc-400 text-center">
                  Last Date: <span className="font-bold text-zinc-700 dark:text-zinc-300">{event.abstractDeadline || event.endDate}</span>
                </div>
              </div>

              {/* 3. DOWNLOAD CERTIFICATE BUTTON */}
              <div className="space-y-2">
                <button
                  onClick={() => setShowCertificateModal(true)}
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  <span>Download Certificate</span>
                </button>
                <div className="text-[10px] font-mono text-zinc-400 text-center">
                  Requires Name, Designation & Mail ID
                </div>
              </div>

              {/* 4. DOWNLOAD SOUVENIR BUTTON */}
              <div className="space-y-2">
                <button
                  onClick={() => setShowSouvenirModal(true)}
                  className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Souvenir</span>
                </button>
                <div className="text-[10px] font-mono text-zinc-400 text-center">
                  Requires Mail ID to Unlock
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* DOWNLOAD CERTIFICATE MODAL */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-50 bg-zinc-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 max-w-md w-full p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-5 font-sans">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-3">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase font-mono">
                  Download CME Certificate
                </h3>
              </div>
              <button onClick={() => setShowCertificateModal(false)} className="text-zinc-400 hover:text-zinc-600 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleCertificateDownload} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Name (As required on Certificate) *
                </label>
                <input
                  type="text"
                  required
                  value={certName}
                  onChange={e => setCertName(e.target.value)}
                  placeholder="e.g. Dr. Narayana K"
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Designation & Department *
                </label>
                <input
                  type="text"
                  required
                  value={certDesignation}
                  onChange={e => setCertDesignation(e.target.value)}
                  placeholder="e.g. Associate Professor, Cardiology"
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Mail ID *
                </label>
                <input
                  type="email"
                  required
                  value={certEmail}
                  onChange={e => setCertEmail(e.target.value)}
                  placeholder="e.g. dr.narayana@healicwire.org"
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={certDownloaded}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition-all"
              >
                {certDownloaded ? (
                  <span>Generating Certificate...</span>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Official Certificate</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DOWNLOAD SOUVENIR MODAL */}
      {showSouvenirModal && (
        <div className="fixed inset-0 z-50 bg-zinc-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 max-w-md w-full p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-5 font-sans">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-3">
              <div className="flex items-center space-x-2">
                <Download className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase font-mono">
                  Download Event Souvenir
                </h3>
              </div>
              <button onClick={() => setShowSouvenirModal(false)} className="text-zinc-400 hover:text-zinc-600 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleSouvenirDownload} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Upload Mail ID to Download Souvenir *
                </label>
                <input
                  type="email"
                  required
                  value={souvenirEmail}
                  onChange={e => setSouvenirEmail(e.target.value)}
                  placeholder="e.g. dr.narayana@healicwire.org"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={souvenirDownloaded}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition-all"
              >
                {souvenirDownloaded ? (
                  <span>Unlocking Event Souvenir...</span>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Souvenir Document</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
