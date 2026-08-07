/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { initialArticles, initialLivingGuidelines, initialHospitalAlerts } from "./src/initial_db.js";
import { Article, LivingGuideline, HospitalAlert, EvidenceLevel, Region, ImpactSeverity, MCQ, Flashcard, VivaQuestion, ScientificEvent } from "./src/types.js";
import { initialEvents } from "./src/initial_events.js";

dotenv.config();

const PORT = process.env.PORT || 8080;
// Use /tmp/db.json for writable persistence in Cloud Run
const DB_FILE = process.env.NODE_ENV === "production" || process.env.K_SERVICE ? "/tmp/db.json" : path.join(process.cwd(), "db.json");
const ORIGINAL_DB_FILE = path.join(process.cwd(), "db.json");
const SLIDER_SETTINGS_FILE = process.env.NODE_ENV === "production" || process.env.K_SERVICE ? "/tmp/slider_settings.json" : path.join(process.cwd(), "slider_settings.json");
const ORIGINAL_SLIDER_SETTINGS = path.join(process.cwd(), "slider_settings.json");


// Helper to load/save persistent database
function loadDb(): {
  articles: Article[];
  guidelines: LivingGuideline[];
  alerts: HospitalAlert[];
  corrections: any[];
  subscribers: any[];
  events: ScientificEvent[];
  eventAssets: any[];
  generatedWeeks?: any;
  uploadedImages?: any[];
  advertisements?: any[];
} {
  let db: any;
  
  // If we are using /tmp/db.json but it doesn't exist yet, copy it from the bundled db.json
  if (DB_FILE !== ORIGINAL_DB_FILE && !fs.existsSync(DB_FILE) && fs.existsSync(ORIGINAL_DB_FILE)) {
    try {
      console.log(`[Init] Copying DB from ${ORIGINAL_DB_FILE} to ${DB_FILE}`);
      fs.copyFileSync(ORIGINAL_DB_FILE, DB_FILE);
    } catch (e) {
      console.error("Failed to copy db.json to /tmp", e);
    }
  }
  
  // Copy initial slider settings if in production
  if (SLIDER_SETTINGS_FILE !== ORIGINAL_SLIDER_SETTINGS && !fs.existsSync(SLIDER_SETTINGS_FILE) && fs.existsSync(ORIGINAL_SLIDER_SETTINGS)) {
    try {
      console.log(`[Init] Copying slider settings from ${ORIGINAL_SLIDER_SETTINGS} to ${SLIDER_SETTINGS_FILE}`);
      fs.copyFileSync(ORIGINAL_SLIDER_SETTINGS, SLIDER_SETTINGS_FILE);
    } catch (e) {
      console.error("Failed to copy slider_settings.json to /tmp", e);
    }
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      db = JSON.parse(data);
    } catch (e) {
      console.error("Failed to read db.json, resetting to defaults", e);
    }
  }
  
  if (!db) {
    db = {
      articles: initialArticles,
      guidelines: initialLivingGuidelines,
      alerts: initialHospitalAlerts,
      corrections: [],
      subscribers: [],
      events: initialEvents,
      eventAssets: [],
      advertisements: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } else {
    // Self-healing migration for missing tables/arrays
    let migrated = false;
    if (!db.events) {
      db.events = initialEvents;
      migrated = true;
    }
    if (!db.corrections) {
      db.corrections = [];
      migrated = true;
    }
    if (!db.subscribers) {
      db.subscribers = [];
      migrated = true;
    }
    if (!db.eventAssets) {
      db.eventAssets = [];
      migrated = true;
    }
    if (!db.generatedWeeks) {
      db.generatedWeeks = {};
      migrated = true;
    }
    if (!db.uploadedImages) {
      db.uploadedImages = [
        {
          id: "img-gcs-101",
          name: "cardiology-summit-webpage-layout.jpg",
          url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
          gcsUrl: "https://storage.googleapis.com/healicwire-assets/cardiology-summit-webpage-layout.jpg",
          category: "WebPage Layout",
          size: "420 KB",
          uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString()
        },
        {
          id: "img-gcs-102",
          name: "healicwire-official-logo.png",
          url: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80",
          gcsUrl: "https://storage.googleapis.com/healicwire-assets/healicwire-official-logo.png",
          category: "Logo",
          size: "185 KB",
          uploadedAt: new Date(Date.now() - 86400000 * 5).toISOString()
        },
        {
          id: "img-gcs-103",
          name: "fda-drug-safety-infographic.png",
          url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
          gcsUrl: "https://storage.googleapis.com/healicwire-assets/fda-drug-safety-infographic.png",
          category: "Pharma & Drugs",
          size: "640 KB",
          uploadedAt: new Date(Date.now() - 86400000 * 1).toISOString()
        }
      ];
      migrated = true;
    }
    if (!db.advertisements) {
      db.advertisements = [];
      migrated = true;
    }
    if (migrated) {
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
    }
  }
  
  return db;
}

function saveDb(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// Lazy Gemini API Client Initialization
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();

  // CORS configuration
  const allowedOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(",").map(o => o.trim()) 
    : ["http://localhost:5173", "http://localhost:3001", "http://localhost:8080", "https://healicwire.in", "https://www.healicwire.in"];

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        return callback(null, true);
      }
      return callback(new Error("CORS policy violation: Origin not allowed"), false);
    },
    credentials: true
  }));

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Initialize DB
  const db = loadDb();

  // Initialize Supabase Admin Client
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }

    const token = authHeader.replace("Bearer ", "");
    // JWT logging removed for production security
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      console.error("Supabase auth error:", error);
      return res.status(401).json({ error: "Invalid or expired token: " + (error?.message || "No user found") });
    }
    
    (req as any).user = user;
    next();
  };

  // Rate Limiting for protected admin routes (e.g. AI generation, uploads)
  const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    message: { error: "Too many requests from this IP, please try again after 15 minutes" },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Protect all admin routes
  app.use("/api/admin", requireAuth, adminLimiter);

  // Profile management endpoint (bypasses RLS issues for inserts)
  app.post("/api/admin/profile", async (req, res) => {
    try {
      const user = (req as any).user;
      const { name, degree, role, work_place, bio, avatar_url } = req.body;
      
      const { error } = await supabaseAdmin
        .from("user_profiles")
        .upsert({
          id: user.id,
          email: user.email,
          name,
          degree,
          role,
          work_place,
          bio,
          avatar_url,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error saving profile:", error);
      res.status(500).json({ error: error.message || "Failed to save profile" });
    }
  });

  // Get current user profile
  app.get("/api/admin/profile", async (req, res) => {
    try {
      const user = (req as any).user;
      const { data, error } = await supabaseAdmin
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      res.json({ profile: data });
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: error.message || "Failed to fetch profile" });
    }
  });

  // --- API ROUTES ---

  // Get all profiles (bypasses RLS so frontend can display author profiles)
  app.get("/api/profiles", async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin.from("user_profiles").select("*");
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      console.error("Error fetching profiles:", error);
      res.status(500).json({ error: error.message || "Failed to fetch profiles" });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      articlesCount: db.articles.length,
      guidelinesCount: db.guidelines.length,
      alertsCount: db.alerts.length,
      hasGeminiKey: !!process.env.GEMINI_API_KEY
    });
  });

  // Helper to map DB snake_case back to camelCase for frontend
  const mapArticleFromDb = (row: any) => ({
    ...row,
    imageUrl: row.image_url,
    imageCredit: row.image_credit,
    imageType: row.image_type,
    publishedAt: row.published_at,
    sourcePublishedAt: row.source_published_at,
    readingTimeMinutes: row.reading_time_minutes,
    sourceName: row.source_name || row.author_name,
    sourceUrl: row.source_url,
    evidenceLevel: row.evidence_level,
    isAiAssisted: row.is_ai_assisted,
    summary30s: row.summary_30s,
    summary2min: row.summary_2min,
    bodyAnalysis: row.body_analysis,
    whyThisMatters: row.why_this_matters,
    whatChanged: row.what_changed,
    impactScores: row.impact_scores,
    indiaRelevance: row.india_relevance,
    peerReviewed: row.peer_reviewed,
    fundingSource: row.funding_source,
    coiNote: row.coi_note,
    studyDesign: row.study_design,
    sampleSize: row.sample_size,
    learningModule: row.learning_module,
    factCheckClaims: row.fact_check_claims,
    clinicalImpactScore: row.clinical_impact_score
  });

  // Get articles (with advanced filtering, search, and grouping)
  app.get("/api/articles", async (req, res) => {
    try {
      const { category, specialty, region, evidenceLevel, q, status } = req.query;
      let query = supabaseAdmin.from('health_news').select('*');

      // Filter by status (default is published for public, or all if requested for admin)
      const targetStatus = status ? String(status) : "published";
      if (targetStatus !== "all") {
        query = query.eq('status', targetStatus);
      }

      if (category) query = query.ilike('category', String(category));
      if (region) query = query.ilike('region', String(region));
      if (evidenceLevel) query = query.ilike('evidence_level', String(evidenceLevel));
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      
      let filtered = data.map(mapArticleFromDb);

      // Dynamic views logic: jump 50 to 100 every day based on created_at
      filtered = filtered.map(a => {
        if (a.createdAt) {
          const daysElapsed = Math.floor((new Date().getTime() - new Date(a.createdAt).getTime()) / (1000 * 3600 * 24));
          if (daysElapsed > 0) {
            const pseudoRandom = 50 + ((a.id ? a.id.charCodeAt(0) : 0) % 51); // Consistent 50-100 jump per article
            a.views = (a.views || 0) + (daysElapsed * pseudoRandom);
          }
        }
        return a;
      });

      if (specialty) {
        const specStr = String(specialty).toLowerCase();
        filtered = filtered.filter(a => a.specialties && a.specialties.some((s: string) => s.toLowerCase() === specStr));
      }

      if (q) {
        const queryStr = String(q).toLowerCase();
        filtered = filtered.filter(
          a =>
            (a.headline && a.headline.toLowerCase().includes(queryStr)) ||
            (a.subhead && a.subhead.toLowerCase().includes(queryStr)) ||
            (a.bodyAnalysis && a.bodyAnalysis.toLowerCase().includes(queryStr)) ||
            (a.summary30s && a.summary30s.toLowerCase().includes(queryStr))
        );
      }

      res.json(filtered);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get single article (and increment view count)
  app.get("/api/articles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const { data, error } = await supabaseAdmin.from('health_news').select('*').eq('id', id);
      if (error) throw error;
      if (!data || data.length === 0) return res.status(404).json({ error: "Article not found" });

      const article = data[0];
      const newViews = (article.views || 0) + 1;
      
      await supabaseAdmin.from('health_news').update({ views: newViews }).eq('id', id);
      
      article.views = newViews;
      res.json(mapArticleFromDb(article));
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Dynamic Open Graph generator for social media link previews
  app.get("/api/share/article/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      let redirectPath = '/';

      // Try to find the article in articles table first
      let { data, error } = await supabaseAdmin.from('health_news').select('*').eq('id', id).maybeSingle();
      
      if (data) {
        if (data.category === 'Editorial') redirectPath = '/editorials';
        else if (data.category === 'Clinical Insights') redirectPath = '/clinical-insights';
      }
      
      // If not found, try editorials
      if (!data) {
        const resp = await supabaseAdmin.from('editorials').select('*').eq('id', id).maybeSingle();
        data = resp.data;
        if (data) redirectPath = '/editorials';
      }
      
      // If not found, try clinical insights
      if (!data) {
        const resp = await supabaseAdmin.from('clinical_insights').select('*').eq('id', id).maybeSingle();
        data = resp.data;
        if (data) redirectPath = '/clinical-insights';
      }

      const host = req.headers['x-forwarded-host'] || req.headers.host || '';
      const frontendOrigin = (host.includes('localhost') || host.includes('127.0.0.1'))
        ? `http://${host}`
        : "https://healicwire.com";
      
      const fallbackUrl = `${frontendOrigin}${redirectPath}`;
      const redirectUrl = `${frontendOrigin}${redirectPath}?article=${id}`;

      if (error || !data) {
        return res.redirect(fallbackUrl);
      }

      const article = mapArticleFromDb(data);
      const title = article.headline ? article.headline.replace(/"/g, '&quot;') : "HealicWire";
      const description = article.summary30s ? article.summary30s.replace(/"/g, '&quot;') : "Global Healthcare News";
      const image = article.imageUrl || "https://storage.googleapis.com/healicwire-assets/healicwire-official-logo.png";
      
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${image}">
  <meta property="og:url" content="${redirectUrl}">
  <meta property="og:type" content="article">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${image}">
  <meta http-equiv="refresh" content="0; url=${redirectUrl}">
</head>
<body>
  <p>Redirecting to article...</p>
  <script>window.location.replace("${redirectUrl}");</script>
</body>
</html>`;

      res.send(html);
    } catch (err: any) {
      console.error("Error generating share preview:", err);
      const host = req.headers['x-forwarded-host'] || req.headers.host || '';
      const fallbackUrl = (host.includes('localhost') || host.includes('127.0.0.1')) ? `http://${host}/` : "https://healicwire.com/";
      res.redirect(fallbackUrl);
    }
  });

  // Create article (Admin/CMS)
  app.post("/api/admin/articles", async (req, res) => {
    try {
      const slug = req.body.headline.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const payload = {
        id: "art-" + Date.now(),
        slug: slug,
        headline: req.body.headline,
        subhead: req.body.subhead || "",
        category: req.body.category || "Clinical",
        specialties: req.body.specialties || [],
        region: req.body.region || Region.GLOBAL,
        image_url: req.body.imageUrl || "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
        image_credit: req.body.imageCredit || "Editorial Illustration",
        image_type: req.body.imageType || "Illustration",
        published_at: new Date().toISOString(),
        source_published_at: req.body.sourcePublishedAt || new Date().toISOString(),
        reading_time_minutes: req.body.readingTimeMinutes || 3,
        status: req.body.status || "published",
        source_name: req.body.sourceName || "Official Release",
        source_url: req.body.sourceUrl || "#",
        evidence_level: req.body.evidenceLevel || EvidenceLevel.EXPERT_OPINION,
        is_ai_assisted: req.body.isAiAssisted || false,
        summary_30s: req.body.summary30s || "",
        summary_2min: req.body.summary2min || "",
        body_analysis: req.body.bodyAnalysis || "",
        why_this_matters: req.body.whyThisMatters || { clinicians: "", students: "", hospitalAdministrators: "", patients: "", researchers: "" },
        what_changed: req.body.whatChanged,
        impact_scores: req.body.impactScores || { clinicalPractice: 3, medicalEducation: 3, research: 3, publicHealth: 3, hospitalOperations: 3, patientCare: 3 },
        india_relevance: req.body.indiaRelevance || { status: "Directly applicable", explanation: "" },
        peer_reviewed: req.body.peerReviewed !== undefined ? req.body.peerReviewed : true,
        funding_source: req.body.fundingSource || "None disclosed",
        coi_note: req.body.coiNote || "None disclosed",
        study_design: req.body.studyDesign,
        sample_size: req.body.sampleSize,
        "references": req.body.references || [],
        learning_module: req.body.learningModule,
        fact_check_claims: req.body.factCheckClaims || [],
        clinical_impact_score: req.body.clinicalImpactScore
      };
      
      const { data, error } = await supabaseAdmin.from('health_news').insert([payload]).select();
      if (error) throw error;
      res.status(201).json(data[0]);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Edit / Update article
  app.put("/api/admin/articles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const updatePayload: any = {};
      if (req.body.headline !== undefined) updatePayload.headline = req.body.headline;
      if (req.body.subhead !== undefined) updatePayload.subhead = req.body.subhead;
      if (req.body.category !== undefined) updatePayload.category = req.body.category;
      if (req.body.specialties !== undefined) updatePayload.specialties = req.body.specialties;
      if (req.body.region !== undefined) updatePayload.region = req.body.region;
      if (req.body.imageUrl !== undefined) updatePayload.image_url = req.body.imageUrl;
      if (req.body.imageCredit !== undefined) updatePayload.image_credit = req.body.imageCredit;
      if (req.body.imageType !== undefined) updatePayload.image_type = req.body.imageType;
      if (req.body.sourcePublishedAt !== undefined) updatePayload.source_published_at = req.body.sourcePublishedAt;
      if (req.body.readingTimeMinutes !== undefined) updatePayload.reading_time_minutes = req.body.readingTimeMinutes;
      if (req.body.status !== undefined) updatePayload.status = req.body.status;
      if (req.body.sourceName !== undefined) updatePayload.source_name = req.body.sourceName;
      if (req.body.sourceUrl !== undefined) updatePayload.source_url = req.body.sourceUrl;
      if (req.body.evidenceLevel !== undefined) updatePayload.evidence_level = req.body.evidenceLevel;
      if (req.body.isAiAssisted !== undefined) updatePayload.is_ai_assisted = req.body.isAiAssisted;
      if (req.body.summary30s !== undefined) updatePayload.summary_30s = req.body.summary30s;
      if (req.body.summary2min !== undefined) updatePayload.summary_2min = req.body.summary2min;
      if (req.body.bodyAnalysis !== undefined) updatePayload.body_analysis = req.body.bodyAnalysis;
      if (req.body.whyThisMatters !== undefined) updatePayload.why_this_matters = req.body.whyThisMatters;
      if (req.body.whatChanged !== undefined) updatePayload.what_changed = req.body.whatChanged;
      if (req.body.impactScores !== undefined) updatePayload.impact_scores = req.body.impactScores;
      if (req.body.indiaRelevance !== undefined) updatePayload.india_relevance = req.body.indiaRelevance;
      if (req.body.peerReviewed !== undefined) updatePayload.peer_reviewed = req.body.peerReviewed;
      if (req.body.fundingSource !== undefined) updatePayload.funding_source = req.body.fundingSource;
      if (req.body.coiNote !== undefined) updatePayload.coi_note = req.body.coiNote;
      if (req.body.studyDesign !== undefined) updatePayload.study_design = req.body.studyDesign;
      if (req.body.sampleSize !== undefined) updatePayload.sample_size = req.body.sampleSize;
      if (req.body.references !== undefined) updatePayload["references"] = req.body.references;
      if (req.body.learningModule !== undefined) updatePayload.learning_module = req.body.learningModule;
      if (req.body.factCheckClaims !== undefined) updatePayload.fact_check_claims = req.body.factCheckClaims;
      if (req.body.clinicalImpactScore !== undefined) updatePayload.clinical_impact_score = req.body.clinicalImpactScore;
      if (req.body.slug !== undefined) updatePayload.slug = req.body.slug;
      
      const { data, error } = await supabaseAdmin.from('health_news').update(updatePayload).eq('id', id).select();
      if (error) throw error;
      if (!data || data.length === 0) return res.status(404).json({ error: "Article not found" });
      res.json(data[0]);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Delete article
  app.delete("/api/admin/articles/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = await supabaseAdmin.from('health_news').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // EDITORIALS (Admin/CMS)
  // ==========================================
  
  app.get("/api/admin/editorials", async (req, res) => {
    try {
      const user = (req as any).user;
      
      const { data, error } = await supabaseAdmin
        .from('editorials')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      res.json((data || []).map(mapArticleFromDb));
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/editorials", async (req, res) => {
    try {
      const slug = req.body.headline.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + '-' + Math.floor(Math.random() * 1000);
      const payload = {
        slug: slug,
        headline: req.body.headline,
        subhead: req.body.subhead || "",
        category: req.body.category || "Clinical",
        specialties: req.body.specialties || [],
        region: req.body.region || "Global",
        image_url: req.body.imageUrl || "",
        image_credit: req.body.imageCredit || "Editorial Illustration",
        published_at: req.body.status === "published" ? new Date().toISOString() : null,
        status: req.body.status || "draft",
        author_name: req.body.sourceName || "HealicWire Editorial Board",
        reading_time_minutes: req.body.readingTimeMinutes || 6,
        summary_30s: req.body.summary30s || "",
        body_analysis: req.body.bodyAnalysis || "",
        clinical_impact_score: req.body.clinicalImpactScore || 8
      };

      const { data, error } = await supabaseAdmin.from('editorials').insert(payload).select();
      if (error) throw error;
      res.json(mapArticleFromDb(data[0]));
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/admin/editorials/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const payload: any = {
        headline: req.body.headline,
        subhead: req.body.subhead,
        category: req.body.category,
        specialties: req.body.specialties,
        region: req.body.region,
        image_url: req.body.imageUrl,
        image_credit: req.body.imageCredit,
        status: req.body.status,
        author_name: req.body.sourceName,
        reading_time_minutes: req.body.readingTimeMinutes,
        summary_30s: req.body.summary30s,
        body_analysis: req.body.bodyAnalysis,
        clinical_impact_score: req.body.clinicalImpactScore,
        updated_at: new Date().toISOString()
      };
      
      if (req.body.status === "published") {
        payload.published_at = new Date().toISOString();
      }

      const { data, error } = await supabaseAdmin.from('editorials').update(payload).eq('id', id).select();
      if (error) throw error;
      res.json(mapArticleFromDb(data[0]));
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/admin/editorials/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = await supabaseAdmin.from('editorials').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/editorials/generate", async (req, res) => {
    try {
      const { topic, criteria, category, region } = req.body;
      if (!topic) return res.status(400).json({ error: "Topic is required" });

      const prompt = `
        You are the Chief Clinical Editor for HealicWire, a professional medical news platform.
        Write a highly detailed, peer-level clinical editorial (approximately 1300 words) on the following topic: "${topic}".
        ${criteria ? `\n        Follow these specific criteria and guidelines for the article:\n        ${criteria}\n` : ''}
        The editorial should be evidence-based, referencing clinical guidelines, recent trials, and practical implications for physicians.
        
        Return a RAW JSON object WITHOUT markdown blocks, conforming exactly to this structure:
        {
          "headline": "A compelling, professional headline",
          "subhead": "A brief subheadline summarizing the main point",
          "category": "${category || 'Clinical Practice'}",
          "specialties": ["Specialty 1", "Specialty 2"],
          "region": "${region || 'Global'}",
          "reading_time_minutes": 6,
          "summary_30s": "A 1-paragraph executive summary (approx 50 words) for quick scanning.",
          "body_analysis": "The full detailed editorial text (approx 1300 words). Use markdown for formatting, including ## headings for sections, bullet points, and paragraphs.",
          "clinical_impact_score": 8,
          "sourceName": "HealicWire Editorial Board"
        }
      `;

      const result = await getGeminiClient().models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7
        }
      });

      let text = result.text || "{}";
      
      let article;
      try {
        text = text.replace(/\\(?!["\\/bfnrt])/g, "\\\\");
        text = text.replace(/[\x00-\x1F\x7F]/g, "");
        article = JSON.parse(text);
      } catch (parseError: any) {
        console.error("JSON Parse Error:", parseError);
        return res.status(500).json({ error: "Failed to parse AI response", details: parseError.message });
      }
      
      // Map to frontend expected names
      article.readingTimeMinutes = article.reading_time_minutes;
      article.summary30s = article.summary_30s;
      article.bodyAnalysis = article.body_analysis;
      article.clinicalImpactScore = article.clinical_impact_score;
      
      // Fetch Wiki image
      let finalImageUrl = "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80";
      let finalImageCredit = "Editorial Illustration";
      try {
        const wikiTopic = article.category || topic;
        const wikiRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&generator=search&gsrsearch=${encodeURIComponent(wikiTopic)}&gsrlimit=20&pithumbsize=800`);
        const json = await wikiRes.json();
        const urls: string[] = [];
        if (json.query && json.query.pages) {
          for (const key in json.query.pages) {
            const page = json.query.pages[key];
            if (page.thumbnail && page.thumbnail.source && !page.thumbnail.source.includes('svg')) {
              urls.push(page.thumbnail.source);
            }
          }
        }
        if (urls.length > 0) {
          finalImageUrl = urls[Math.floor(Math.random() * urls.length)];
          finalImageCredit = "Wikimedia Commons";
        }
      } catch (e) {
        console.error("Wiki fetch error in editorial generation:", e);
      }

      article.imageUrl = finalImageUrl;
      article.imageCredit = finalImageCredit;

      // Ensure id is returned so frontend doesn't ignore it!
      article.id = "ed-temp-" + Date.now();

      res.json(article);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });


  // ==========================================
  // CLINICAL INSIGHTS (Admin/CMS)
  // ==========================================

  app.get("/api/admin/clinical_insights", async (req, res) => {
    try {
      const user = (req as any).user;
      
      const { data: profile } = await supabaseAdmin.from('user_profiles').select('*').eq('id', user.id).maybeSingle();
      
      let query = supabaseAdmin.from('clinical_insights').select('*').order('created_at', { ascending: false });
      
      const hasAdmin = profile?.permissions?.some((p: string) => p.toLowerCase().includes('admin') || p.toLowerCase().includes('control panel'));
      
      if (!hasAdmin) {
         const authorNames = [];
         if (profile?.name) authorNames.push(profile.name);
         if (user.email) authorNames.push(user.email);
         if (authorNames.length > 0) {
           query = query.in('author_name', authorNames);
         }
      }
      
      const { data, error } = await query;
      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/clinical_insights", async (req, res) => {
    try {
      const slug = req.body.headline.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + '-' + Math.floor(Math.random() * 1000);
      const payload = {
        id: "ci-" + Date.now(),
        slug: slug,
        headline: req.body.headline,
        subhead: req.body.subhead || "",
        category: req.body.category || "Clinical Insights",
        specialties: req.body.specialties || [],
        region: req.body.region || "Global",
        image_url: req.body.imageUrl || "",
        image_credit: req.body.imageCredit || "",
        published_at: req.body.status === "published" ? new Date().toISOString() : null,
        status: req.body.status || "draft",
        author_name: req.body.sourceName || "Clinical Consultant",
        reading_time_minutes: req.body.readingTimeMinutes || 6,
        summary_30s: req.body.summary30s || "",
        body_analysis: req.body.bodyAnalysis || "",
        clinical_impact_score: req.body.clinicalImpactScore || 8
      };

      const { data, error } = await supabaseAdmin.from('clinical_insights').insert(payload).select();
      if (error) throw error;
      res.json(data[0]);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/admin/clinical_insights/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const payload: any = {
        headline: req.body.headline,
        subhead: req.body.subhead,
        category: req.body.category,
        specialties: req.body.specialties,
        region: req.body.region,
        image_url: req.body.imageUrl,
        image_credit: req.body.imageCredit,
        status: req.body.status,
        author_name: req.body.sourceName,
        reading_time_minutes: req.body.readingTimeMinutes,
        summary_30s: req.body.summary30s,
        body_analysis: req.body.bodyAnalysis,
        clinical_impact_score: req.body.clinicalImpactScore,
        updated_at: new Date().toISOString()
      };
      
      if (req.body.status === "published") {
        payload.published_at = new Date().toISOString();
      }

      const { data, error } = await supabaseAdmin.from('clinical_insights').update(payload).eq('id', id).select();
      if (error) throw error;
      res.json(data[0]);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/admin/clinical_insights/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = await supabaseAdmin.from('clinical_insights').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/clinical_insights/generate", async (req, res) => {
    try {
      const { topic, criteria, category, region } = req.body;
      if (!topic) return res.status(400).json({ error: "Topic is required" });

      const prompt = `
        You are an expert Clinical Consultant writing for HealicWire.
        Write a highly detailed clinical insight (approximately 1000 words) on the following topic: "${topic}".
        ${criteria ? `\n        Follow these specific criteria and guidelines:\n        ${criteria}\n` : ''}
        The insight should be evidence-based, practical, and highly relevant to clinicians.
        
        Return a JSON object with the following fields:
        {
          "headline": "A compelling, professional headline",
          "subhead": "A brief subheadline summarizing the main point",
          "category": "${category || 'Clinical Insights'}",
          "specialties": ["Specialty 1", "Specialty 2"],
          "region": "${region || 'Global'}",
          "readingTimeMinutes": 5,
          "summary30s": "A 1-paragraph executive summary (approx 50 words) for quick scanning.",
          "bodyAnalysis": "The full detailed insight text. Use markdown for formatting, including ## headings for sections, bullet points, and paragraphs.",
          "clinicalImpactScore": 8,
          "sourceName": "Clinical Consultant"
        }
      `;

      const result = await getGeminiClient().models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt
      });

      const text = result.text || "{}";
      const cleanJson = text.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
      const article = JSON.parse(cleanJson);
      
      let finalImageUrl = "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80";
      let finalImageCredit = "Clinical Insight Illustration";
      try {
        const wikiTopic = article.category || topic;
        const wikiRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&generator=search&gsrsearch=${encodeURIComponent(wikiTopic)}&gsrlimit=20&pithumbsize=800`);
        const json = await wikiRes.json();
        const urls: string[] = [];
        if (json.query && json.query.pages) {
          for (const key in json.query.pages) {
            const page = json.query.pages[key];
            if (page.thumbnail && page.thumbnail.source && !page.thumbnail.source.includes('svg')) {
              urls.push(page.thumbnail.source);
            }
          }
        }
        if (urls.length > 0) {
          finalImageUrl = urls[Math.floor(Math.random() * urls.length)];
          finalImageCredit = "Wikimedia Commons";
        }
      } catch (e) {
        console.error("Wiki fetch error in clinical insight generation:", e);
      }

      article.imageUrl = finalImageUrl;
      article.imageCredit = finalImageCredit;

      res.json({ success: true, article });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get current guidelines
  app.get("/api/current-guidelines", (req, res) => {
    res.json(db.guidelines);
  });

  // Get scientific events
  app.get("/api/scientific-events", (req, res) => {
    res.json(db.events || []);
  });

  // Get public repository items
  app.get("/api/repository", async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from("repository")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      // Map backend snake_case to frontend expected structure
      const mappedData = data.map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: item.details,
        img: item.promotion_image,
        category: item.product_name || "General", // Using product_name as category based on DB structure
        date: item.created_at,
        logo: item.logo,
        productName: item.product_name
      }));

      res.json(mappedData);
    } catch (err: any) {
      console.error("Error fetching repository items:", err);
      res.status(500).json({ error: err.message || "Failed to fetch repository" });
    }
  });
  // Get public advertisements
  app.get("/api/advertisements", async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from("advertisements")
        .select("*")
        .eq("status", "active")
        .order("display_order", { ascending: true });

      if (error) {
        throw error;
      }

      res.json(data || []);
    } catch (err: any) {
      console.error("Error fetching advertisements:", err);
      res.status(500).json({ error: err.message || "Failed to fetch advertisements" });
    }
  });

  // Get public slider settings
  app.get("/api/slider-settings", (req, res) => {
    try {
      const data = fs.readFileSync(SLIDER_SETTINGS_FILE, "utf-8");
      res.json(JSON.parse(data));
    } catch (e) {
      console.error("Failed to read slider settings", e);
      res.json({ maxItems: 5, selectedIds: [] });
    }
  });

  // Add scientific event
  app.post("/api/scientific-events", requireAuth, async (req, res) => {
    try {
      const { 
        title, organizer, scope, eventType, targetProfessions, startDate, endDate, duration, 
        venue, city, state, country, institution, format, specialties, cmeCredits, 
        cmeAccreditationBody, description, objectives, abstractDeadline, registrationDeadline, 
        earlyBirdDeadline, earlyBirdCost, cost, seatsAvailable, seatsLeft, imageUrl, posterUrl, 
        keynoteSpeakers, speakerProfiles, schedule, registrationUrl, organizerWebsite, faqs,
        submissionUrl, certificateUrl, souvenirUrl, webpageImage, slug, managed
      } = req.body;
      
      if (!title || !organizer || !startDate || !venue) {
        return res.status(400).json({ error: "Missing required fields (title, organizer, startDate, venue)" });
      }

      const payload = {
        title,
        organizer,
        scope: scope || "Local",
        event_type: eventType || "Conference",
        target_professions: targetProfessions || ["MBBS", "MD/MS", "DM/MCh"],
        start_date: startDate,
        end_date: endDate || startDate,
        duration: duration || "1 Day",
        venue,
        city: city || "Local",
        state: state || "",
        country: country || "India",
        institution: institution || organizer,
        format: format || "In-Person",
        specialties: specialties && specialties.length > 0 ? specialties : ["General Medicine"],
        cme_credits: Number(cmeCredits) || 0,
        cme_accreditation_body: cmeAccreditationBody || "Medical Council",
        description: description || "",
        objectives: objectives || [],
        abstract_deadline: abstractDeadline || undefined,
        registration_deadline: registrationDeadline || undefined,
        early_bird_deadline: earlyBirdDeadline || undefined,
        early_bird_cost: earlyBirdCost || undefined,
        cost: cost || "Free",
        seats_available: Number(seatsAvailable) || 100,
        seats_left: Number(seatsLeft) || Number(seatsAvailable) || 100,
        status: "Approved",
        image_url: imageUrl || "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
        poster_url: posterUrl || undefined,
        keynote_speakers: keynoteSpeakers || [],
        speaker_profiles: speakerProfiles || [],
        schedule: schedule || [],
        registration_url: registrationUrl || "#",
        submission_url: submissionUrl || undefined,
        certificate_url: certificateUrl || undefined,
        souvenir_url: souvenirUrl || undefined,
        webpage_image: webpageImage || undefined,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        organizer_website: organizerWebsite || undefined,
        faqs: faqs || [],
        views_count: 1,
        registrations_count: 0,
        rating: 5.0,
        managed: managed || "Managed"
      };

      const { data, error } = await supabaseAdmin.from('scientific_events').insert([payload]).select();
      if (error) throw error;
      res.status(201).json(data[0]);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Update / Republish event
  app.put("/api/scientific-events/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const updatePayload: any = {};
      const fieldsToSnake: Record<string, string> = {
        title: "title", organizer: "organizer", scope: "scope", eventType: "event_type", 
        targetProfessions: "target_professions", startDate: "start_date", endDate: "end_date", 
        duration: "duration", venue: "venue", city: "city", state: "state", country: "country", 
        institution: "institution", format: "format", specialties: "specialties", cmeCredits: "cme_credits", 
        cmeAccreditationBody: "cme_accreditation_body", description: "description", objectives: "objectives", 
        abstractDeadline: "abstract_deadline", registrationDeadline: "registration_deadline", 
        earlyBirdDeadline: "early_bird_deadline", earlyBirdCost: "early_bird_cost", cost: "cost", 
        seatsAvailable: "seats_available", seatsLeft: "seats_left", status: "status", imageUrl: "image_url", 
        posterUrl: "poster_url", keynoteSpeakers: "keynote_speakers", speakerProfiles: "speaker_profiles", 
        schedule: "schedule", registrationUrl: "registration_url", submissionUrl: "submission_url", 
        certificateUrl: "certificate_url", souvenirUrl: "souvenir_url", webpageImage: "webpage_image", 
        slug: "slug", organizerWebsite: "organizer_website", faqs: "faqs", viewsCount: "views_count", 
        registrationsCount: "registrations_count", rating: "rating", aiSummary: "ai_summary", managed: "managed"
      };

      for (const [camelKey, snakeKey] of Object.entries(fieldsToSnake)) {
        if (req.body[camelKey] !== undefined) {
          updatePayload[snakeKey] = req.body[camelKey];
        }
      }

      const { data, error } = await supabaseAdmin.from('scientific_events').update(updatePayload).eq('id', id).select();
      if (error) throw error;
      if (!data || data.length === 0) return res.status(404).json({ error: "Event not found" });
      res.json(data[0]);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Delete event
  app.delete("/api/scientific-events/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = await supabaseAdmin.from('scientific_events').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true, message: "Event removed successfully" });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Approve / Reject Event (Admin)
  app.patch("/api/admin/scientific-events/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const { data, error } = await supabaseAdmin.from('scientific_events').update({ status }).eq('id', id).select();
      if (error) throw error;
      if (!data || data.length === 0) return res.status(404).json({ error: "Event not found" });
      res.json(data[0]);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Google Cloud Storage Uploaded Images API
  app.get("/api/admin/uploaded-images", (req, res) => {
    if (!db.uploadedImages) db.uploadedImages = [];
    res.json(db.uploadedImages);
  });

  app.post("/api/admin/uploaded-images", (req, res) => {
    const { name, url, category, size, dataUrl } = req.body;
    if (!name || (!url && !dataUrl)) {
      return res.status(400).json({ error: "Missing required image fields (name, url/dataUrl)" });
    }

    const imgId = "img-gcs-" + Date.now();
    const cleanName = name.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
    const gcsUrl = `https://storage.googleapis.com/healicwire-assets/${cleanName}`;

    const newImage = {
      id: imgId,
      name: name || "uploaded-asset.png",
      url: url || dataUrl,
      gcsUrl,
      category: category || "General Asset",
      size: size || "350 KB",
      uploadedAt: new Date().toISOString()
    };

    if (!db.uploadedImages) db.uploadedImages = [];
    db.uploadedImages.unshift(newImage);
    saveDb(db);
    res.status(201).json(newImage);
  });

  app.delete("/api/admin/uploaded-images/:id", (req, res) => {
    const { id } = req.params;
    if (!db.uploadedImages) return res.status(404).json({ error: "No images found" });
    db.uploadedImages = db.uploadedImages.filter((img: any) => img.id !== id);
    saveDb(db);
    res.json({ success: true, message: "Image removed from Google Cloud Storage gallery" });
  });

  // Get managed scientific event assets
  app.get("/api/admin/event-assets", (req, res) => {
    const currentDb = loadDb();
    res.json(currentDb.eventAssets || []);
  });

  // Save / Update managed scientific event assets
  app.post("/api/admin/event-assets", (req, res) => {
    const currentDb = loadDb();
    if (!currentDb.eventAssets) {
      currentDb.eventAssets = [];
    }

    const { pageId, pageTitle, certificateFormat, attendeesExcel, souvenir } = req.body;
    
    if (!pageTitle) {
      return res.status(400).json({ error: "Page / Topic Title is required" });
    }

    const existingIndex = currentDb.eventAssets.findIndex(
      (a: any) => (pageId && a.pageId === pageId) || a.pageTitle.toLowerCase() === pageTitle.toLowerCase()
    );

    const assetRecord = {
      id: existingIndex !== -1 ? currentDb.eventAssets[existingIndex].id : "asset-" + Date.now(),
      pageId: pageId || "page-" + Date.now(),
      pageTitle,
      certificateFormat: certificateFormat || null,
      attendeesExcel: attendeesExcel || null,
      souvenir: souvenir || null,
      updatedAt: new Date().toISOString()
    };

    if (existingIndex !== -1) {
      currentDb.eventAssets[existingIndex] = assetRecord;
    } else {
      currentDb.eventAssets.unshift(assetRecord);
    }

    saveDb(currentDb);
    res.status(200).json({ success: true, asset: assetRecord });
  });

  // GET generated locked weeks per section
  app.get("/api/admin/generated-weeks", (req, res) => {
    res.json([]); // Mock implementation if not used
  });

  app.post("/api/generate-bulk-news", requireAuth, async (req, res) => {
    try {
      const { targetDate, count = 1 } = req.body;
      const ai = getGeminiClient();
      
      const prompt = `
      You are an expert medical journalist for HealicWire.
      Generate ${count} realistic, comprehensive clinical news articles for the healthcare/pharmaceutical industry. 
      The date of the news should be considered around: ${targetDate}.
      
      CRITICAL REQUIREMENT: The "bodyAnalysis" field MUST be extremely detailed, approximately 800 words in length, divided into clear markdown headings (e.g., Background, Methodology, Clinical Implementation, Future Horizons).
      
      CRITICAL REQUIREMENT: For "evidenceLevel", you MUST use EXACTLY ONE of the following string values and nothing else:
      'Systematic Review', 'Meta-Analysis', 'Randomized Controlled Trial', 'Clinical Guideline', 'Regulatory Approval', 'Government Notification', 'Observational Study', 'Preprint', 'Case Report', 'Expert Opinion', 'Press Release'
      
      You must respond with a JSON array of objects. Do not wrap in markdown \`\`\`json. Just the raw array.
      
      Each object must match this schema:
      {
        "headline": "String",
        "subhead": "String",
        "category": "String (e.g., Clinical Practice, Health Tech, Policy)",
        "specialties": ["String"],
        "region": "String (MUST be exactly 'Global' or 'India')",
        "imageUrl": "String (use https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80 for now)",
        "imageCredit": "Unsplash",
        "imageType": "photograph",
        "publishedAt": "${targetDate}T10:00:00Z",
        "sourcePublishedAt": "${targetDate}T09:00:00Z",
        "readingTimeMinutes": 5,
        "status": "published",
        "sourceName": "String (e.g., The Lancet, WHO, NEJM, CDSCO, HealicWire Medical Intelligence)",
        "sourceUrl": "String (A realistic URL for the source)",
        "evidenceLevel": "String (Must be from the exact list provided above)",
        "isAiAssisted": true,
        "summary30s": "String (Executive summary)",
        "summary2min": "String (Longer summary in markdown)",
        "bodyAnalysis": "String (Markdown, ~800 words, highly detailed clinical analysis)",
        "whyThisMatters": { "patients": "String", "students": "String", "clinicians": "String", "researchers": "String", "hospitalAdministrators": "String" },
        "whatChanged": { "previousStandard": "String", "newParadigm": "String" },
        "impactScores": { "research": Number(1-5), "patientCare": Number, "publicHealth": Number, "clinicalPractice": Number, "medicalEducation": Number, "hospitalOperations": Number },
        "clinicalImpactScore": Number(1-100),
        "indiaRelevance": { "status": "String", "explanation": "String" },
        "peerReviewed": true,
        "fundingSource": "String",
        "coiNote": "String",
        "studyDesign": "String",
        "sampleSize": "String",
        "factCheckClaims": [{ "claim": "String", "status": "String" }],
        "learningModule": { "objectives": ["String"], "keyTakeaways": ["String"], "mcqs": [] },
        "references": ["String"]
      }
      `;

      const result = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt
      });

      const text = result.text || "[]";
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const articles = JSON.parse(cleanJson);

      let successCount = 0;
      for (const article of articles) {
        const validEvidenceLevels = ['Systematic Review', 'Meta-Analysis', 'Randomized Controlled Trial', 'Clinical Guideline', 'Regulatory Approval', 'Government Notification', 'Observational Study', 'Preprint', 'Case Report', 'Expert Opinion', 'Press Release'];
        const finalEvidenceLevel = validEvidenceLevels.includes(article.evidenceLevel) ? article.evidenceLevel : "Expert Opinion";

        const finalRegion = ['Global', 'India'].includes(article.region) ? article.region : 'Global';

        const generatedSlug = article.headline ? article.headline.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.floor(Math.random() * 10000) : 'article-' + Math.floor(Math.random() * 1000000);

        let finalImageUrl = article.imageUrl;
        let finalImageCredit = article.imageCredit;
        try {
          const wikiTopic = article.category || "Medicine";
          const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&generator=search&gsrsearch=${encodeURIComponent(wikiTopic)}&gsrlimit=20&pithumbsize=800`);
          const json = await res.json();
          const urls: string[] = [];
          if (json.query && json.query.pages) {
            for (const key in json.query.pages) {
              const page = json.query.pages[key];
              if (page.thumbnail && page.thumbnail.source && !page.thumbnail.source.includes('svg')) {
                urls.push(page.thumbnail.source);
              }
            }
          }
          if (urls.length > 0) {
            finalImageUrl = urls[Math.floor(Math.random() * urls.length)];
            finalImageCredit = "Wikimedia Commons";
          }
        } catch (e) {
          console.error("Wiki fetch error in bulk generation:", e);
        }

        // Map camelCase to snake_case for DB
        const dbEntry = {
          slug: generatedSlug,
          headline: article.headline,
          subhead: article.subhead,
          category: article.category,
          specialties: article.specialties || [],
          region: finalRegion,
          image_url: finalImageUrl,
          image_credit: finalImageCredit,
          image_type: article.imageType || "photograph",
          published_at: article.publishedAt,
          source_published_at: article.sourcePublishedAt,
          reading_time_minutes: article.readingTimeMinutes || 5,
          status: article.status || "published",
          source_name: article.sourceName || "HealicWire Medical Intelligence",
          source_url: article.sourceUrl || "https://healic.co",
          evidence_level: finalEvidenceLevel,
          is_ai_assisted: article.isAiAssisted || true,
          summary_30s: article.summary30s,
          summary_2min: article.summary2min,
          body_analysis: article.bodyAnalysis,
          why_this_matters: article.whyThisMatters,
          what_changed: article.whatChanged,
          impact_scores: article.impactScores,
          clinical_impact_score: article.clinicalImpactScore || 50,
          india_relevance: article.indiaRelevance,
          peer_reviewed: article.peerReviewed || false,
          funding_source: article.fundingSource,
          coi_note: article.coiNote,
          study_design: article.studyDesign,
          sample_size: article.sampleSize,
          fact_check_claims: article.factCheckClaims || [],
          learning_module: article.learningModule || {},
          references: article.references || []
        };

        const { error } = await supabaseAdmin.from("articles").insert([dbEntry]);
        if (error) console.error("Error inserting generated article:", error);
        else successCount++;
      }

      res.json({ success: true, count: successCount });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET generated locked weeks per section
  app.get("/api/admin/generated-weeks", (req, res) => {
    const currentDb = loadDb();
    res.json(currentDb.generatedWeeks || {});
  });

  // POST Generate AI Weekly News Batch (Treatment Update, Scientific Events, Pharma and Drugs, Hospital Intelligence, Current Guidelines)
  app.post("/api/admin/generate-weekly-batch", async (req, res) => {
    const currentDb = loadDb();
    if (!currentDb.generatedWeeks) {
      currentDb.generatedWeeks = {};
    }

    const { selectedWeek, selectedSections } = req.body;

    if (!selectedWeek || !selectedSections || !Array.isArray(selectedSections) || selectedSections.length === 0) {
      return res.status(400).json({ error: "selectedWeek and selectedSections array are required." });
    }

    const alreadyGeneratedForWeek = currentDb.generatedWeeks[selectedWeek] || [];
    const newSectionsToGenerate = selectedSections.filter((sec: string) => !alreadyGeneratedForWeek.includes(sec));

    if (newSectionsToGenerate.length === 0) {
      return res.status(400).json({ error: `News for all selected sections has already been generated for ${selectedWeek} (Locked).` });
    }

    const nowIso = new Date().toISOString();

    for (const section of newSectionsToGenerate) {
      if (section === "Treatment Update") {
        const newArt = {
          id: "tu-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
          headline: `Treatment Update: CDSCO Clinical Protocol (${selectedWeek})`,
          subhead: "Official clinical treatment protocol update and dosage guidance for practice.",
          category: "Clinical",
          specialties: ["General Medicine", "Pharmacology", "Cardiology"],
          region: "Global Healthcare",
          image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
          image_credit: "HealicWire Special Page Engine",
          source_name: "HealicWire Special Page Engine",
          reading_time_minutes: 4,
          summary_30s: `Official evidence-based treatment protocol update and dosage guidance published for ${selectedWeek}.`,
          body_analysis: `CLINICAL TREATMENT PROTOCOL UPDATE:\n\n1. Evidence Summary:\nRevised therapeutic guidelines issued for active clinical practice during ${selectedWeek}.\n\n2. Key Prescribing Directives:\n- Follow updated titration schedules for high-risk patient cohorts.\n- Audit renal and hepatic markers at baseline and 4-week milestones.\n- Ensure multidisciplinary care coordination.`,
          clinical_impact_score: 9,
          impact_scores: { clinicalPractice: 5, publicHealth: 4, innovation: 4, costEffectiveness: 4 },
          status: "published",
          published_at: nowIso,
          views: 120,
          slug: `treatment-update-${selectedWeek.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          source_url: "#"
        };
        await supabaseAdmin.from('health_news').insert([newArt]);
      } else if (section === "Scientific Events") {
        const newEvtArt = {
          id: "evt-art-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
          headline: `Scientific Events: National Medical & Clinical Summit (${selectedWeek})`,
          subhead: "Keynote lectures, CME accredited workshops, and multi-specialty clinical research presentations.",
          category: "Scientific Events",
          specialties: ["Internal Medicine", "Medical Education", "Research"],
          region: "Global Healthcare",
          image_url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
          image_credit: "HealicWire Special Page Engine",
          source_name: "HealicWire Special Page Engine",
          reading_time_minutes: 5,
          summary_30s: `National scientific summit accredited for 12 CME Hours, presenting groundbreaking clinical research during ${selectedWeek}.`,
          body_analysis: `NATIONAL SCIENTIFIC SYMPOSIUM DETAILS:\n\nOrganized by HealicWire Academic Directorate for ${selectedWeek}.\n\nHighlights:\n- Accredited for 12 CME Hours.\n- Interactive Q&A and hands-on workshops.`,
          clinical_impact_score: 9,
          impact_scores: { clinicalPractice: 5, publicHealth: 4, innovation: 4, costEffectiveness: 4 },
          status: "published",
          published_at: nowIso,
          views: 180,
          slug: `scientific-events-${selectedWeek.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          source_url: "#"
        };
        await supabaseAdmin.from('health_news').insert([newEvtArt]);

        const newEvt = {
          id: "evt-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
          title: newEvtArt.headline,
          organizer: "HealicWire Academic Directorate",
          scope: "Nationwide",
          event_type: "Conference",
          start_date: nowIso.split("T")[0],
          end_date: nowIso.split("T")[0],
          venue: "Main Medical Auditorium & Virtual Stream",
          city: "New Delhi",
          country: "India",
          format: "Hybrid",
          specialties: ["Internal Medicine", "Cardiology"],
          cme_credits: 12,
          description: newEvtArt.summary_30s,
          cost: "Complimentary / CME Accredited",
          registration_url: "#",
          managed: "Not Managed"
        };
        await supabaseAdmin.from('scientific_events').insert([newEvt]);
      } else if (section === "Pharma and Drugs") {
        const newPharma = {
          id: "pharma-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
          headline: `Pharma and Drugs: CDSCO Safety Warning & Molecule Approvals (${selectedWeek})`,
          subhead: "Regulatory safety updates, CDSCO prescribing warnings, and novel drug formulation approvals.",
          category: "Pharma and Drugs",
          specialties: ["Pharmacology", "Pharma and Drugs", "Internal Medicine"],
          region: "Global Healthcare",
          image_url: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=800&q=80",
          image_credit: "HealicWire Special Page Engine",
          source_name: "HealicWire Special Page Engine",
          reading_time_minutes: 3,
          summary_30s: `Detailed breakdown of newly approved drug formulations and safety advisories published during ${selectedWeek}.`,
          body_analysis: `PHARMA & DRUGS REGULATORY UPDATE:\n\nDetailed breakdown of newly approved drug formulations and CDSCO safety advisories published during ${selectedWeek}.\n\n- Updated bioequivalence parameters for oral formulations.\n- Mandatory black box warning notifications for novel antidiabetic agents.`,
          clinical_impact_score: 9,
          impact_scores: { clinicalPractice: 5, publicHealth: 4, innovation: 4, costEffectiveness: 4 },
          status: "published",
          published_at: nowIso,
          views: 145,
          slug: `pharma-${selectedWeek.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          source_url: "#"
        };
        await supabaseAdmin.from('health_news').insert([newPharma]);
      } else if (section === "Hospital Intelligence") {
        const newAlert = {
          id: "alert-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
          headline: `Hospital Intelligence: Emergency Care & Infection Control Protocol (${selectedWeek})`,
          severity: "URGENT",
          urgency: "Immediate",
          recommended_action: `Urgent hospital operational guidelines and infection control standards issued for ${selectedWeek}.`,
          departments_affected: ["Emergency Medicine", "Infectious Diseases", "Critical Care"],
          source: "HealicWire Clinical Intelligence Directorate",
          date: nowIso.split("T")[0]
        };
        await supabaseAdmin.from('hospital_alerts').insert([newAlert]);
      } else if (section === "Current Guidelines") {
        const newGuideline = {
          id: "guide-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
          condition: `Current Guidelines: Clinical Practice Protocol (${selectedWeek})`,
          issuing_organization: "HealicWire Clinical Evidence Directorate",
          last_updated: nowIso.split("T")[0],
          current_recommendation: "Mandatory implementation of revised screening algorithms and patient safety monitoring standards.",
          previous_recommendation: "Standard empirical treatment based on conventional clinical thresholds.",
          reason_for_change: `Meta-analysis of clinical trial outcomes demonstrating 28% reduction in hospital readmissions with revised algorithms (${selectedWeek}).`,
          india_relevance: "Strong (High-Quality Evidence)",
          "references": []
        };
        await supabaseAdmin.from('current_guidelines').insert([newGuideline]);
      }
    }

    // Mark sections as generated for this week
    currentDb.generatedWeeks[selectedWeek] = Array.from(
      new Set([...alreadyGeneratedForWeek, ...newSectionsToGenerate])
    );

    saveDb(currentDb);

    res.json({
      success: true,
      message: `Successfully generated AI News for ${newSectionsToGenerate.join(", ")} for ${selectedWeek}.`,
      generatedSections: newSectionsToGenerate,
      selectedWeek,
      generatedWeeks: currentDb.generatedWeeks
    });
  });

  // AI Event Conference Assistant endpoint
  app.post("/api/scientific-events/:id/ai-assistant", requireAuth, async (req, res) => {
    const { id } = req.params;
    const { question } = req.body;
    
    const { data: events, error } = await supabaseAdmin.from('scientific_events').select('*').eq('id', id);
    if (error || !events || events.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }
    const event = events[0];

    try {
      const ai = getGeminiClient();
      const prompt = `
      You are the AI Conference & Scientific Seminar Assistant for: "${event.title}".
      
      EVENT CONTEXT:
      - Title: ${event.title}
      - Organizer: ${event.organizer}
      - Venue: ${event.venue}, ${event.city}, ${event.country}
      - Specialties: ${event.specialties.join(", ")}
      - CME Credits: ${event.cme_credits}
      - Speakers: ${event.keynote_speakers?.join(", ") || "Invited Faculty"}
      - Description: ${event.description}
      - Schedule: ${JSON.stringify(event.schedule || [])}
      - Objectives: ${JSON.stringify(event.objectives || [])}
      
      USER QUESTION / TASK: "${question}"
      
      Respond directly and helpfully in clear, formatted Markdown:
      - If asked about sessions/talks: List specific times, titles, and speakers from the schedule.
      - If asked to summarize: Provide an executive overview and key learning points.
      - If asked for flashcards or MCQs: Generate high-yield study cards/MCQs related to the event's clinical topics.
      - Keep it professional, encouraging, and clinically accurate.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: { temperature: 0.2 }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("AI Conference Assistant failed:", error);
      res.status(500).json({ error: "AI Conference Assistant failed", details: error.message });
    }
  });

  // AI Event Summary & Notes Generator endpoint
  app.post("/api/scientific-events/:id/ai-summary", requireAuth, async (req, res) => {
    const { id } = req.params;
    
    const { data: events, error } = await supabaseAdmin.from('scientific_events').select('*').eq('id', id);
    if (error || !events || events.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }
    const event = events[0];

    try {
      const ai = getGeminiClient();
      const prompt = `
      Generate a comprehensive AI Conference Executive Summary for the following medical event:
      Title: ${event.title}
      Organizer: ${event.organizer}
      Specialties: ${event.specialties.join(", ")}
      Description: ${event.description}
      Objectives: ${JSON.stringify(event.objectives || [])}
      
      Output a strict JSON object:
      {
        "executiveSummary": "A concise 3-paragraph executive synthesis of the scientific proceedings.",
        "keyPearls": ["4-5 high-yield clinical pearls for practitioners"],
        "guidelinesDiscussed": ["3-4 clinical practice guidelines or regulatory frameworks updated"],
        "researchPapers": ["3-4 breakthrough randomized controlled trials or landmark studies cited"],
        "newDrugUpdates": ["2-3 therapeutic drug approvals or novel dosage regimens"],
        "practiceChangingEvidence": ["2-3 actionable, practice-changing evidence summaries"]
      }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2
        }
      });

      const _text1 = response.text || "{}";
      const _cleanJson1 = _text1.replace(/```json/g, "").replace(/```/g, "").trim();
      const summaryData = JSON.parse(_cleanJson1);
      
      const { error: updateError } = await supabaseAdmin.from('scientific_events').update({ ai_summary: summaryData }).eq('id', id);
      if (updateError) throw updateError;

      res.json(summaryData);
    } catch (error: any) {
      console.error("AI Summary generation failed:", error);
      res.status(500).json({ error: "AI Summary generation failed", details: error.message });
    }
  });

  // Add living guideline
  app.post("/api/admin/current-guidelines", async (req, res) => {
    try {
      const payload = {
        id: "g-" + Date.now(),
        condition: req.body.condition,
        issuing_organization: req.body.issuingOrganization,
        current_recommendation: req.body.currentRecommendation,
        previous_recommendation: req.body.previousRecommendation,
        last_updated: new Date().toISOString().split("T")[0],
        reason_for_change: req.body.reasonForChange,
        india_relevance: req.body.indiaRelevance,
        "references": req.body.references || []
      };
      
      const { data, error } = await supabaseAdmin.from('current_guidelines').insert([payload]).select();
      if (error) throw error;
      res.status(201).json(data[0]);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get hospital alerts
  app.get("/api/hospital-alerts", (req, res) => {
    res.json(db.alerts);
  });

  // Add hospital alert
  app.post("/api/admin/hospital-alerts", async (req, res) => {
    try {
      const payload = {
        id: "al-" + Date.now(),
        headline: req.body.headline,
        severity: req.body.severity || ImpactSeverity.INFORMATIONAL,
        urgency: req.body.urgency || "Routine",
        departments_affected: req.body.departmentsAffected || [],
        recommended_action: req.body.recommendedAction,
        source: req.body.source || "Internal Administration",
        date: new Date().toISOString().split("T")[0]
      };
      
      const { data, error } = await supabaseAdmin.from('hospital_alerts').insert([payload]).select();
      if (error) throw error;
      res.status(201).json(data[0]);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get advertisements
  app.get("/api/admin/advertisements", async (req, res) => {
    console.log("GET /api/admin/advertisements called!");
    try {
      const { data, error } = await supabaseAdmin
        .from('advertisements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Supabase error fetching ads:", error);
        throw error;
      }
      
      console.log(`Fetched ${data?.length} ads from advertisements table`);

      const mappedData = (data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        category: item.category,
        imageUrl: item.image_url,
        status: item.status,
        linkUrl: item.link_url,
        createdAt: item.created_at
      }));

      res.json(mappedData);
    } catch (err: any) {
      console.error("Error in GET /api/admin/advertisements:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Add advertisement
  app.post("/api/admin/advertisements", async (req, res) => {
    try {
      const payload = {
        title: req.body.title,
        subtitle: req.body.subtitle || req.body.details || '',
        image_url: req.body.imageUrl || req.body.promoImage || '',
        category: req.body.category || req.body.targetPage || 'Advertisement',
        link_url: req.body.linkUrl || '',
        status: req.body.status || 'active'
      };
      
      const { data, error } = await supabaseAdmin
        .from('advertisements')
        .insert([payload])
        .select();

      if (error) {
        throw error;
      }
      
      const item = data[0];
      res.status(201).json({
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        category: item.category,
        imageUrl: item.image_url,
        status: item.status,
        linkUrl: item.link_url,
        createdAt: item.created_at
      });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Update advertisement
  app.put("/api/admin/advertisements/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const payload = {
        title: req.body.title,
        subtitle: req.body.subtitle || req.body.details,
        image_url: req.body.imageUrl || req.body.promoImage,
        category: req.body.category || req.body.targetPage,
        link_url: req.body.linkUrl,
        status: req.body.status
      };
      
      // Remove undefined values
      Object.keys(payload).forEach(key => (payload as any)[key] === undefined && delete (payload as any)[key]);
      
      const { data, error } = await supabaseAdmin
        .from('advertisements')
        .update(payload)
        .eq('id', id)
        .select();

      if (error) {
        throw error;
      }
      
      if (!data || data.length === 0) {
        return res.status(404).json({ error: "Advertisement not found" });
      }

      const item = data[0];
      res.json({
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        category: item.category,
        imageUrl: item.image_url,
        status: item.status,
        linkUrl: item.link_url,
        createdAt: item.created_at
      });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Delete advertisement
  app.delete("/api/admin/advertisements/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = await supabaseAdmin
        .from('advertisements')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
      
      res.json({ success: true });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get Slider Settings
  app.get("/api/admin/slider-settings", (req, res) => {
    try {
      if (fs.existsSync(SLIDER_SETTINGS_FILE)) {
        const data = fs.readFileSync(SLIDER_SETTINGS_FILE, 'utf8');
        res.json(JSON.parse(data));
      } else {
        res.json({ maxItems: 3, selectedIds: [] });
      }
    } catch (err: any) {
      console.error("Error reading slider settings:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Save Slider Settings
  app.post("/api/admin/slider-settings", express.json(), (req, res) => {
    try {
      const { maxItems, selectedIds } = req.body;
      const settings = { maxItems: maxItems || 3, selectedIds: selectedIds || [] };
      fs.writeFileSync(SLIDER_SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
      res.json({ success: true, settings });
    } catch (err: any) {
      console.error("Error saving slider settings:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Submit correction report
  app.post("/api/corrections", async (req, res) => {
    try {
      const payload = {
        id: "corr-" + Date.now(),
        article_id: req.body.articleId,
        article_headline: req.body.articleHeadline,
        reported_by: req.body.reportedBy || "Anonymous",
        description: req.body.description,
        status: "pending",
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabaseAdmin.from('correction_reports').insert([payload]).select();
      if (error) throw error;
      res.status(201).json(data[0]);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get corrections list (Admin)
  app.get("/api/admin/corrections", async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin.from('correction_reports').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Update correction status
  app.patch("/api/admin/corrections/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { data, error } = await supabaseAdmin.from('correction_reports').update({ status: req.body.status }).eq('id', id).select();
      if (error) throw error;
      if (!data || data.length === 0) return res.status(404).json({ error: "Correction report not found" });
      res.json(data[0]);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get generated specialty news from all tables
  app.get("/api/admin/generated-specialty-news", async (req, res) => {
    try {
      const results: Record<string, any[]> = {};
      
      const tables = [
        { label: "Treatment Update", table: "treatment_update" },
        { label: "Scientific Events", table: "scientific_events" },
        { label: "Pharma and Drugs", table: "drugs" },
        { label: "Hospital Intelligence", table: "hospital_alerts" },
        { label: "Current Guidelines", table: "current_guidelines" },
        { label: "Health Care Providers", table: "providers" }
      ];

      for (const section of tables) {
        const { data, error } = await supabaseAdmin
          .from(section.table)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);
          
        if (error) {
          console.error(`Error fetching from ${section.table}:`, error);
          results[section.label] = [];
        } else {
          results[section.label] = data || [];
        }
      }

      res.json(results);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Update a generated specialty news article
  app.put("/api/admin/generated-specialty-news/:table/:id", async (req, res) => {
    try {
      const { table, id } = req.params;
      const updateData = { ...req.body };
      
      const allowedTables = ['treatment_update', 'scientific_events', 'drugs', 'hospital_alerts', 'current_guidelines', 'providers'];
      if (!allowedTables.includes(table)) {
        return res.status(400).json({ error: "Invalid table name" });
      }

      // Remove immutable fields to prevent errors
      delete updateData.id;
      delete updateData.created_at;
      delete updateData.updated_at;

      const { data, error } = await supabaseAdmin
        .from(table)
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) throw error;
      res.json(data[0]);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Subscribe to newsletter
  app.post("/api/newsletter/subscribe", async (req, res) => {
    try {
      const { email, specialty, frequency } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      const { data: existing, error: findError } = await supabaseAdmin.from('newsletter_subscribers').select('id').eq('email', email);
      if (findError) throw findError;
      
      if (existing && existing.length > 0) {
        return res.json({ message: "You are already subscribed!" });
      }
      
      const payload = {
        email,
        specialty: specialty || "General Practice",
        frequency: frequency || "weekly",
        created_at: new Date().toISOString()
      };
      
      const { error } = await supabaseAdmin.from('newsletter_subscribers').insert([payload]);
      if (error) throw error;
      
      res.status(201).json({ success: true, message: "Subscription successful!" });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // --- AI BASED POWERED ENDPOINTS ---

  // 1. Ingestion Pipeline endpoint using AI Based
  app.post("/api/admin/ingest", async (req, res) => {
    const { topic } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Topic is required for ingestion." });
    }

    try {
      const ai = getGeminiClient();
      console.log(`Ingesting healthcare news about: ${topic}`);

      const prompt = `
      You are an expert medical editor for HealicWire.
      Synthesize a professional, realistic, high-fidelity healthcare news article based on recent real-world clinical findings, approvals, or guidelines related to: "${topic}".
      Do not make up fake data that is ungrounded in real-world facts, but synthesize a highly accurate summary representing recent medical knowledge.
      
      Output a strict JSON object with the following fields:
      {
        "headline": "A captivating, clinical-precision headline",
        "subhead": "An informative subtitle summarizing the development",
        "category": "One of: Clinical, Research, Pharma and Drugs, Health Technology, Policy and Public Health, Education and Career",
        "specialties": ["At least two relevant specialties, e.g., Cardiology, Endocrinology, Pulmonology, Pediatrics, Oncology, Neurology, Nephrology, Gastroenterology, Surgery, Internal Medicine, General Practice, Pharmacology"],
        "region": "One of: Global, India, US & Europe",
        "summary30s": "A 30-second brief summary. Around 30-40 words.",
        "summary2min": "A 2-minute summary covering background, findings, and clinical importance. Around 150 words.",
        "bodyAnalysis": "A detailed medical analysis in Markdown format. Explain background, clinical trial data, mechanisms, efficacy/safety, guidelines, and future directions. Use clear headers and bullets. Around 400-600 words.",
        "sourceName": "The official publishing organization or journal (e.g., NEJM, The Lancet, FDA, WHO, ICMR)",
        "sourceUrl": "A realistic source URL",
        "evidenceLevel": "One of: Systematic Review, Meta-Analysis, Randomized Controlled Trial, Clinical Guideline, Regulatory Approval, Government Notification, Observational Study",
        "peerReviewed": true,
        "fundingSource": "Who funded the study or trial",
        "coiNote": "Conflicts of interest statement",
        "studyDesign": "e.g., Double-blind, randomized controlled trial",
        "sampleSize": "e.g., 5,000 patients",
        "references": ["At least two realistic literature citations"],
        "whyThisMatters": {
          "clinicians": "Practical clinical implications for practitioners",
          "students": "High-yield learning takeaways for MBBS or PG exams",
          "hospitalAdministrators: "Operational or procurement actions needed",
          "patients": "Patient-facing explanation of safety/benefits",
          "researchers": "Research gaps or future studies needed"
        },
        "indiaRelevance": {
          "status": "One of: Directly applicable, Partially applicable, Requires local adaptation, Not currently applicable, Indian guidance awaited",
          "explanation": "Specific context about why this is relevant to the healthcare ecosystem in India."
        },
        "whatChanged": {
          "previous": "What was the previous standard of care or recommendation?",
          "current": "What is the new recommendation or approval?",
          "reason": "Why did it change?",
          "strength": "e.g., Strong, Moderate, Weak"
        }
      }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2
        }
      });

      const _text2 = response.text || "{}";
      const _cleanJson2 = _text2.replace(/```json/g, "").replace(/```/g, "").trim();
      const result = JSON.parse(_cleanJson2);

      // Auto-assign properties
      const payload = {
        id: "art-" + Date.now(),
        slug: result.headline.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        headline: result.headline,
        subhead: result.subhead || "",
        category: result.category || "Clinical",
        specialties: result.specialties || [],
        region: result.region || Region.GLOBAL,
        image_url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
        image_credit: `${result.sourceName} Official Media`,
        image_type: "AI-generated illustration",
        published_at: new Date().toISOString(),
        source_published_at: new Date().toISOString(),
        reading_time_minutes: Math.max(2, Math.ceil((result.bodyAnalysis || "").split(" ").length / 200)),
        status: "ingested", // Queue for editor review first!
        source_name: result.sourceName || "Official Source",
        source_url: result.sourceUrl || "#",
        evidence_level: result.evidenceLevel || EvidenceLevel.RCT,
        is_ai_assisted: true,
        summary_30s: result.summary30s || "",
        summary_2min: result.summary2min || "",
        body_analysis: result.bodyAnalysis || "",
        why_this_matters: result.whyThisMatters || {
          clinicians: "Clinical review required.",
          students: "High-yield details.",
          hospitalAdministrators: "Operational updates.",
          patients: "Patient safety info.",
          researchers: "Research review."
        },
        what_changed: result.whatChanged,
        impact_scores: {
          clinicalPractice: 4,
          medicalEducation: 3,
          research: 3,
          publicHealth: 4,
          hospitalOperations: 3,
          patientCare: 4
        },
        india_relevance: result.indiaRelevance || {
          status: "Directly applicable",
          explanation: "Widespread application."
        },
        peer_reviewed: result.peerReviewed !== undefined ? result.peerReviewed : true,
        funding_source: result.fundingSource || "Public funding",
        coi_note: result.coiNote || "None declared",
        study_design: result.studyDesign,
        sample_size: result.sampleSize,
        "references": result.references || [],
        views: 0
      };

      // Push to Supabase ingested queue
      const { data, error } = await supabaseAdmin.from('health_news').insert([payload]).select();
      if (error) throw error;

      res.json({ success: true, article: data[0] });
    } catch (error: any) {
      console.error("AI Based news ingestion failed:", error);
      res.status(500).json({ error: "AI Based news ingestion failed", details: error.message });
    }
  });

  // 2. Article-specific AI Assistant endpoint
  app.post("/api/articles/:id/assistant", requireAuth, async (req, res) => {
    const { id } = req.params;
    const { question, history } = req.body;

    const { data: articles, error } = await supabaseAdmin.from('health_news').select('*').eq('id', id);
    if (error || !articles || articles.length === 0) {
      return res.status(404).json({ error: "Article not found" });
    }
    const article = articles[0];

    try {
      const ai = getGeminiClient();
      
      const systemInstruction = `
      You are HealicWire's Article Clinical Assistant.
      Your job is to assist healthcare professionals in understanding this specific medical article.
      
      --- ARTICLE CONTEXT ---
      Headline: ${article.headline}
      Subhead: ${article.subhead}
      Category: ${article.category}
      Specialties: ${article.specialties.join(", ")}
      Evidence Level: ${article.evidence_level}
      30-Second Summary: ${article.summary_30s}
      2-Minute Summary: ${article.summary_2min}
      Detailed Analysis: ${article.body_analysis}
      Clinician Impact: ${article.why_this_matters?.clinicians}
      Student Impact: ${article.why_this_matters?.students}
      Hospital Admin Impact: ${article.why_this_matters?.hospitalAdministrators}
      Patient Impact: ${article.why_this_matters?.patients}
      Researcher Impact: ${article.why_this_matters?.researchers}
      India Relevance: ${article.india_relevance?.status} - ${article.india_relevance?.explanation}
      --- END CONTEXT ---
      
      Answer ONLY based on the cited article, linked official guidelines, or approved references provided.
      If the answer cannot be confidently deduced from the article or guidelines context, say exactly:
      "The available cited sources do not provide enough information to answer this reliably."
      
      Strictly follow these safety rules:
      1. Do NOT provide patient-specific diagnoses or write personalized treatment prescriptions.
      2. Ground every clinical claim in the provided article details or standard medical guidelines if explicitly relevant.
      3. Use objective, clear, clinical, and compassionate terminology.
      `;

      // Structure contents with history for chat experience
      const contents = [];
      if (history && Array.isArray(history)) {
        for (const turn of history) {
          contents.push({
            role: turn.role === "user" ? "user" : "model",
            parts: [{ text: turn.text }]
          });
        }
      }
      contents.push({
        role: "user",
        parts: [{ text: question }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.1
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Clinical Assistant failed:", error);
      res.status(500).json({ error: "Clinical Assistant failed", details: error.message });
    }
  });

  // 3. AI Claim Fact-Checker & Verifier
  app.post("/api/articles/:id/verify", requireAuth, async (req, res) => {
    const { id } = req.params;
    const { data: articles, error } = await supabaseAdmin.from('health_news').select('*').eq('id', id);
    if (error || !articles || articles.length === 0) {
      return res.status(404).json({ error: "Article not found" });
    }
    const article = articles[0];

    try {
      const ai = getGeminiClient();

      const prompt = `
      You are an expert AI medical fact-checker for HealicWire.
      Analyze the clinical claims made in the following medical article:
      
      Title: ${article.headline}
      Brief Summary: ${article.summary_30s}
      Detailed Analysis: ${article.body_analysis}
      
      Extract up to 3 major medical or health claims and verify them against globally trusted sources like WHO, CDC, FDA, EMA, NICE, Cochrane, or ICMR.
      For each claim, provide:
      1. The claim statement.
      2. Verification status: Supported, Partially supported, Uncertain, Contradicted, or Unable to verify.
      3. Supporting reference: A specific, traceable reference citation or guideline database link.
      
      Output a JSON array of objects following this structure:
      [
        {
          "claim": "The exact scientific or clinical claim extracted",
          "status": "Supported / Partially supported / Uncertain / Contradicted / Unable to verify",
          "reference": "Traceable supporting reference citation from a global health authority (WHO, CDC, FDA, ICMR, etc.)"
        }
      ]
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1
        }
      });

      const _text3 = response.text || "[]";
      const _cleanJson3 = _text3.replace(/```json/g, "").replace(/```/g, "").trim();
      const claims = JSON.parse(_cleanJson3);
      
      // Save results to the article in DB for persistence
      const { error: updateError } = await supabaseAdmin.from('health_news').update({ fact_check_claims: claims }).eq('id', id);
      if (updateError) throw updateError;

      res.json(claims);
    } catch (error: any) {
      console.error("Fact checker failed:", error);
      res.status(500).json({ error: "Fact checking failed", details: error.message });
    }
  });

  // 4. News-To-Learning Dynamic Quiz Generator
  app.post("/api/articles/:id/quiz", requireAuth, async (req, res) => {
    const { id } = req.params;
    const { data: articles, error } = await supabaseAdmin.from('health_news').select('*').eq('id', id);
    if (error || !articles || articles.length === 0) {
      return res.status(404).json({ error: "Article not found" });
    }
    const article = articles[0];

    try {
      const ai = getGeminiClient();

      const prompt = `
      You are a medical professor. Generate high-quality educational materials from the following clinical news article:
      
      Headline: ${article.headline}
      Category: ${article.category}
      Specialties: ${article.specialties.join(", ")}
      Summary: ${article.summary_2min}
      Detailed Analysis: ${article.body_analysis}
      
      Generate:
      1. A 'oneMinuteRevision' key - summarizing the key clinical pearls of this development.
      2. Exactly 2 multiple-choice questions (MCQs) mapped to clinical concepts. Each MCQ must have:
         - question
         - options (array of 4 strings)
         - correctAnswerIndex (0-3)
         - explanation (detailed reason why this is correct and why others are wrong)
         - cognitiveLevel (e.g. Remember, Understand, Apply, Analyze)
      3. Exactly 1 Flashcard:
         - topic
         - front (question or term)
         - back (explanation or definition)
      4. Exactly 1 Viva question:
         - question
         - modelAnswer
         - keyPoints (array of strings)

      Output a strict JSON object structure:
      {
        "oneMinuteRevision": "string",
        "mcqs": [
          {
            "id": "q1",
            "question": "string",
            "options": ["string", "string", "string", "string"],
            "correctAnswerIndex": 0,
            "explanation": "string",
            "cognitiveLevel": "string"
          }
        ],
        "flashcards": [
          {
            "id": "fc1",
            "topic": "string",
            "front": "string",
            "back": "string"
          }
        ],
        "vivaQuestions": [
          {
            "id": "vq1",
            "question": "string",
            "modelAnswer": "string",
            "keyPoints": ["string", "string"]
          }
        ]
      }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3
        }
      });

      const _text4 = response.text || "{}";
      const _cleanJson4 = _text4.replace(/```json/g, "").replace(/```/g, "").trim();
      const learningModule = JSON.parse(_cleanJson4);
      
      // Inject IDs
      learningModule.mcqs = learningModule.mcqs.map((q: any, i: number) => ({ ...q, id: `mcq-${Date.now()}-${i}` }));
      learningModule.flashcards = learningModule.flashcards.map((fc: any, i: number) => ({ ...fc, id: `fc-${Date.now()}-${i}` }));
      learningModule.vivaQuestions = learningModule.vivaQuestions.map((vq: any, i: number) => ({ ...vq, id: `vq-${Date.now()}-${i}` }));

      const quizRecord = {
        id: "quiz-" + Date.now(),
        related_content_id: id,
        title: "Quiz for " + article.headline,
        description: article.summary_30s || "",
        questions: learningModule.mcqs || [],
        flashcards: learningModule.flashcards || [],
        viva_questions: learningModule.vivaQuestions || [],
        one_minute_revision: learningModule.oneMinuteRevision || ""
      };
      const { error: insertError } = await supabaseAdmin.from('quizzes').insert([quizRecord]);
      if (insertError) throw insertError;

      res.json(learningModule);
    } catch (error: any) {
      console.error("Quiz generation failed:", error);
      res.status(500).json({ error: "Quiz generation failed", details: error.message });
    }
  });

  // 5. Get Quiz by related content ID
  app.get("/api/quizzes/:related_content_id", async (req, res) => {
    try {
      const { related_content_id } = req.params;
      const { data, error } = await supabaseAdmin.from('quizzes').select('*').eq('related_content_id', related_content_id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      if (!data) return res.status(404).json({ error: "Quiz not found" });

      const learningModule = {
        oneMinuteRevision: data.one_minute_revision,
        mcqs: data.questions,
        flashcards: data.flashcards,
        vivaQuestions: data.viva_questions
      };
      res.json(learningModule);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // Generate Editorial using AI
  app.post("/api/admin/editorials/generate", async (req, res) => {
    try {
      const { topic, criteria, category, region } = req.body;
      const ai = getGeminiClient();
      
      const prompt = `
      You are an expert Chief Medical Editor for HealicWire.
      Write a highly detailed, evidence-based editorial article on the topic: "${topic}".
      Additional criteria or focus: ${criteria || "None provided"}.
      Category: ${category}. Region: ${region}.
      
      Output a strict JSON object with these exact keys:
      {
        "headline": "A captivating, professional editorial title",
        "subhead": "A strong subtitle",
        "summary30s": "A 30-second summary (about 30 words)",
        "bodyAnalysis": "A detailed 1300-word editorial in Markdown format. Use professional tone, headers, and bullet points where appropriate.",
        "readingTimeMinutes": 6
      }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3
        }
      });

      const _text = response.text || "{}";
      const _cleanJson = _text.replace(/```json/g, "").replace(/```/g, "").trim();
      const article = JSON.parse(_cleanJson);

      res.json({ success: true, article });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });
  // Get all user profiles
  app.get("/api/admin/user-profiles", async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_profiles')
        .select('*');
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });



  // FactCheck AI Evidence Analyzer Streaming Endpoint
  app.post("/api/factcheck", requireAuth, async (req, res) => {
    const { claim } = req.body;
    if (!claim) {
      return res.status(400).json({ error: "Missing claim" });
    }

    try {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const ai = getGeminiClient();
      
      const prompt = `
You are FactCheck, an AI Evidence Analyzer specialized in Evidence-Based Medicine (EBM).
Analyze the following healthcare claim, question, or article:
"${claim}"

Workflow to follow:
Step 1: Understand the Input - Extract all important scientific claims.
Step 2: Search Trusted Evidence Sources - Base your analysis ON HIGH-QUALITY MEDICAL LITERATURE (e.g., PubMed, Cochrane, WHO, CDC, NEJM, JAMA, Lancet). Do not rely on blogs.
Step 3: Classify Evidence - Use the Hierarchy of Scientific Evidence (Level 1 to 10).
Step 4: Evaluate Evidence - Analyze strength, study quality, limitations, conflicting evidence.
Step 5: Generate an Evidence Report.

OUTPUT EXACTLY IN THE FOLLOWING MARKDOWN STRUCTURE:

### 🧠 Evidence Summary
(100-200 words describing what current evidence suggests)

### 📊 Scientific Verdict
(Choose ONE: ✅ Strongly Supported | ✅ Supported | ⚠️ Partially Supported | ❓ Inconclusive | ❌ Contradicted by Current Evidence | 🚫 No Reliable Scientific Evidence)

### 📈 Evidence Strength
(Choose ONE: 🟢 Very Strong | 🟢 Strong | 🟡 Moderate | 🟠 Limited | 🔴 Weak | ⚫ No Reliable Evidence)

### 🏆 Highest Level of Evidence Found
(e.g., **Highest-quality evidence identified:** Systematic Review & Meta-analysis of RCTs (★★★★★))

### 📚 Supporting Studies
(List 1-3 major studies with **Title**, **Journal**, **Year**, **Study Type**, **Sample Size**, **Main Finding**, **Key Limitation**)

### 📋 Clinical Guidelines
(Summarize recommendations from WHO, NICE, CDC, etc. if applicable, or state none)

### ⚠️ Limitations
(Clearly explain limitations of the evidence)

### 💡 Key Takeaways
(3-5 concise evidence-based conclusions as bullet points)

Important Guardrails:
- Never fabricate studies.
- Distinguish between evidence and expert opinion.
- Explain association vs causation if relevant.
- DO NOT wrap the entire response in a markdown code block (no \`\`\`markdown). Just output the raw text.
      `;

      const responseStream = await ai.models.generateContentStream({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          temperature: 0.2
        }
      });

      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
          // SSE format requires data: prefix and double newline
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }
      
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err: any) {
      console.error("FactCheck stream error:", err);
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  });

  // --- STANDALONE API SERVER LISTEN ---
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`[HealicWire Backend] API Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

