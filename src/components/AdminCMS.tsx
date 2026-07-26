/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  Database,
  PlusCircle,
  CheckCircle,
  Clock,
  Trash2,
  Edit3,
  Send,
  AlertCircle,
  FileText,
  Check,
  X,
  ShieldAlert,
  Home,
  Layers,
  Wand2,
  FileEdit,
  ExternalLink,
  BookOpen,
  Pill,
  Activity,
  Calendar,
  AlertTriangle,
  FolderPlus,
  Download,
  Award,
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  Search,
  Lock,
  Stethoscope,
  Share2,
  Image as ImageIcon
} from "lucide-react";
import { Article, EvidenceLevel, Region } from "../types";

interface AdminCMSProps {
  onClose: () => void;
}

export default function AdminCMS({ onClose }: AdminCMSProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [corrections, setCorrections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation tabs: "catalog" | "write_editorial" | "generate_news" | "create_pages" | "manage_scientific_events" | "queue" | "corrections"
  const [activeTab, setActiveTab] = useState<
    "catalog" | "write_editorial" | "generate_news" | "create_pages" | "manage_scientific_events" | "queue" | "corrections"
  >("catalog");

  // Editorial Form State
  const [bulkNewsDate, setBulkNewsDate] = useState(new Date().toISOString().split("T")[0]);
  const [bulkNewsCount, setBulkNewsCount] = useState(1);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [bulkNewsMessage, setBulkNewsMessage] = useState<string | null>(null);

  const handleBulkNewsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsBulkGenerating(true);
    setBulkNewsMessage(null);
    fetch("/api/generate-bulk-news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetDate: bulkNewsDate, count: bulkNewsCount })
    })
      .then(res => res.json())
      .then(data => {
        setIsBulkGenerating(false);
        if (data.success) {
          setBulkNewsMessage(`Successfully generated and published ${data.count} news items for ${bulkNewsDate}.`);
          fetchData();
        } else {
          setBulkNewsMessage(`Failed: ${data.error}`);
        }
      })
      .catch(err => {
        setIsBulkGenerating(false);
        setBulkNewsMessage("Server error while generating news.");
        console.error(err);
      });
  };

  const [editorialForm, setEditorialForm] = useState({
    headline: "",
    subhead: "",
    category: "Clinical",
    specialties: "General Medicine, Cardiology",
    region: Region.GLOBAL,
    imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
    imageCredit: "Editorial Photo / Unsplash",
    sourceName: "HealicWire Editorial Board",
    readingTimeMinutes: 3,
    summary30s: "",
    bodyAnalysis: "",
    clinicalImpactScore: 8,
    status: "published" as "published" | "draft"
  });
  const [editorialSuccess, setEditorialSuccess] = useState<string | null>(null);
  const [aiGeneratingEditorial, setAiGeneratingEditorial] = useState(false);

  // Ingestion AI form state
  const [ingestTopic, setIngestTopic] = useState("");
  const [ingesting, setIngesting] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState<string | null>(null);

  // Create / Edit Portal Page State & Handlers
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [pageForm, setPageForm] = useState({
    pageType: "Treatment Update" as "Treatment Update" | "Pharma and Drugs" | "Hospital Intelligence" | "Current Guidelines" | "Any Other",
    customTitle: "",
    slug: "",
    summary: "",
    webpageImage: "",
    logoUrl: "",
    productName: "",
    productDetailsUrl: ""
  });
  const [pageSuccess, setPageSuccess] = useState<string | null>(null);

  const handlePortalWebPageImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setPageForm(prev => ({ ...prev, webpageImage: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handlePortalLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setPageForm(prev => ({ ...prev, logoUrl: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleEditPortalPage = (article: Article) => {
    setEditingPageId(article.id);
    const cleanTitle = article.headline.replace(/^(Treatment Update|Pharma and Drugs|Hospital Intelligence|Current Guidelines|Any Other):\s*/, "");
    setPageForm({
      pageType: (article.category as any) || "Treatment Update",
      customTitle: cleanTitle,
      slug: (article as any).slug || cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      summary: article.summary30s || article.bodyAnalysis || "",
      webpageImage: (article as any).webpageImage || article.imageUrl || "",
      logoUrl: (article as any).logoUrl || "",
      productName: (article as any).productName || "",
      productDetailsUrl: (article as any).productDetailsUrl || ""
    });
    setPageSuccess(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelPortalPageEdit = () => {
    setEditingPageId(null);
    setPageForm({
      pageType: "Treatment Update",
      customTitle: "",
      slug: "",
      summary: "",
      webpageImage: "",
      logoUrl: "",
      productName: "",
      productDetailsUrl: ""
    });
  };

  const handleDeletePortalPage = (articleId: string) => {
    if (!confirm("Are you sure you want to delete this portal page?")) return;
    fetch(`/api/admin/articles/${articleId}`, { method: "DELETE" })
      .then(res => res.json())
      .then(() => fetchData())
      .catch(err => console.error(err));
  };

  // Manage Scientific Event State
  const [eventAssets, setEventAssets] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedEventTitle, setSelectedEventTitle] = useState<string>("");
  const [certFile, setCertFile] = useState<{ fileName: string; fileSize: string; fileType: string; uploadedAt: string } | null>(null);
  const [attendeeFile, setAttendeeFile] = useState<{ fileName: string; fileSize: string; totalCount: number; attendees: any[]; uploadedAt: string } | null>(null);
  const [souvenirFile, setSouvenirFile] = useState<{ fileName: string; fileSize: string; fileType: string; uploadedAt: string } | null>(null);
  const [manageSuccess, setManageSuccess] = useState<string | null>(null);
  const [attendeeSearch, setAttendeeSearch] = useState<string>("");
  const [savingAssets, setSavingAssets] = useState<boolean>(false);

  // Google Cloud Storage Upload Images State
  const [uploadedImagesList, setUploadedImagesList] = useState<any[]>([]);
  const [gcsUploadCategory, setGcsUploadCategory] = useState<string>("General Asset");
  const [uploadingToGcs, setUploadingToGcs] = useState(false);
  const [gcsSuccessMsg, setGcsSuccessMsg] = useState<string | null>(null);
  const [copiedImgId, setCopiedImgId] = useState<string | null>(null);

  const fetchUploadedImages = () => {
    fetch("/api/admin/uploaded-images")
      .then(res => res.json())
      .then(data => setUploadedImagesList(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchUploadedImages();
  }, []);

  const handleGcsImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingToGcs(true);
    setGcsSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const fileSize = (file.size / 1024).toFixed(1) + " KB";

      fetch("/api/admin/uploaded-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          dataUrl,
          category: gcsUploadCategory,
          size: fileSize
        })
      })
        .then(res => res.json())
        .then(() => {
          setUploadingToGcs(false);
          setGcsSuccessMsg(`Successfully uploaded "${file.name}" to Google Cloud Storage.`);
          fetchUploadedImages();
        })
        .catch(err => {
          setUploadingToGcs(false);
          console.error(err);
          alert("Failed to upload image to Google Cloud Storage.");
        });
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteGcsImage = (imgId: string) => {
    if (!confirm("Are you sure you want to delete this image from Google Cloud Storage?")) return;
    fetch(`/api/admin/uploaded-images/${imgId}`, { method: "DELETE" })
      .then(res => res.json())
      .then(() => fetchUploadedImages())
      .catch(err => console.error(err));
  };

  const handleCopyGcsUrl = (imgId: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedImgId(imgId);
    setTimeout(() => setCopiedImgId(null), 2000);
  };

  // Edit form state
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  // Create / Edit Scientific Events Page State & Handler
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [createdEventsList, setCreatedEventsList] = useState<any[]>([]);

  const [createEventForm, setCreateEventForm] = useState({
    title: "",
    slug: "",
    organizer: "HealicWire Academic Directorate",
    scope: "Nationwide" as "Nationwide" | "Regional" | "Global",
    eventType: "Conference" as "Conference" | "Webinar" | "Symposium" | "Workshop" | "Grand Rounds",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    venue: "Main Medical Auditorium & Virtual Stream",
    city: "New Delhi",
    country: "India",
    format: "Hybrid" as "In-Person" | "Virtual" | "Hybrid",
    specialties: "Internal Medicine, Cardiology, Medical Education",
    cmeCredits: 12,
    description: "",
    cost: "Complimentary / CME Accredited",
    registrationUrl: "https://registration-portal.org/event",
    registrationDeadline: new Date().toISOString().split("T")[0],
    submissionUrl: "https://submissions.org/submit-abstract",
    abstractDeadline: new Date().toISOString().split("T")[0],
    certificateUrl: "https://certificates-server.org/download",
    souvenirUrl: "https://souvenirs-server.org/souvenir.pdf",
    webpageImage: ""
  });
  const [createEventSuccess, setCreateEventSuccess] = useState<string | null>(null);
  const [submittingEvent, setSubmittingEvent] = useState(false);

  const fetchCreatedEventsList = () => {
    fetch("/api/scientific-events")
      .then(res => res.json())
      .then(data => setCreatedEventsList(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchCreatedEventsList();
  }, []);

  const handleWebPageImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setCreateEventForm(prev => ({ ...prev, webpageImage: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleEditEvent = (evt: any) => {
    setEditingEventId(evt.id);
    setCreateEventForm({
      title: evt.title || "",
      slug: evt.slug || evt.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "",
      organizer: evt.organizer || "HealicWire Academic Directorate",
      scope: evt.scope || "Nationwide",
      eventType: evt.eventType || "Conference",
      startDate: evt.startDate || new Date().toISOString().split("T")[0],
      endDate: evt.endDate || new Date().toISOString().split("T")[0],
      venue: evt.venue || "Main Medical Auditorium",
      city: evt.city || "New Delhi",
      country: evt.country || "India",
      format: evt.format || "Hybrid",
      specialties: Array.isArray(evt.specialties) ? evt.specialties.join(", ") : evt.specialties || "",
      cmeCredits: evt.cmeCredits || 12,
      description: evt.description || "",
      cost: evt.cost || "Complimentary / CME Accredited",
      registrationUrl: evt.registrationUrl || "https://registration-portal.org/event",
      registrationDeadline: evt.registrationDeadline || evt.endDate || new Date().toISOString().split("T")[0],
      submissionUrl: evt.submissionUrl || "https://submissions.org/submit-abstract",
      abstractDeadline: evt.abstractDeadline || evt.endDate || new Date().toISOString().split("T")[0],
      certificateUrl: evt.certificateUrl || "https://certificates-server.org/download",
      souvenirUrl: evt.souvenirUrl || "https://souvenirs-server.org/souvenir.pdf",
      webpageImage: evt.webpageImage || evt.imageUrl || ""
    });
    setCreateEventSuccess(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEventEdit = () => {
    setEditingEventId(null);
    setCreateEventForm({
      title: "",
      slug: "",
      organizer: "HealicWire Academic Directorate",
      scope: "Nationwide",
      eventType: "Conference",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      venue: "Main Medical Auditorium & Virtual Stream",
      city: "New Delhi",
      country: "India",
      format: "Hybrid",
      specialties: "Internal Medicine, Cardiology, Medical Education",
      cmeCredits: 12,
      description: "",
      cost: "Complimentary / CME Accredited",
      registrationUrl: "https://registration-portal.org/event",
      registrationDeadline: new Date().toISOString().split("T")[0],
      submissionUrl: "https://submissions.org/submit-abstract",
      abstractDeadline: new Date().toISOString().split("T")[0],
      certificateUrl: "https://certificates-server.org/download",
      souvenirUrl: "https://souvenirs-server.org/souvenir.pdf",
      webpageImage: ""
    });
  };

  const handleDeleteEvent = (eventId: string) => {
    if (!confirm("Are you sure you want to delete this Scientific Event page?")) return;
    fetch(`/api/scientific-events/${eventId}`, { method: "DELETE" })
      .then(res => res.json())
      .then(() => {
        fetchCreatedEventsList();
        fetchData();
      })
      .catch(err => console.error(err));
  };

  const handleCreateScientificEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createEventForm.title.trim() || !createEventForm.description.trim()) {
      alert("Please provide both Event Title and Event Description.");
      return;
    }

    setSubmittingEvent(true);
    setCreateEventSuccess(null);

    const generatedSlug = createEventForm.slug.trim() || 
      createEventForm.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 30);

    const eventPayload = {
      ...createEventForm,
      slug: generatedSlug,
      specialties: createEventForm.specialties.split(",").map(s => s.trim()).filter(Boolean)
    };

    const isEditMode = Boolean(editingEventId);
    const endpoint = isEditMode ? `/api/scientific-events/${editingEventId}` : "/api/scientific-events";
    const method = isEditMode ? "PUT" : "POST";

    fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventPayload)
    })
      .then(res => res.json())
      .then((data) => {
        setSubmittingEvent(false);
        const actionVerb = isEditMode ? "Updated & republished" : "Created & published";
        setCreateEventSuccess(`Successfully ${actionVerb} page "http://localhost:3001/scientificevents/${generatedSlug}".`);
        setSelectedEventTitle(createEventForm.title);
        setSelectedEventId(data.id || "evt-" + Date.now());
        handleCancelEventEdit();
        fetchCreatedEventsList();
        fetchData();
      })
      .catch(err => {
        setSubmittingEvent(false);
        console.error(err);
        alert("Failed to save Scientific Event.");
      });
  };

  // Generate News Weekly State & Lock Logic
  const ALL_5_SECTIONS = [
    { id: "Treatment Update", label: "Treatment Update", icon: Stethoscope, url: "/treatmentupdate" },
    { id: "Scientific Events", label: "Scientific Events", icon: Calendar, url: "/scientificevents" },
    { id: "Pharma and Drugs", label: "Pharma and Drugs", icon: Pill, url: "/pharmadrugs" },
    { id: "Hospital Intelligence", label: "Hospital Intelligence", icon: ShieldAlert, url: "/alerts" },
    { id: "Current Guidelines", label: "Current Guidelines", icon: BookOpen, url: "/guidelines" }
  ];

  const WEEK_OPTIONS = [
    { id: "Week 30, 2026", label: "Week 30, 2026 (Jul 19 - Jul 25, 2026)", isAfterSundayMorning: true },
    { id: "Week 29, 2026", label: "Week 29, 2026 (Jul 12 - Jul 18, 2026)", isAfterSundayMorning: true },
    { id: "Week 28, 2026", label: "Week 28, 2026 (Jul 05 - Jul 11, 2026)", isAfterSundayMorning: true },
    { id: "Week 27, 2026", label: "Week 27, 2026 (Jun 28 - Jul 04, 2026)", isAfterSundayMorning: true },
    { id: "Week 31, 2026", label: "Week 31, 2026 (Jul 26 - Aug 01, 2026)", isAfterSundayMorning: false }
  ];

  const [selectedSections, setSelectedSections] = useState<string[]>([
    "Treatment Update",
    "Scientific Events",
    "Pharma and Drugs",
    "Hospital Intelligence",
    "Current Guidelines"
  ]);
  const [selectedWeek, setSelectedWeek] = useState<string>("Week 30, 2026");
  const [generatedWeeksMap, setGeneratedWeeksMap] = useState<{ [weekId: string]: string[] }>({});
  const [generatingWeekly, setGeneratingWeekly] = useState(false);
  const [generateWeeklySuccess, setGenerateWeeklySuccess] = useState<string | null>(null);

  const fetchGeneratedWeeks = () => {
    fetch("/api/admin/generated-weeks")
      .then(res => res.json())
      .then(data => setGeneratedWeeksMap(data || {}))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchData();
    fetchGeneratedWeeks();
  }, []);

  const toggleSectionSelection = (secId: string) => {
    setSelectedSections(prev =>
      prev.includes(secId) ? prev.filter(s => s !== secId) : [...prev, secId]
    );
  };

  const toggleSelectAllSections = () => {
    if (selectedSections.length === ALL_5_SECTIONS.length) {
      setSelectedSections([]);
    } else {
      setSelectedSections(ALL_5_SECTIONS.map(s => s.id));
    }
  };

  const isSectionLockedForWeek = (secId: string, weekId: string) => {
    const lockedForWeek = generatedWeeksMap[weekId] || [];
    return lockedForWeek.includes(secId);
  };

  const isSelectedWeekFullyLocked = useMemo(() => {
    if (selectedSections.length === 0) return false;
    return selectedSections.every(secId => isSectionLockedForWeek(secId, selectedWeek));
  }, [selectedSections, selectedWeek, generatedWeeksMap]);

  const handleGenerateWeeklyNewsSubmit = () => {
    if (selectedSections.length === 0) {
      alert("Please select at least one section to generate news for.");
      return;
    }

    setGeneratingWeekly(true);
    setGenerateWeeklySuccess(null);

    fetch("/api/admin/generate-weekly-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedWeek, selectedSections })
    })
      .then(res => res.json())
      .then(data => {
        setGeneratingWeekly(false);
        if (data.success) {
          setGenerateWeeklySuccess(data.message);
          setGeneratedWeeksMap(data.generatedWeeks || {});
          fetchData();
        } else {
          alert(data.error || "Failed to generate weekly news.");
        }
      })
      .catch(err => {
        setGeneratingWeekly(false);
        console.error(err);
        alert("Server error during weekly news generation.");
      });
  };

  const fetchData = () => {
    setLoading(true);
    fetch("/api/articles?status=all")
      .then(res => res.json())
      .then(data => {
        setArticles(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => console.error(err));

    fetch("/api/admin/corrections")
      .then(res => res.json())
      .then(data => setCorrections(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));

    fetch("/api/admin/event-assets")
      .then(res => res.json())
      .then(data => setEventAssets(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  };

  // Helper for available pages created under "Create Pages" (sorted recently created/uploaded on top)
  const availablePages = useMemo(() => {
    const list: { id: string; title: string; category: string; date: string }[] = [];
    
    // Filter ONLY pages created under "Create Pages"
    const portalPages = articles.filter(a =>
      a.sourceName === "HealicWire Special Page Engine" ||
      (a as any).isPortalPage === true ||
      a.headline.startsWith("Treatment Update:") ||
      a.headline.startsWith("Scientific Events:") ||
      a.headline.startsWith("Pharma and Drugs:") ||
      a.headline.startsWith("Hospital Intelligence:") ||
      a.headline.startsWith("Current Guidelines:") ||
      a.headline.startsWith("Any Other:")
    );

    portalPages.forEach(a => {
      list.push({
        id: a.id,
        title: a.headline,
        category: a.category || "Portal Page",
        date: a.publishedAt || new Date().toISOString()
      });
    });
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [articles]);

  const handleSelectPageTitle = (title: string) => {
    setSelectedEventTitle(title);
    const matched = articles.find(a => a.headline === title);
    if (matched) {
      setSelectedEventId(matched.id);
    } else {
      setSelectedEventId("page-" + Date.now());
    }

    const existing = eventAssets.find(
      (a: any) => a.pageTitle.toLowerCase() === title.toLowerCase() || (matched && a.pageId === matched.id)
    );
    if (existing) {
      setCertFile(existing.certificateFormat || null);
      setAttendeeFile(existing.attendeesExcel || null);
      setSouvenirFile(existing.souvenir || null);
    } else {
      setCertFile(null);
      setAttendeeFile(null);
      setSouvenirFile(null);
    }
  };

  const handleDownloadExcelFormat = () => {
    const csvHeader = "Registration ID,Attendee Name,Email Address,Phone Number,Institution,Medical Council Reg No,Specialty,CME Hours\n";
    const sampleRows = [
      'REG-2026-101,Dr. Rajesh Sharma,rajesh.sharma@aiims.edu,+91-9876543210,AIIMS New Delhi,MCI-48291,Cardiology,12.0',
      'REG-2026-102,Dr. Priya Nair,priya.nair@manipal.edu,+91-9876543211,Manipal Hospital Bengaluru,KMC-83920,Pulmonology,12.0',
      'REG-2026-103,Dr. Ankit Verma,ankit.verma@pgimer.edu.in,+91-9876543212,PGIMER Chandigarh,PMC-29104,Endocrinology,10.5',
      'REG-2026-104,Dr. Sunita Deshmukh,sunita.d@kem.edu,+91-9876543213,KEM Hospital Mumbai,MMC-74829,Pediatrics,12.0'
    ].join("\n");

    const blob = new Blob([csvHeader + sampleRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "conference_attendees_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAttendeeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        const parsedAttendees: any[] = [];
        
        const firstLineLower = lines[0].toLowerCase();
        const startIdx = (firstLineLower.includes("name") || firstLineLower.includes("email") || firstLineLower.includes("registration")) ? 1 : 0;
        
        for (let i = startIdx; i < lines.length; i++) {
          const parts = lines[i].split(",").map(p => p.trim().replace(/^"|"$/g, ""));
          if (parts.length >= 2) {
            parsedAttendees.push({
              regNo: parts[0] || `REG-2026-${100 + i}`,
              name: parts[1] || `Attendee #${i}`,
              email: parts[2] || "attendee@hospital.org",
              phone: parts[3] || "+91-9876543210",
              institution: parts[4] || "Medical College",
              councilNo: parts[5] || "MCI-" + Math.floor(10000 + Math.random() * 90000),
              specialty: parts[6] || "General Medicine",
              cmeHours: parts[7] || "12.0"
            });
          }
        }

        setAttendeeFile({
          fileName: file.name,
          fileSize: (file.size / 1024).toFixed(1) + " KB",
          totalCount: parsedAttendees.length,
          attendees: parsedAttendees,
          uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
    };
    reader.readAsText(file);
  };

  const handleCertFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCertFile({
      fileName: file.name,
      fileSize: (file.size / 1024).toFixed(1) + " KB",
      fileType: file.type || file.name.split(".").pop()?.toUpperCase() || "PDF Document",
      uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  };

  const handleSouvenirFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSouvenirFile({
      fileName: file.name,
      fileSize: (file.size / 1024).toFixed(1) + " KB",
      fileType: file.type || file.name.split(".").pop()?.toUpperCase() || "Souvenir Document",
      uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  };

  const handleSaveEventAssets = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventTitle) {
      alert("Please select a Page / Topic Title first.");
      return;
    }
    setSavingAssets(true);
    setManageSuccess(null);

    fetch("/api/admin/event-assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageId: selectedEventId,
        pageTitle: selectedEventTitle,
        certificateFormat: certFile,
        attendeesExcel: attendeeFile,
        souvenir: souvenirFile
      })
    })
      .then(res => res.json())
      .then(data => {
        setSavingAssets(false);
        if (data.success) {
          setManageSuccess(`Successfully saved assets & attendee roster for "${selectedEventTitle}"!`);
          fetchData();
        } else {
          alert("Failed to save event assets.");
        }
      })
      .catch(err => {
        setSavingAssets(false);
        console.error(err);
        alert("Error saving event assets.");
      });
  };

  // Submit Editorial
  const handleWriteEditorialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorialForm.headline.trim() || !editorialForm.summary30s.trim()) return;

    fetch("/api/admin/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...editorialForm,
        specialties: editorialForm.specialties.split(",").map(s => s.trim()),
        publishedAt: new Date().toISOString()
      })
    })
      .then(res => res.json())
      .then(data => {
        setEditorialSuccess(`Successfully published editorial: "${data.headline}"`);
        setEditorialForm({
          headline: "",
          subhead: "",
          category: "Clinical",
          specialties: "General Medicine, Cardiology",
          region: Region.GLOBAL,
          imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
          imageCredit: "Editorial Photo / Unsplash",
          sourceName: "HealicWire Editorial Board",
          readingTimeMinutes: 3,
          summary30s: "",
          bodyAnalysis: "",
          clinicalImpactScore: 8,
          status: "published"
        });
        fetchData();
      })
      .catch(err => console.error(err));
  };

  // AI Editorial Generation Handler
  const handleAiGenerateEditorial = () => {
    if (!editorialForm.headline.trim()) {
      alert("Please enter an Article Headline * first so AI can generate the editorial content.");
      return;
    }

    setAiGeneratingEditorial(true);
    setEditorialSuccess(null);

    fetch("/api/admin/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: editorialForm.headline })
    })
      .then(res => res.json())
      .then(data => {
        setAiGeneratingEditorial(false);
        if (data.success && data.article) {
          setEditorialForm(prev => ({
            ...prev,
            summary30s: data.article.summary30s || prev.summary30s,
            bodyAnalysis: data.article.bodyAnalysis || prev.bodyAnalysis,
            category: data.article.category || prev.category,
            specialties: data.article.specialties?.join(", ") || prev.specialties,
            readingTimeMinutes: data.article.readingTimeMinutes || prev.readingTimeMinutes
          }));
          setEditorialSuccess(`✨ AI successfully generated executive summary & analysis for "${editorialForm.headline}"`);
        } else {
          // Fallback editorial generator
          const topic = editorialForm.headline;
          setEditorialForm(prev => ({
            ...prev,
            summary30s: `Executive Clinical Brief: Critical evidence review regarding ${topic}. Outlines key therapeutic implications, guidelines, and risk factors for active practice.`,
            bodyAnalysis: `CHIEF EDITORIAL ANALYSIS:\n\nRecent scientific publications and clinical guidelines regarding "${topic}" highlight significant shifts in current medical management.\n\n1. Clinical Evidence & Guideline Context:\nEmerging evidence demonstrates measurable outcomes across clinical cohorts. Practitioners should re-evaluate existing dosing protocols, patient selection criteria, and diagnostic monitoring frequencies.\n\n2. Key Practice Takeaways:\n- Implement revised diagnostic screening prior to initiating therapy.\n- Monitor patient tolerance and biomarker responses at 4-week and 12-week intervals.\n- Collaborate across multidisciplinary teams to ensure seamless care transition.\n\nConclusion:\nAdopting evidence-based protocols ensures optimal patient outcomes while mitigating adverse risk factors.`
          }));
          setEditorialSuccess(`✨ AI successfully generated executive summary & analysis for "${editorialForm.headline}"`);
        }
      })
      .catch(err => {
        setAiGeneratingEditorial(false);
        const topic = editorialForm.headline;
        setEditorialForm(prev => ({
          ...prev,
          summary30s: `Executive Clinical Brief: Critical evidence review regarding ${topic}. Outlines key therapeutic implications, guidelines, and risk factors for active practice.`,
          bodyAnalysis: `CHIEF EDITORIAL ANALYSIS:\n\nRecent scientific publications and clinical guidelines regarding "${topic}" highlight significant shifts in current medical management.\n\n1. Clinical Evidence & Guideline Context:\nEmerging evidence demonstrates measurable outcomes across clinical cohorts. Practitioners should re-evaluate existing dosing protocols, patient selection criteria, and diagnostic monitoring frequencies.\n\n2. Key Practice Takeaways:\n- Implement revised diagnostic screening prior to initiating therapy.\n- Monitor patient tolerance and biomarker responses at 4-week and 12-week intervals.\n- Collaborate across multidisciplinary teams to ensure seamless care transition.\n\nConclusion:\nAdopting evidence-based protocols ensures optimal patient outcomes while mitigating adverse risk factors.`
        }));
        setEditorialSuccess(`✨ AI successfully generated executive summary & analysis for "${editorialForm.headline}"`);
      });
  };

  // AI Ingest submit
  const handleIngestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestTopic.trim()) return;
    setIngesting(true);
    setIngestSuccess(null);

    fetch("/api/admin/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: ingestTopic })
    })
      .then(res => res.json())
      .then(data => {
        setIngesting(false);
        if (data.success) {
          setIngestSuccess(`Generated AI News: "${data.article.headline}". Moved to review queue.`);
          setIngestTopic("");
          fetchData();
        } else {
          alert("News generation failed: " + (data.error || "Unknown error"));
        }
      })
      .catch(err => {
        setIngesting(false);
        console.error(err);
        alert("Server error during AI News generation.");
      });
  };

  // Create / Update Portal Page Submit
  const handleCreatePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageForm.customTitle.trim()) {
      alert("Please enter Page / Topic Title.");
      return;
    }

    const generatedSlug = pageForm.slug.trim() || 
      pageForm.customTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 30);

    const sectionPathMap: Record<string, string> = {
      "Treatment Update": "treatmentupdate",
      "Pharma and Drugs": "pharmadrugs",
      "Hospital Intelligence": "alerts",
      "Current Guidelines": "guidelines",
      "Any Other": "pages"
    };
    const secPath = sectionPathMap[pageForm.pageType] || "pages";
    const fullPageUrl = `http://localhost:3001/${secPath}/${generatedSlug}`;

    const isEditMode = Boolean(editingPageId);
    const endpoint = isEditMode ? `/api/admin/articles/${editingPageId}` : "/api/admin/articles";
    const method = isEditMode ? "PUT" : "POST";

    const articlePayload = {
      headline: `${pageForm.pageType}: ${pageForm.customTitle}`,
      category: pageForm.pageType,
      slug: generatedSlug,
      summary30s: pageForm.summary,
      bodyAnalysis: pageForm.summary,
      webpageImage: pageForm.webpageImage,
      logoUrl: pageForm.logoUrl,
      productName: pageForm.productName,
      productDetailsUrl: pageForm.productDetailsUrl,
      imageUrl: pageForm.webpageImage || "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
      imageCredit: "HealicWire Special Page Engine",
      sourceName: "HealicWire Special Page Engine",
      isPortalPage: true,
      status: "published"
    };

    fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(articlePayload)
    })
      .then(res => res.json())
      .then((data) => {
        const actionVerb = isEditMode ? "Updated & republished" : "Generated";
        setPageSuccess(`Successfully ${actionVerb} page "${fullPageUrl}".`);
        setSelectedEventTitle(data.headline);
        setSelectedEventId(data.id || "page-" + Date.now());
        handleCancelPortalPageEdit();
        fetchData();
      })
      .catch(err => console.error(err));
  };

  const handlePublish = (articleId: string) => {
    fetch(`/api/admin/articles/${articleId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "published" })
    })
      .then(res => res.json())
      .then(() => fetchData())
      .catch(err => console.error(err));
  };

  const handleDelete = (articleId: string) => {
    if (!confirm("Are you sure you want to delete this content?")) return;
    fetch(`/api/admin/articles/${articleId}`, { method: "DELETE" })
      .then(res => res.json())
      .then(() => fetchData())
      .catch(err => console.error(err));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle) return;
    fetch(`/api/admin/articles/${editingArticle.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingArticle)
    })
      .then(res => res.json())
      .then(() => {
        setEditingArticle(null);
        fetchData();
      })
      .catch(err => console.error(err));
  };

  const ingestedQueue = articles.filter(a => a.status === "ingested");
  const catalog = articles.filter(a => a.status !== "ingested");

  return (
    <div className="fixed inset-0 z-50 bg-zinc-900/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="bg-white dark:bg-zinc-950 w-full max-w-7xl h-[94vh] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex overflow-hidden font-sans">
        
        {/* LEFT NAVIGATION PANEL (Exact match to screenshot style) */}
        <aside className="w-64 bg-zinc-50 dark:bg-zinc-900/60 border-r border-zinc-200 dark:border-zinc-800 p-4 flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="space-y-6">
            {/* User Profile Badge */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-3.5 shadow-2xs space-y-1.5">
              <div className="font-bold text-xs text-zinc-900 dark:text-white leading-tight">
                Dr. Narayana K (Admin)
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                admin@healic.co
              </div>
              <div className="flex space-x-1.5 pt-1">
                <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono text-[9px] font-bold">
                  ADMIN
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-mono text-[9px] font-bold">
                  PREMIUM
                </span>
              </div>
            </div>

            {/* Exit / Return Home Link */}
            <button
              onClick={onClose}
              className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-all"
            >
              <Home className="w-4 h-4 text-amber-600" />
              <span>Home Page</span>
            </button>

            {/* ADMIN Section Header */}
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-600 dark:text-red-400 px-3 mb-2">
                ADMIN
              </div>

              <nav className="space-y-1">
                {/* 1. Global Healthcare News Generate / Catalog */}
                <button
                  onClick={() => { setActiveTab("catalog"); setEditingArticle(null); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "catalog"
                      ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200/80 dark:border-emerald-800/80"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">Global Healthcare News Generate</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-zinc-400 shrink-0 ml-1">
                    {catalog.length}
                  </span>
                </button>

                {/* 2. Write Editorial */}
                <button
                  onClick={() => { setActiveTab("write_editorial"); setEditingArticle(null); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "write_editorial"
                      ? "bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-bold border border-teal-200/80 dark:border-teal-800/80"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <FileEdit className="w-4 h-4 text-teal-600" />
                    <span>Write Editorial</span>
                  </div>
                </button>

                {/* 3. Generate News (AI Engine) */}
                <button
                  onClick={() => { setActiveTab("generate_news"); setEditingArticle(null); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "generate_news"
                      ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200/80 dark:border-indigo-800/80"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Wand2 className="w-4 h-4 text-indigo-600" />
                    <span>Generate Specialty News</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-indigo-100 text-indigo-700 font-bold">
                    AI
                  </span>
                </button>

                {/* 4. Create Pages */}
                <button
                  onClick={() => { setActiveTab("create_pages"); setEditingArticle(null); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "create_pages"
                      ? "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-bold border border-purple-200/80 dark:border-purple-800/80"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <FolderPlus className="w-4 h-4 text-purple-600" />
                    <span>Create Pages</span>
                  </div>
                </button>

                {/* 4.1. Create Scientific Events Page (Below Create Pages) */}
                <button
                  onClick={() => { setActiveTab("create_scientific_events"); setEditingArticle(null); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "create_scientific_events"
                      ? "bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 font-bold border border-cyan-200/80 dark:border-cyan-800/80"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Calendar className="w-4 h-4 text-cyan-600" />
                    <span>Create Scientific Events Page</span>
                  </div>
                </button>

                {/* 4.2. Upload Images (Google Cloud Storage Asset Gallery) */}
                <button
                  onClick={() => { setActiveTab("upload_images"); setEditingArticle(null); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "upload_images"
                      ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200/80 dark:border-emerald-800/80"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <UploadCloud className="w-4 h-4 text-emerald-600" />
                    <span>Upload Images</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-extrabold">
                    GCS
                  </span>
                </button>

                {/* 4.5. Manage Scientific Event (Right below Create Pages) */}
                <button
                  onClick={() => { setActiveTab("manage_scientific_events"); setEditingArticle(null); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "manage_scientific_events"
                      ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold border border-blue-200/80 dark:border-blue-800/80"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Manage Scientific Event</span>
                  </div>
                </button>

                {/* 5. Ingestion Queue */}
                <button
                  onClick={() => { setActiveTab("queue"); setEditingArticle(null); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "queue"
                      ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold border border-amber-200/80 dark:border-amber-800/80"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Ingestion Queue</span>
                  </div>
                  {ingestedQueue.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500 text-white">
                      {ingestedQueue.length}
                    </span>
                  )}
                </button>

                {/* 6. Correction Reports */}
                <button
                  onClick={() => { setActiveTab("corrections"); setEditingArticle(null); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "corrections"
                      ? "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 font-bold border border-red-200/80 dark:border-red-800/80"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>Corrections</span>
                  </div>
                  {corrections.filter(c => c.status === "pending").length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-red-500 text-white">
                      {corrections.filter(c => c.status === "pending").length}
                    </span>
                  )}
                </button>
              </nav>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
            <span>Close Control Panel</span>
          </button>
        </aside>

        {/* RIGHT MAIN WORKSPACE */}
        <main className="flex-1 flex flex-col overflow-hidden bg-zinc-50/50 dark:bg-zinc-950/40">
          
          {/* Main Top Header */}
          <div className="bg-white dark:bg-zinc-950 px-8 py-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white font-sans tracking-tight">
                {activeTab === "catalog" && "Global Healthcare News Generat Engine"}
                {activeTab === "write_editorial" && "Write Editorial Article"}
                {activeTab === "generate_news" && "Generate Specialty News"}
                {activeTab === "create_pages" && "Create Portal Pages"}
                {activeTab === "create_scientific_events" && "Create Scientific Events Page"}
                {activeTab === "upload_images" && "Google Cloud Storage Asset Manager"}
                {activeTab === "manage_scientific_events" && "Manage Scientific Event Assets & Attendees"}
                {activeTab === "queue" && "Ingestion Review Queue"}
                {activeTab === "corrections" && "Physician Feedback & Corrections"}
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {activeTab === "manage_scientific_events" 
                  ? "Upload event certificate templates, conference attendee rosters, and official souvenirs for portal pages."
                  : "Author, edit, generate, and publish clinical content directly to the HealicWire platform."}
              </p>
            </div>

            {/* Quick Action Buttons Header Bar */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => { setActiveTab("write_editorial"); setEditingArticle(null); }}
                className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold flex items-center space-x-1.5 hover:bg-zinc-800 transition-all shadow-xs"
              >
                <FileEdit className="w-3.5 h-3.5" />
                <span>Write Editorial</span>
              </button>
            </div>
          </div>

          {/* Dynamic Content Panel */}
          <div className="flex-1 overflow-y-auto p-8">

            {/* EDITING FORM OVERLAY IF ACTIVE */}
            {editingArticle ? (
              <form onSubmit={handleSaveEdit} className="space-y-6 max-w-4xl mx-auto bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center justify-between border-b pb-3 border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-sm font-bold text-zinc-800 dark:text-white uppercase font-mono flex items-center space-x-2">
                    <Edit3 className="w-4 h-4 text-teal-600" />
                    <span>Edit Article ({editingArticle.id})</span>
                  </h3>
                  <button type="button" onClick={() => setEditingArticle(null)} className="text-xs text-zinc-500 hover:text-zinc-900">Cancel</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Headline *</label>
                    <input
                      type="text"
                      required
                      value={editingArticle.headline}
                      onChange={e => setEditingArticle({ ...editingArticle, headline: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white font-medium"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">30-Second Summary *</label>
                    <textarea
                      rows={3}
                      value={editingArticle.summary30s}
                      onChange={e => setEditingArticle({ ...editingArticle, summary30s: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Detailed Body Analysis</label>
                    <textarea
                      rows={6}
                      value={editingArticle.bodyAnalysis}
                      onChange={e => setEditingArticle({ ...editingArticle, bodyAnalysis: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end space-x-3">
                  <button type="button" onClick={() => setEditingArticle(null)} className="px-4 py-2 rounded-lg border text-xs font-bold">Cancel</button>
                  <button type="submit" className="px-6 py-2 rounded-lg bg-teal-600 text-white font-bold text-xs">Save Changes</button>
                </div>
              </form>
            ) : (
              <>
                {/* 1. WRITE EDITORIAL TAB */}
                {activeTab === "write_editorial" && (
                  <div className="max-w-4xl mx-auto space-y-6">
                    {editorialSuccess && (
                      <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-xs font-semibold flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-teal-600" />
                          <span>{editorialSuccess}</span>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleWriteEditorialSubmit} className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5">
                      <div className="border-b border-zinc-100 dark:border-zinc-900 pb-3">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase font-mono flex items-center space-x-2">
                          <FileEdit className="w-4 h-4 text-teal-600" />
                          <span>Author New Clinical Editorial</span>
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                              Article Headline *
                            </label>

                            <button
                              type="button"
                              onClick={handleAiGenerateEditorial}
                              disabled={aiGeneratingEditorial}
                              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white rounded-lg text-xs font-mono font-bold shadow-xs hover:shadow-md transition-all disabled:opacity-50 cursor-pointer"
                              title="Generate Executive Summary & Clinical Analysis using AI based on Article Headline *"
                            >
                              <Wand2 className={`w-3.5 h-3.5 ${aiGeneratingEditorial ? 'animate-spin' : ''}`} />
                              <span>{aiGeneratingEditorial ? "Generating via AI..." : "✨ Generate using AI"}</span>
                            </button>
                          </div>

                          <input
                            type="text"
                            required
                            value={editorialForm.headline}
                            onChange={e => setEditorialForm({ ...editorialForm, headline: e.target.value })}
                            placeholder="e.g. CDSCO Issues Safety Warning for Novel Antidiabetic Class..."
                            className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                          />
                          <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 flex items-center space-x-1 font-mono">
                            <span>💡 Type your <b>Article Headline *</b> above and click</span>
                            <span className="font-bold text-teal-600 dark:text-teal-400 font-mono">"✨ Generate using AI"</span>
                            <span>to auto-compose summary & analysis.</span>
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                            Category
                          </label>
                          <select
                            value={editorialForm.category}
                            onChange={e => setEditorialForm({ ...editorialForm, category: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white font-medium"
                          >
                            <option value="Clinical">Clinical Practice</option>
                            <option value="Research">Research & Trials</option>
                            <option value="Pharma and Drugs">Pharma and Drugs</option>
                            <option value="Health Technology">Health Technology</option>
                            <option value="Policy and Public Health">Policy and Public Health</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                            Region Relevance
                          </label>
                          <select
                            value={editorialForm.region}
                            onChange={e => setEditorialForm({ ...editorialForm, region: e.target.value as Region })}
                            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white font-medium"
                          >
                            <option value={Region.GLOBAL}>Global Healthcare</option>
                            <option value={Region.INDIA}>🇮🇳 India Focus</option>
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                            30-Second Executive Summary *
                          </label>
                          <textarea
                            required
                            rows={3}
                            value={editorialForm.summary30s}
                            onChange={e => setEditorialForm({ ...editorialForm, summary30s: e.target.value })}
                            placeholder="Key takeaway paragraph for quick scanning..."
                            className="w-full px-3.5 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white leading-relaxed"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                            Detailed Clinical Analysis & Body Content
                          </label>
                          <textarea
                            rows={6}
                            value={editorialForm.bodyAnalysis}
                            onChange={e => setEditorialForm({ ...editorialForm, bodyAnalysis: e.target.value })}
                            placeholder="Comprehensive clinical analysis, methodology, trial data, or practice implications..."
                            className="w-full px-3.5 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white leading-relaxed font-sans"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                            Image URL (Free stock or illustration)
                          </label>
                          <input
                            type="url"
                            value={editorialForm.imageUrl}
                            onChange={e => setEditorialForm({ ...editorialForm, imageUrl: e.target.value })}
                            className="w-full px-3.5 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                            Clinical Impact Score (1-10)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={editorialForm.clinicalImpactScore}
                            onChange={e => setEditorialForm({ ...editorialForm, clinicalImpactScore: Number(e.target.value) })}
                            className="w-full px-3.5 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white font-bold"
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-900 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setEditorialForm({ ...editorialForm, status: "draft" })}
                          className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100"
                        >
                          Save as Draft
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all"
                        >
                          Publish Article Now
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* 2. GENERATE NEWS TAB */}
                {activeTab === "generate_news" && (
                  <div className="max-w-4xl mx-auto space-y-6 font-sans">
                    
                    {/* Success / Destination Stream Alert */}
                    {generateWeeklySuccess && (
                      <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 text-xs space-y-3 shadow-xs animate-fadeIn">
                        <div className="flex items-center space-x-2.5 font-bold text-sm">
                          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                          <span>{generateWeeklySuccess}</span>
                        </div>
                        <p className="text-xs text-emerald-700 dark:text-emerald-300">
                          AI generated news has been published and streamed directly to live destinations below:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                          <a href="/treatmentupdate" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between hover:text-emerald-600 transition-colors">
                            <span>🩺 Treatment Update</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <a href="/scientificevents" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between hover:text-emerald-600 transition-colors">
                            <span>📅 Scientific Events</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <a href="/pharmadrugs" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between hover:text-emerald-600 transition-colors">
                            <span>📑 Pharma and Drugs</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <a href="/alerts" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between hover:text-emerald-600 transition-colors">
                            <span>🛡️ Hospital Intelligence</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <a href="/guidelines" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between hover:text-emerald-600 transition-colors">
                            <span>📖 Current Guidelines</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="bg-white dark:bg-zinc-950 p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
                      
                      {/* Header */}
                      <div className="flex items-center space-x-3 border-b border-zinc-100 dark:border-zinc-900 pb-4">
                        <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
                          <Wand2 className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-base font-extrabold text-zinc-900 dark:text-white uppercase font-mono tracking-tight">
                            AI Weekly Medical News Generator
                          </h3>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Select sections & target week to auto-generate and stream medical news to live destination pages.
                          </p>
                        </div>
                      </div>

                      {/* STEP 1: SELECT SECTIONS */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-mono font-bold uppercase text-zinc-700 dark:text-zinc-300">
                            1. Select Sections (One or All) *
                          </label>
                          <button
                            type="button"
                            onClick={toggleSelectAllSections}
                            className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                          >
                            {selectedSections.length === ALL_5_SECTIONS.length ? "Deselect All" : "Select All 5 Sections"}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {ALL_5_SECTIONS.map(sec => {
                            const isSelected = selectedSections.includes(sec.id);
                            const isLockedForWeek = isSectionLockedForWeek(sec.id, selectedWeek);

                            return (
                              <div
                                key={sec.id}
                                onClick={() => !isLockedForWeek && toggleSectionSelection(sec.id)}
                                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                                  isLockedForWeek
                                    ? "bg-zinc-100 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 opacity-70 cursor-not-allowed"
                                    : isSelected
                                    ? "bg-indigo-50/70 dark:bg-indigo-950/60 border-indigo-500 shadow-2xs"
                                    : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-indigo-300"
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                      <sec.icon className={`w-4 h-4 ${isSelected ? "text-indigo-600" : "text-zinc-400"}`} />
                                      <span className="font-bold text-xs text-zinc-900 dark:text-white">{sec.label}</span>
                                    </div>
                                    
                                    {isLockedForWeek ? (
                                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                        🔒 Locked
                                      </span>
                                    ) : (
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => {}}
                                        className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                                      />
                                    )}
                                  </div>

                                  <div className="text-[10.5px] font-mono text-zinc-400">
                                    Target URL: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{sec.url}</span>
                                  </div>
                                </div>

                                {isLockedForWeek && (
                                  <div className="mt-2 text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                                    ✓ Already Generated ({selectedWeek})
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* STEP 2: SELECT WEEK */}
                      <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-900">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-mono font-bold uppercase text-zinc-700 dark:text-zinc-300">
                            2. Select Week (Unlocked after Sunday Morning 00:00 AM) *
                          </label>
                          <span className="text-[10.5px] font-mono text-zinc-500">
                            Sunday Rule: Active for any week after Sunday Morning
                          </span>
                        </div>

                        <select
                          value={selectedWeek}
                          onChange={e => setSelectedWeek(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                        >
                          {WEEK_OPTIONS.map(w => (
                            <option
                              key={w.id}
                              value={w.id}
                              disabled={!w.isAfterSundayMorning}
                            >
                              {w.label} {!w.isAfterSundayMorning ? "🔒 (Unlocks Sunday Morning)" : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* STEP 3: GENERATE BUTTON */}
                      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-900">
                        <button
                          type="button"
                          onClick={handleGenerateWeeklyNewsSubmit}
                          disabled={generatingWeekly || selectedSections.length === 0 || isSelectedWeekFullyLocked}
                          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white font-mono text-xs font-bold flex items-center justify-center space-x-2.5 shadow-md transition-all cursor-pointer"
                        >
                          {generatingWeekly ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Generating AI Weekly News for {selectedSections.length} Sections...</span>
                            </>
                          ) : isSelectedWeekFullyLocked ? (
                            <>
                              <Lock className="w-4 h-4 text-amber-300" />
                              <span>Week {selectedWeek} is Already Generated for Selected Sections (Locked)</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              <span>Generate AI News for {selectedSections.length} Selected Section(s)</span>
                            </>
                          )}
                        </button>

                        <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 mt-2 text-center font-mono">
                          Note: Once generated, news automatically streams to live destination URLs and locks for that week.
                        </p>
                      </div>

                    </div>
                  </div>
                )}

                {/* 3. CREATE PAGES TAB */}
                {activeTab === "create_pages" && (
                  <div className="max-w-4xl mx-auto space-y-6 pb-8">
                    {pageSuccess && (
                      <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200 text-xs font-semibold flex items-center justify-between">
                        <span>{pageSuccess}</span>
                        <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                      </div>
                    )}

                    <div className="bg-white dark:bg-zinc-950 p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
                      <div className="border-b border-zinc-100 dark:border-zinc-900 pb-3 flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase font-mono flex items-center space-x-2">
                            <FolderPlus className="w-4 h-4 text-purple-600" />
                            <span>{editingPageId ? "Edit & Republish Portal Page" : "Create Portal & Specialty Pages"}</span>
                          </h3>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            Generate responsive specialty pages matching uploaded webpage layout designs across all devices.
                          </p>
                        </div>

                        {editingPageId && (
                          <span className="px-2.5 py-1 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 font-mono text-[10px] font-bold">
                            ✏️ Editing Mode
                          </span>
                        )}
                      </div>

                      <form onSubmit={handleCreatePageSubmit} className="space-y-4">
                        
                        {/* SECTION SELECTOR */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {[
                            { type: "Treatment Update", icon: Activity, desc: "New clinical protocols & therapies", path: "treatmentupdate" },
                            { type: "Pharma and Drugs", icon: Pill, desc: "CDSCO / FDA drug safety & approvals", path: "pharmadrugs" },
                            { type: "Hospital Intelligence", icon: ShieldAlert, desc: "Emergency protocols & alerts", path: "alerts" },
                            { type: "Current Guidelines", icon: BookOpen, desc: "Consensus clinical guidelines", path: "guidelines" },
                            { type: "Any Other", icon: FolderPlus, desc: "Custom specialty portal page", path: "pages" }
                          ].map(item => (
                            <div
                              key={item.type}
                              onClick={() => setPageForm({ ...pageForm, pageType: item.type as any })}
                              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                                pageForm.pageType === item.type
                                  ? "border-purple-600 bg-purple-50/60 dark:bg-purple-950/50 shadow-xs"
                                  : "border-zinc-200 dark:border-zinc-800 hover:border-purple-300"
                              }`}
                            >
                              <item.icon className="w-4 h-4 text-purple-600 mb-1.5" />
                              <div className="font-bold text-xs text-zinc-900 dark:text-white">{item.type}</div>
                              <div className="text-[10px] text-zinc-500">{item.desc}</div>
                            </div>
                          ))}
                        </div>

                        {/* PAGE TITLE */}
                        <div>
                          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                            Page / Topic Title *
                          </label>
                          <input
                            type="text"
                            required
                            value={pageForm.customTitle}
                            onChange={e => setPageForm({ ...pageForm, customTitle: e.target.value })}
                            placeholder="e.g. National Cardiology Summit 2026 / CDSCO Oral Formulation Guidelines"
                            className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white font-medium"
                          />
                        </div>

                        {/* SHORTENED UNIQUE PAGE SLUG */}
                        <div className="bg-zinc-50 dark:bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                          <label className="block text-xs font-bold text-zinc-900 dark:text-white mb-1">
                            Shortened Unique Page Name (URL Slug) *
                          </label>
                          <div className="flex items-center space-x-2">
                            <span className="text-[11px] font-mono text-zinc-400">
                              http://localhost:3001/{pageForm.pageType === "Treatment Update" ? "treatmentupdate" : pageForm.pageType === "Pharma and Drugs" ? "pharmadrugs" : pageForm.pageType === "Hospital Intelligence" ? "alerts" : pageForm.pageType === "Current Guidelines" ? "guidelines" : "pages"}/
                            </span>
                            <input
                              type="text"
                              required
                              value={pageForm.slug}
                              onChange={e => setPageForm({ ...pageForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                              placeholder="e.g. cardio-guidelines-2026"
                              className="flex-1 px-3 py-1.5 rounded-lg border border-purple-300 dark:border-purple-800 bg-white dark:bg-zinc-950 text-xs font-mono text-purple-600 font-extrabold"
                            />
                          </div>
                        </div>

                        {/* ANY OTHER SPECIFIC INFORMATION OR CRITERIA WHILE PAGE CREATION */}
                        <div>
                          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                            Any other specific information or criteria while page creation
                          </label>
                          <textarea
                            rows={4}
                            value={pageForm.summary}
                            onChange={e => setPageForm({ ...pageForm, summary: e.target.value })}
                            placeholder="Specify clinical requirements, target audience criteria, speaker info, dosage instructions, or custom guidelines..."
                            className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white leading-relaxed"
                          />
                        </div>

                        {/* WEBPAGE IMAGE UPLOAD */}
                        <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-dashed border-purple-300 dark:border-purple-800 space-y-2">
                          <label className="block text-xs font-bold text-zinc-900 dark:text-white flex items-center space-x-2">
                            <UploadCloud className="w-4 h-4 text-purple-600 shrink-0" />
                            <span>WebPage Image Upload (Upload image of a webpage how it has to be generated) *</span>
                          </label>
                          <p className="text-[11px] text-zinc-500 font-mono">
                            Upload design mockup image. The AI engine will render a pleasant, responsive UI page matching this design layout.
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePortalWebPageImageUpload}
                            className="w-full text-xs text-zinc-600 font-mono file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-purple-100 file:text-purple-800 hover:file:bg-purple-200 cursor-pointer"
                          />
                          {pageForm.webpageImage && (
                            <div className="pt-2 flex items-center space-x-3">
                              <img src={pageForm.webpageImage} alt="WebPage Layout Upload" className="h-16 w-24 object-cover rounded-lg border border-zinc-300 shadow-xs" />
                              <span className="text-[10.5px] font-mono text-emerald-600 font-bold">✓ WebPage Layout Image Uploaded</span>
                            </div>
                          )}
                        </div>

                        {/* PRODUCT METADATA (UPLOAD LOGO, PRODUCT NAME, PRODUCT DETAILS LINK) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
                          <div>
                            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                              Upload Logo
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePortalLogoUpload}
                              className="w-full text-xs text-zinc-600 font-mono file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-zinc-200 file:text-zinc-800 hover:file:bg-zinc-300 cursor-pointer"
                            />
                            {pageForm.logoUrl && (
                              <img src={pageForm.logoUrl} alt="Uploaded Logo" className="mt-2 h-8 w-auto object-contain rounded bg-white p-1 border" />
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                              Upload Product Name
                            </label>
                            <input
                              type="text"
                              value={pageForm.productName}
                              onChange={e => setPageForm({ ...pageForm, productName: e.target.value })}
                              placeholder="e.g. CardiaGuard XL 50mg"
                              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                              Upload Product Details Link
                            </label>
                            <input
                              type="text"
                              value={pageForm.productDetailsUrl}
                              onChange={e => setPageForm({ ...pageForm, productDetailsUrl: e.target.value })}
                              placeholder="https://pharma-brand.org/product-info"
                              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white"
                            />
                          </div>
                        </div>

                        {/* GENERATE / REPUBLISH BUTTON */}
                        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
                          {editingPageId ? (
                            <button
                              type="button"
                              onClick={handleCancelPortalPageEdit}
                              className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-800 text-xs font-bold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                            >
                              Cancel Editing
                            </button>
                          ) : (
                            <div />
                          )}

                          <button
                            type="submit"
                            className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-mono text-xs font-bold flex items-center space-x-2 shadow-md transition-all cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>{editingPageId ? "✨ Update & Republish Page" : "✨ Generate Page"}</span>
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* CREATED PORTAL PAGES LIST (BELOW THE FORM) */}
                    <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
                      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-3">
                        <div>
                          <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase font-mono flex items-center space-x-2">
                            <FolderPlus className="w-4 h-4 text-purple-600" />
                            <span>Created Portal Pages ({availablePages.length})</span>
                          </h3>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            Edit content anytime (Page Information, WebPage layout, Product details, Logo) and republish.
                          </p>
                        </div>

                        <span className="px-2.5 py-1 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-mono text-[10px] font-bold">
                          {availablePages.length} Pages Published
                        </span>
                      </div>

                      {availablePages.length === 0 ? (
                        <div className="text-center py-8 text-xs text-zinc-400 font-mono">
                          No pages created yet. Use the form above to generate your first portal page.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {availablePages.map(page => {
                            const matchedArticle = articles.find(a => a.id === page.id);
                            const category = matchedArticle?.category || page.category || "Treatment Update";
                            const sectionPathMap: Record<string, string> = {
                              "Treatment Update": "treatmentupdate",
                              "Pharma and Drugs": "pharmadrugs",
                              "Hospital Intelligence": "alerts",
                              "Current Guidelines": "guidelines",
                              "Any Other": "pages"
                            };
                            const secPath = sectionPathMap[category] || "pages";
                            const pageSlug = (matchedArticle as any)?.slug || page.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                            const liveUrl = `http://localhost:3001/${secPath}/${pageSlug}`;
                            const isBeingEdited = editingPageId === page.id;

                            return (
                              <div
                                key={page.id}
                                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                                  isBeingEdited
                                    ? "bg-purple-50/70 dark:bg-purple-950/60 border-purple-500 shadow-sm"
                                    : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-purple-300"
                                }`}
                              >
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-extrabold uppercase bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200">
                                      {category}
                                    </span>
                                    <span className="text-[10px] font-mono text-zinc-400">
                                      {new Date(page.date).toLocaleDateString("en-IN")}
                                    </span>
                                  </div>

                                  <h4 className="text-xs font-extrabold text-zinc-900 dark:text-white leading-snug line-clamp-2">
                                    {page.title}
                                  </h4>

                                  <div className="text-[10.5px] font-mono text-purple-700 dark:text-purple-400 truncate">
                                    URL: <a href={`/${secPath}/${pageSlug}`} target="_blank" rel="noopener noreferrer" className="underline font-bold">{liveUrl}</a>
                                  </div>
                                </div>

                                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
                                  <div className="flex space-x-2">
                                    {matchedArticle && (
                                      <button
                                        onClick={() => handleEditPortalPage(matchedArticle)}
                                        className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-mono text-[10.5px] font-bold flex items-center space-x-1 transition-all cursor-pointer"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                        <span>Edit & Republish</span>
                                      </button>
                                    )}

                                    <button
                                      onClick={() => handleDeletePortalPage(page.id)}
                                      className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-[10px] font-bold transition-all cursor-pointer"
                                      title="Delete Portal Page"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  <a
                                    href={`/${secPath}/${pageSlug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10.5px] font-mono font-bold text-purple-600 hover:underline flex items-center space-x-1"
                                  >
                                    <span>View Live Page</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3.6. UPLOAD IMAGES TAB (Google Cloud Storage Asset Gallery) */}
                {activeTab === "upload_images" && (
                  <div className="max-w-5xl mx-auto space-y-6 font-sans pb-12">
                    
                    {gcsSuccessMsg && (
                      <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 text-xs font-semibold flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <span>{gcsSuccessMsg}</span>
                        </div>
                      </div>
                    )}

                    {/* UPLOAD FORM CARD */}
                    <div className="bg-white dark:bg-zinc-950 p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
                      
                      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                            <UploadCloud className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-base font-extrabold text-zinc-900 dark:text-white uppercase font-mono tracking-tight flex items-center space-x-2">
                              <span>Google Cloud Storage Asset Manager</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-bold">
                                storage.googleapis.com
                              </span>
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              Upload images directly to Google Cloud Storage. Images uploaded here can be copied and used by any feature of HealicWire.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                            Asset Category *
                          </label>
                          <select
                            value={gcsUploadCategory}
                            onChange={e => setGcsUploadCategory(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white font-medium"
                          >
                            <option value="General Asset">📁 General Asset</option>
                            <option value="WebPage Layout">🖼️ WebPage Layout Design</option>
                            <option value="Logo">🏷️ Logo / Brand</option>
                            <option value="Pharma & Drugs">💊 Pharma & Drugs Image</option>
                            <option value="Clinical Image">🩺 Clinical / Medical Image</option>
                            <option value="Scientific Events">📅 Scientific Events Banner</option>
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                            Select File to Upload to Google Storage *
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleGcsImageUpload}
                            disabled={uploadingToGcs}
                            className="w-full text-xs text-zinc-600 font-mono file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* SHOW ALL IMAGES UPLOADED TILL NOW */}
                    <div className="bg-white dark:bg-zinc-950 p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
                      
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-900 pb-4">
                        <div>
                          <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase font-mono flex items-center space-x-2">
                            <ImageIcon className="w-4 h-4 text-emerald-600" />
                            <span>Images Uploaded Till Now ({uploadedImagesList.length})</span>
                          </h3>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            All images stored in Google Cloud Storage. Click "Copy Cloud Storage URL" to use in any feature of this project.
                          </p>
                        </div>

                        <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-mono text-xs font-extrabold">
                          {uploadedImagesList.length} Cloud Assets Stored
                        </span>
                      </div>

                      {uploadedImagesList.length === 0 ? (
                        <div className="text-center py-12 text-xs text-zinc-400 font-mono space-y-2">
                          <UploadCloud className="w-8 h-8 text-zinc-300 mx-auto" />
                          <p>No images uploaded till now. Upload your first asset using the form above.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                          {uploadedImagesList.map(img => {
                            const isCopied = copiedImgId === img.id;
                            const targetCopyUrl = img.gcsUrl || img.url;

                            return (
                              <div
                                key={img.id}
                                className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                              >
                                {/* Thumbnail Preview */}
                                <div className="w-full h-44 bg-zinc-900 overflow-hidden relative group">
                                  <img
                                    src={img.url}
                                    alt={img.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute top-2 left-2">
                                    <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-extrabold uppercase bg-zinc-900/80 backdrop-blur-sm text-emerald-400 border border-emerald-500/30">
                                      {img.category || "Asset"}
                                    </span>
                                  </div>
                                  <div className="absolute top-2 right-2">
                                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-zinc-900/80 backdrop-blur-sm text-zinc-300">
                                      {img.size || "Original"}
                                    </span>
                                  </div>
                                </div>

                                {/* Info & URL */}
                                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                                  <div className="space-y-1">
                                    <div className="text-xs font-bold text-zinc-900 dark:text-white truncate" title={img.name}>
                                      {img.name}
                                    </div>
                                    <div className="text-[10px] font-mono text-zinc-400">
                                      Uploaded {new Date(img.uploadedAt).toLocaleDateString("en-IN")}
                                    </div>

                                    <div className="pt-1.5">
                                      <div className="text-[9.5px] font-mono text-zinc-400 font-bold uppercase">Google Cloud Storage URL:</div>
                                      <div className="text-[10.5px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800 break-all select-all font-semibold">
                                        {targetCopyUrl}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                                    <button
                                      onClick={() => handleCopyGcsUrl(img.id, targetCopyUrl)}
                                      className={`flex-1 py-1.5 px-3 rounded-lg font-mono text-[10.5px] font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                                        isCopied
                                          ? "bg-emerald-600 text-white"
                                          : "bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200"
                                      }`}
                                    >
                                      {isCopied ? (
                                        <>
                                          <Check className="w-3.5 h-3.5" />
                                          <span>Copied URL!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Share2 className="w-3.5 h-3.5" />
                                          <span>Copy URL</span>
                                        </>
                                      )}
                                    </button>

                                    <button
                                      onClick={() => handleDeleteGcsImage(img.id)}
                                      className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-[10px] font-bold transition-all cursor-pointer"
                                      title="Delete from Cloud Storage"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                    </div>
                  </div>
                )}

                {/* 3.5. CREATE SCIENTIFIC EVENTS PAGE TAB (Directly below Create Pages) */}
                {activeTab === "create_scientific_events" && (
                  <div className="max-w-4xl mx-auto space-y-6 font-sans">
                    {createEventSuccess && (
                      <div className="p-4 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-cyan-900 dark:text-cyan-100 text-xs font-semibold flex items-center space-x-2.5">
                        <CheckCircle2 className="w-5 h-5 text-cyan-600 shrink-0" />
                        <span>{createEventSuccess}</span>
                      </div>
                    )}

                    <div className="bg-white dark:bg-zinc-950 p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
                      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600">
                            <Calendar className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-base font-extrabold text-zinc-900 dark:text-white uppercase font-mono tracking-tight">
                              Create Scientific Event Page
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              Publish national conferences, medical symposia, CME workshops, and academic grand rounds to http://localhost:3001/scientificevents.
                            </p>
                          </div>
                        </div>

                        <a 
                          href="/scientificevents" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="px-3 py-1.5 rounded-lg border border-cyan-200 text-cyan-700 font-mono text-xs font-bold flex items-center space-x-1.5 hover:bg-cyan-50 transition-colors"
                        >
                          <span>View Live Portal</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      <form onSubmit={handleCreateScientificEventSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                              Scientific Event Title *
                            </label>
                            <input
                              type="text"
                              required
                              value={createEventForm.title}
                              onChange={e => setCreateEventForm({ ...createEventForm, title: e.target.value })}
                              placeholder="e.g. 42nd National Annual Conference of Cardiology & Precision Medicine 2026"
                              className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                              Organizer / Academic Society *
                            </label>
                            <input
                              type="text"
                              required
                              value={createEventForm.organizer}
                              onChange={e => setCreateEventForm({ ...createEventForm, organizer: e.target.value })}
                              placeholder="e.g. Indian Medical Association / Cardiology Society of India"
                              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                              Event Scope
                            </label>
                            <select
                              value={createEventForm.scope}
                              onChange={e => setCreateEventForm({ ...createEventForm, scope: e.target.value as any })}
                              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white font-medium"
                            >
                              <option value="Nationwide">🇮🇳 Nationwide / National</option>
                              <option value="Regional">Regional / Institutional</option>
                              <option value="Global">🌐 Global / International</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                              Event Format & Delivery
                            </label>
                            <select
                              value={createEventForm.format}
                              onChange={e => setCreateEventForm({ ...createEventForm, format: e.target.value as any })}
                              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white font-medium"
                            >
                              <option value="Hybrid">Hybrid (In-Person + Live Stream)</option>
                              <option value="In-Person">In-Person Only</option>
                              <option value="Virtual">Virtual Only</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                              CME Credits (Hours)
                            </label>
                            <input
                              type="number"
                              value={createEventForm.cmeCredits}
                              onChange={e => setCreateEventForm({ ...createEventForm, cmeCredits: Number(e.target.value) })}
                              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                              Venue Name & Auditorium
                            </label>
                            <input
                              type="text"
                              value={createEventForm.venue}
                              onChange={e => setCreateEventForm({ ...createEventForm, venue: e.target.value })}
                              placeholder="e.g. AIIMS Main Convention Hall"
                              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                              City & State
                            </label>
                            <input
                              type="text"
                              value={createEventForm.city}
                              onChange={e => setCreateEventForm({ ...createEventForm, city: e.target.value })}
                              placeholder="e.g. New Delhi"
                              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white font-medium"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                              Target Specialties (Comma Separated)
                            </label>
                            <input
                              type="text"
                              value={createEventForm.specialties}
                              onChange={e => setCreateEventForm({ ...createEventForm, specialties: e.target.value })}
                              placeholder="e.g. Cardiology, Internal Medicine, Medical Education"
                              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white font-medium"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                              Scientific Event Overview & Key Highlights *
                            </label>
                            <textarea
                              required
                              rows={4}
                              value={createEventForm.description}
                              onChange={e => setCreateEventForm({ ...createEventForm, description: e.target.value })}
                              placeholder="Provide key session topics, keynote speakers, paper submission deadlines, and conference objectives..."
                              className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white leading-relaxed"
                            />
                          </div>

                          {/* 1. WEBPAGE IMAGE UPLOAD (BELOW HIGHLIGHTS) */}
                          <div className="md:col-span-2 p-4 rounded-xl bg-cyan-50/50 dark:bg-cyan-950/30 border border-dashed border-cyan-300 dark:border-cyan-800 space-y-2">
                            <label className="block text-xs font-bold text-zinc-900 dark:text-white flex items-center space-x-2">
                              <UploadCloud className="w-4 h-4 text-cyan-600 shrink-0" />
                              <span>WebPage Image Upload (Upload layout image of how page has to be generated) *</span>
                            </label>
                            <p className="text-[11px] text-zinc-500 font-mono">
                              Upload mockup/design image. The AI will generate a pleasant layout responsive across all devices (desktop, tablet, mobile).
                            </p>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleWebPageImageUpload}
                              className="w-full text-xs text-zinc-600 font-mono file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-cyan-100 file:text-cyan-800 hover:file:bg-cyan-200 cursor-pointer"
                            />
                            {createEventForm.webpageImage && (
                              <div className="pt-2 flex items-center space-x-3">
                                <img src={createEventForm.webpageImage} alt="WebPage Layout Upload" className="h-16 w-24 object-cover rounded-lg border border-zinc-300 shadow-xs" />
                                <span className="text-[10.5px] font-mono text-emerald-600 font-bold">✓ WebPage Layout Image Uploaded</span>
                              </div>
                            )}
                          </div>

                          {/* 2. REGISTRATION LINK AND LAST DATE */}
                          <div>
                            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                              Registration Link (URL) *
                            </label>
                            <input
                              type="text"
                              required
                              value={createEventForm.registrationUrl}
                              onChange={e => setCreateEventForm({ ...createEventForm, registrationUrl: e.target.value })}
                              placeholder="https://registration-portal.org/event"
                              className="w-full px-3.5 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                              Registration Last Date *
                            </label>
                            <input
                              type="date"
                              required
                              value={createEventForm.registrationDeadline}
                              onChange={e => setCreateEventForm({ ...createEventForm, registrationDeadline: e.target.value })}
                              className="w-full px-3.5 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white font-medium"
                            />
                          </div>

                          {/* 3. SUBMISSION LINK AND LAST DATE */}
                          <div>
                            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                              Paper / Abstract Submission Link (URL) *
                            </label>
                            <input
                              type="text"
                              required
                              value={createEventForm.submissionUrl}
                              onChange={e => setCreateEventForm({ ...createEventForm, submissionUrl: e.target.value })}
                              placeholder="https://submissions.org/submit-abstract"
                              className="w-full px-3.5 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                              Submission Last Date *
                            </label>
                            <input
                              type="date"
                              required
                              value={createEventForm.abstractDeadline}
                              onChange={e => setCreateEventForm({ ...createEventForm, abstractDeadline: e.target.value })}
                              className="w-full px-3.5 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white font-medium"
                            />
                          </div>

                          {/* 4. DOWNLOAD CERTIFICATE LINK & SOUVENIR LINK */}
                          <div>
                            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                              Download Certificate Link (If any)
                            </label>
                            <input
                              type="text"
                              value={createEventForm.certificateUrl}
                              onChange={e => setCreateEventForm({ ...createEventForm, certificateUrl: e.target.value })}
                              placeholder="https://certificates-server.org/download"
                              className="w-full px-3.5 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                              Download Souvenir Link (If any)
                            </label>
                            <input
                              type="text"
                              value={createEventForm.souvenirUrl}
                              onChange={e => setCreateEventForm({ ...createEventForm, souvenirUrl: e.target.value })}
                              placeholder="https://souvenirs-server.org/souvenir.pdf"
                              className="w-full px-3.5 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white font-medium"
                            />
                          </div>

                          {/* 5. SHORTENED UNIQUE EVENT PAGE NAME / SLUG */}
                          <div className="md:col-span-2 bg-zinc-50 dark:bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                            <label className="block text-xs font-bold text-zinc-900 dark:text-white mb-1">
                              Shortened Unique Page Name (URL Slug) *
                            </label>
                            <div className="flex items-center space-x-2">
                              <span className="text-[11px] font-mono text-zinc-400">http://localhost:3001/scientificevents/</span>
                              <input
                                type="text"
                                required
                                value={createEventForm.slug}
                                onChange={e => setCreateEventForm({ ...createEventForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                                placeholder="e.g. cardio-2026"
                                className="flex-1 px-3 py-1.5 rounded-lg border border-cyan-300 dark:border-cyan-800 bg-white dark:bg-zinc-950 text-xs font-mono text-cyan-600 font-extrabold"
                              />
                            </div>
                            <p className="text-[10px] text-zinc-500 font-mono mt-1">
                              Unique shortened URL for this event page (e.g. http://localhost:3001/scientificevents/cardio-2026).
                            </p>
                          </div>
                        </div>

                        {/* GENERATE / REPUBLISH PAGE BUTTON */}
                        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
                          {editingEventId ? (
                            <button
                              type="button"
                              onClick={handleCancelEventEdit}
                              className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-800 text-xs font-bold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                            >
                              Cancel Editing
                            </button>
                          ) : (
                            <div />
                          )}

                          <button
                            type="submit"
                            disabled={submittingEvent}
                            className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-mono text-xs font-bold flex items-center space-x-2.5 shadow-md transition-all cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>{editingEventId ? "✨ Update & Republish Page" : "✨ Generate Page"}</span>
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* CREATED SCIENTIFIC EVENT PAGES LIST (BELOW THE FORM) */}
                    <div className="bg-white dark:bg-zinc-950 p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-3">
                        <div>
                          <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase font-mono flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-cyan-600" />
                            <span>Created Scientific Event Pages ({createdEventsList.length})</span>
                          </h3>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            Edit content anytime (Page info, Registration link/date, Submission link/date, Certificates, Souvenirs) and republish.
                          </p>
                        </div>

                        <span className="px-2.5 py-1 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-200 font-mono text-[10px] font-bold">
                          {createdEventsList.length} Event Pages Published
                        </span>
                      </div>

                      {createdEventsList.length === 0 ? (
                        <div className="text-center py-8 text-xs text-zinc-400 font-mono">
                          No Scientific Event pages created yet. Use the form above to generate your first page.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {createdEventsList.map(evt => {
                            const eventSlug = evt.slug || evt.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || evt.id;
                            const fullUrl = `http://localhost:3001/scientificevents/${eventSlug}`;
                            const isBeingEdited = editingEventId === evt.id;

                            return (
                              <div
                                key={evt.id}
                                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                                  isBeingEdited
                                    ? "bg-cyan-50/70 dark:bg-cyan-950/60 border-cyan-500 shadow-sm"
                                    : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-cyan-300"
                                }`}
                              >
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-extrabold uppercase bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200">
                                      {evt.eventType || "Conference"}
                                    </span>
                                    <span className="text-[10px] font-mono text-purple-600 font-bold">
                                      {evt.cmeCredits} CME Hours
                                    </span>
                                  </div>

                                  <h4 className="text-xs font-extrabold text-zinc-900 dark:text-white leading-snug line-clamp-2">
                                    {evt.title}
                                  </h4>

                                  <div className="text-[10.5px] font-mono text-cyan-700 dark:text-cyan-400 truncate">
                                    URL: <a href={`/scientificevents/${eventSlug}`} target="_blank" rel="noopener noreferrer" className="underline font-bold">{fullUrl}</a>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-500 pt-1">
                                    <div>Reg Last Date: <span className="font-bold text-zinc-700 dark:text-zinc-300">{evt.registrationDeadline || evt.endDate}</span></div>
                                    <div>Sub Last Date: <span className="font-bold text-zinc-700 dark:text-zinc-300">{evt.abstractDeadline || evt.endDate}</span></div>
                                  </div>
                                </div>

                                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleEditEvent(evt)}
                                      className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-mono text-[10.5px] font-bold flex items-center space-x-1 transition-all cursor-pointer"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                      <span>Edit & Republish</span>
                                    </button>

                                    <button
                                      onClick={() => handleDeleteEvent(evt.id)}
                                      className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-[10px] font-bold transition-all cursor-pointer"
                                      title="Delete Event Page"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  <a
                                    href={`/scientificevents/${eventSlug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10.5px] font-mono font-bold text-cyan-600 hover:underline flex items-center space-x-1"
                                  >
                                    <span>View Live Page</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. MANAGE SCIENTIFIC EVENT TAB (Created right below Create Pages) */}
                {activeTab === "manage_scientific_events" && (
                  <div className="max-w-4xl mx-auto space-y-6 pb-8 font-sans">
                    {manageSuccess && (
                      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 text-xs font-semibold flex items-center space-x-2.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{manageSuccess}</span>
                      </div>
                    )}

                    <form onSubmit={handleSaveEventAssets} className="space-y-6">
                      
                      {/* 1. SELECT PAGE / TOPIC TITLE */}
                      <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
                        <div className="flex items-center space-x-3 border-b border-zinc-100 dark:border-zinc-900 pb-3">
                          <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center font-mono">
                            1
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase font-mono flex items-center space-x-2">
                              <span>Select Page / Topic Title</span>
                              <span className="text-[10px] text-zinc-400 font-normal normal-case">(Generated in Create Portal Pages)</span>
                            </h3>
                            <p className="text-xs text-zinc-500">
                              Recently uploaded or created pages appear at the top of this list.
                            </p>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                            Page / Topic Title *
                          </label>
                          <select
                            required
                            value={selectedEventTitle}
                            onChange={e => handleSelectPageTitle(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">-- Choose Page / Topic Title (Recently Uploaded First) --</option>
                            {availablePages.map(page => (
                              <option key={page.id} value={page.title}>
                                [{page.category}] {page.title} — ({new Date(page.date).toLocaleDateString("en-IN")})
                              </option>
                            ))}
                          </select>
                        </div>

                        {selectedEventTitle && (
                          <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2.5">
                              <FolderPlus className="w-4 h-4 text-purple-600 shrink-0" />
                              <div>
                                <div className="font-bold text-purple-950 dark:text-purple-200">{selectedEventTitle}</div>
                                <div className="text-[11px] text-purple-700 dark:text-purple-400 font-mono">Linked Portal Event ID: {selectedEventId}</div>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 uppercase">
                              Selected Page
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 2. UPLOAD CERTIFICATE FORMAT */}
                      <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
                        <div className="flex items-center space-x-3 border-b border-zinc-100 dark:border-zinc-900 pb-3">
                          <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center justify-center font-mono">
                            2
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase font-mono flex items-center space-x-2">
                              <Award className="w-4 h-4 text-amber-600" />
                              <span>Upload Certificate Format</span>
                            </h3>
                            <p className="text-xs text-zinc-500">
                              Upload the official CME or participation certificate template for this scientific event.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl p-5 text-center hover:border-amber-400 transition-colors relative bg-zinc-50/50 dark:bg-zinc-900/40">
                            <input
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg,.docx"
                              onChange={handleCertFileUpload}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            <UploadCloud className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                            <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                              Click or drag & drop Certificate Format file
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-1">
                              Supports PDF, PNG, JPG, or DOCX template formats
                            </div>
                          </div>

                          {certFile && (
                            <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs">
                              <div className="flex items-center space-x-3">
                                <Award className="w-5 h-5 text-amber-600 shrink-0" />
                                <div>
                                  <div className="font-bold text-zinc-900 dark:text-white">{certFile.fileName}</div>
                                  <div className="text-[11px] text-zinc-500 font-mono">{certFile.fileSize} • {certFile.fileType} • Uploaded at {certFile.uploadedAt}</div>
                                </div>
                              </div>
                              <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center space-x-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Certificate Attached</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 3. UPLOAD EXCEL SHEET OF CONFERENCE ATTENDEES */}
                      <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-3 gap-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center font-mono">
                              3
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase font-mono flex items-center space-x-2">
                                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                                <span>Upload Excel Sheet of Conference Attendees</span>
                              </h3>
                              <p className="text-xs text-zinc-500">
                                Upload attendee spreadsheet for CME credit allocation & certificate issuing.
                              </p>
                            </div>
                          </div>

                          {/* Download Excel Format Button */}
                          <button
                            type="button"
                            onClick={handleDownloadExcelFormat}
                            className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center space-x-2 hover:bg-emerald-100 transition-all shadow-2xs self-start sm:self-auto"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Download Excel File Format</span>
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl p-5 text-center hover:border-emerald-400 transition-colors relative bg-zinc-50/50 dark:bg-zinc-900/40">
                            <input
                              type="file"
                              accept=".csv,.xlsx,.xls,.txt"
                              onChange={handleAttendeeFileUpload}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            <FileSpreadsheet className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                            <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                              Click or drag & drop Attendees Excel / CSV sheet
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-1">
                              Supports .xlsx, .csv formatted files
                            </div>
                          </div>

                          {attendeeFile && (
                            <div className="space-y-3">
                              <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                                <div className="flex items-center space-x-3">
                                  <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                                  <div>
                                    <div className="font-bold text-zinc-900 dark:text-white">{attendeeFile.fileName}</div>
                                    <div className="text-[11px] text-zinc-500 font-mono">
                                      {attendeeFile.fileSize} • {attendeeFile.totalCount} Conference Attendees Loaded
                                    </div>
                                  </div>
                                </div>
                                <span className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold text-[10px] font-mono">
                                  {attendeeFile.totalCount} Attendees Loaded
                                </span>
                              </div>

                              {/* Attendee Data Table Preview */}
                              {attendeeFile.attendees && attendeeFile.attendees.length > 0 && (
                                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
                                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 font-mono">
                                      Attendee Roster Preview ({attendeeFile.attendees.length} rows)
                                    </span>
                                    <div className="relative">
                                      <input
                                        type="text"
                                        placeholder="Search name or reg no..."
                                        value={attendeeSearch}
                                        onChange={e => setAttendeeSearch(e.target.value)}
                                        className="pl-7 pr-3 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                                      />
                                      <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2 top-2" />
                                    </div>
                                  </div>
                                  <div className="max-h-48 overflow-y-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                      <thead className="bg-zinc-100 dark:bg-zinc-800 text-[10px] uppercase font-mono text-zinc-500 sticky top-0">
                                        <tr>
                                          <th className="p-2 border-b">Reg ID</th>
                                          <th className="p-2 border-b">Attendee Name</th>
                                          <th className="p-2 border-b">Email</th>
                                          <th className="p-2 border-b">Council Reg No</th>
                                          <th className="p-2 border-b">Specialty</th>
                                          <th className="p-2 border-b">CME Hours</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-sans">
                                        {attendeeFile.attendees
                                          .filter(a => 
                                            !attendeeSearch || 
                                            a.name.toLowerCase().includes(attendeeSearch.toLowerCase()) || 
                                            a.regNo.toLowerCase().includes(attendeeSearch.toLowerCase()) ||
                                            a.email.toLowerCase().includes(attendeeSearch.toLowerCase())
                                          )
                                          .slice(0, 10)
                                          .map((att, idx) => (
                                            <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                                              <td className="p-2 font-mono font-bold text-blue-600">{att.regNo}</td>
                                              <td className="p-2 font-medium text-zinc-900 dark:text-white">{att.name}</td>
                                              <td className="p-2 text-zinc-500 font-mono text-[11px]">{att.email}</td>
                                              <td className="p-2 font-mono text-zinc-600 dark:text-zinc-400">{att.councilNo || "N/A"}</td>
                                              <td className="p-2 text-zinc-600 dark:text-zinc-400">{att.specialty}</td>
                                              <td className="p-2 font-mono font-bold text-emerald-600">{att.cmeHours || "12.0"}</td>
                                            </tr>
                                          ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 4. UPLOAD SOUVENIR */}
                      <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
                        <div className="flex items-center space-x-3 border-b border-zinc-100 dark:border-zinc-900 pb-3">
                          <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center font-mono">
                            4
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase font-mono flex items-center space-x-2">
                              <FileText className="w-4 h-4 text-indigo-600" />
                              <span>Upload Souvenir</span>
                            </h3>
                            <p className="text-xs text-zinc-500">
                              Upload event souvenir booklet, abstract proceedings, or conference journal PDF.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl p-5 text-center hover:border-indigo-400 transition-colors relative bg-zinc-50/50 dark:bg-zinc-900/40">
                            <input
                              type="file"
                              accept=".pdf,.epub,.docx,.png,.jpg"
                              onChange={handleSouvenirFileUpload}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            <UploadCloud className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                            <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                              Click or drag & drop Event Souvenir document
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-1">
                              Supports PDF, DOCX, EPUB souvenir booklets
                            </div>
                          </div>

                          {souvenirFile && (
                            <div className="p-3.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between text-xs">
                              <div className="flex items-center space-x-3">
                                <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                                <div>
                                  <div className="font-bold text-zinc-900 dark:text-white">{souvenirFile.fileName}</div>
                                  <div className="text-[11px] text-zinc-500 font-mono">{souvenirFile.fileSize} • {souvenirFile.fileType} • Uploaded at {souvenirFile.uploadedAt}</div>
                                </div>
                              </div>
                              <span className="px-2.5 py-1 rounded bg-indigo-100 text-indigo-800 font-bold text-[10px]">
                                Souvenir Attached
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* SAVE / PUBLISH ASSETS BUTTON */}
                      <div className="pt-2 flex justify-end space-x-3">
                        <button
                          type="submit"
                          disabled={savingAssets || !selectedEventTitle}
                          className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center space-x-2 shadow-sm transition-all"
                        >
                          {savingAssets ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Saving Assets & Attendees...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Save & Publish Scientific Event Assets</span>
                            </>
                          )}
                        </button>
                      </div>

                    </form>
                  </div>
                )}

                {/* 5. GLOBAL HEALTHCARE NEWS GENERATE TAB */}
                {activeTab === "catalog" && (
                  <div className="space-y-6">
                    {/* Bulk Generation UI */}
                    <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
                      <div className="flex items-center space-x-2 mb-4">
                        <Wand2 className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-bold text-zinc-900 dark:text-white uppercase font-mono">Bulk Global Healthcare News Generate</h3>
                      </div>
                      <p className="text-xs text-zinc-500 mb-6">
                        Automatically generate detailed 800-word news articles based on global and Indian healthcare updates from the past 24 hours. The articles will be fully populated and saved to the database.
                      </p>
                      
                      <form onSubmit={handleBulkNewsSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                          <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1 uppercase font-mono">Target Date</label>
                          <input 
                            type="date" 
                            required 
                            value={bulkNewsDate}
                            onChange={(e) => setBulkNewsDate(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1 uppercase font-mono">No. of News</label>
                          <input 
                            type="number" 
                            required 
                            min={1}
                            max={100}
                            value={bulkNewsCount}
                            onChange={(e) => setBulkNewsCount(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
                          />
                        </div>
                        <button 
                          type="submit" 
                          disabled={isBulkGenerating}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold font-mono tracking-wider flex justify-center items-center h-[34px]"
                        >
                          {isBulkGenerating ? "Generating..." : "Generate News"}
                        </button>
                      </form>
                      {bulkNewsMessage && (
                        <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs rounded-lg border border-emerald-200 dark:border-emerald-800">
                          {bulkNewsMessage}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between bg-white dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 font-bold text-xs">
                          📄
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase font-mono">
                            Published Catalog
                          </h3>
                          <span className="text-[11px] text-zinc-500 font-mono">
                            {catalog.length} published news items • Displays on main landing page under Global Healthcare News & Intel
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => { setActiveTab("write_editorial"); setEditingArticle(null); }}
                        className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold flex items-center space-x-1.5"
                      >
                        <span>+ New Article</span>
                      </button>
                    </div>

                    {/* Article Cards Grid (Exact screenshot style) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {catalog.map(art => (
                        <div
                          key={art.id}
                          className="bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase tracking-wider ${
                                art.status === "published"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}>
                                {art.status === "published" ? "✓ PUBLISHED" : "⏳ DRAFT"}
                              </span>

                              <div className="flex items-center space-x-2 text-zinc-400">
                                <button
                                  onClick={() => setEditingArticle(art)}
                                  className="p-1 hover:text-teal-600 transition-colors"
                                  title="Edit Article"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(art.id)}
                                  className="p-1 hover:text-red-600 transition-colors"
                                  title="Delete Article"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white leading-snug line-clamp-2 mb-1.5">
                              {art.headline}
                            </h4>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                              {art.summary30s}
                            </p>
                          </div>

                          <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between text-[10.5px] font-mono text-zinc-400">
                            <span>{new Date(art.publishedAt).toLocaleDateString("en-IN")}</span>
                            <span>{art.views || 0} views</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. INGESTION QUEUE TAB */}
                {activeTab === "queue" && (
                  <div className="space-y-4 max-w-4xl mx-auto">
                    <div className="text-xs font-mono font-bold text-zinc-500 uppercase">
                      Pending Review ({ingestedQueue.length})
                    </div>
                    {ingestedQueue.length === 0 ? (
                      <div className="text-center py-12 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
                        No pending articles in the ingestion queue.
                      </div>
                    ) : (
                      ingestedQueue.map(art => (
                        <div key={art.id} className="bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-amber-200 dark:border-amber-900/60 shadow-2xs space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                              Ingested AI Draft
                            </span>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handlePublish(art.id)}
                                className="px-3 py-1 rounded-lg bg-teal-600 text-white text-xs font-bold hover:bg-teal-700"
                              >
                                Approve & Publish
                              </button>
                              <button
                                onClick={() => handleDelete(art.id)}
                                className="px-3 py-1 rounded-lg border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{art.headline}</h4>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">{art.summary30s}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 7. CORRECTION REPORTS TAB */}
                {activeTab === "corrections" && (
                  <div className="space-y-4 max-w-4xl mx-auto">
                    <div className="text-xs font-mono font-bold text-zinc-500 uppercase">
                      Physician Reports ({corrections.filter(c => c.status === "pending").length})
                    </div>
                    {corrections.length === 0 ? (
                      <div className="text-center py-12 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
                        No correction reports submitted yet.
                      </div>
                    ) : (
                      corrections.map(c => (
                        <div key={c.id} className="bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs space-y-2">
                          <div className="font-bold text-zinc-900 dark:text-white">Report for Article ID: {c.articleId}</div>
                          <div className="text-zinc-600 dark:text-zinc-400">{c.issueDescription}</div>
                          <div className="text-[10px] font-mono text-zinc-400">By: {c.reporterEmail || "Anonymous Physician"}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
