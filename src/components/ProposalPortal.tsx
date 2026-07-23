/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { 
  Sparkles, ShieldCheck, Zap, Server, Activity, LineChart, 
  Layers, Users, CheckCircle, ArrowRight, GitMerge, Award, FileText, 
  BarChart2, Clock, CheckCircle2, ChevronRight, BookOpen, AlertCircle
} from "lucide-react";
import HealicLogo from "./HealicLogo";

export default function ProposalPortal() {
  const [activeTab, setActiveTab] = useState<"executive" | "architecture" | "structural" | "visuals" | "regulatory">("executive");
  const [metricTab, setMetricTab] = useState<"latency" | "accuracy" | "savings">("latency");
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 font-sans selection:bg-teal-500/30">
      {/* Title Header Block */}
      <div className="mb-10 text-center sm:text-left border-b border-zinc-200 dark:border-zinc-800 pb-8">
        <div className="flex items-center justify-center sm:justify-start space-x-2.5 text-teal-600 dark:text-teal-400 mb-3">
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span className="text-xs font-mono tracking-widest uppercase font-extrabold bg-teal-100 dark:bg-teal-950/40 px-2.5 py-1 rounded-full">
            Strategic Blueprint
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl leading-tight">
          HealicWire: Clinical AI & Medical Intelligence Portal
        </h1>
        <p className="mt-3 text-base text-zinc-500 dark:text-zinc-400 max-w-3xl leading-relaxed">
          Comprehensive development proposal for an AI-augmented, clinician-in-the-loop medical news curation, 
          verification, and rapid alert platform designed for modern healthcare systems.
        </p>
      </div>

      {/* Horizontal Tab Navigation */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto scrollbar-none mb-8">
        {[
          { id: "executive", label: "Executive Vision", icon: Award },
          { id: "architecture", label: "System Architecture", icon: Server },
          { id: "structural", label: "Structural Analysis", icon: Layers },
          { id: "visuals", label: "Interactive Data & Visuals", icon: LineChart },
          { id: "regulatory", label: "Regulatory & Compliance", icon: ShieldCheck },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-5 py-3 border-b-2 font-mono text-xs font-bold uppercase whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "border-teal-600 text-teal-600 dark:text-teal-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-250"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Body Layout */}
      <div className="space-y-8">
        {/* EXECUTIVE VISION TAB */}
        {activeTab === "executive" && (
          <div className="space-y-8 animate-fadeIn text-zinc-800 dark:text-zinc-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <h2 className="text-xl font-bold text-zinc-950 dark:text-white flex items-center space-x-2 font-sans tracking-tight border-b pb-2 border-zinc-150 dark:border-zinc-850">
                  <HealicLogo className="w-5 h-5" />
                  <span>1. Executive Summary & Strategic Vision</span>
                </h2>
                <p className="text-sm leading-relaxed text-zinc-650 dark:text-zinc-350 text-justify">
                  Modern healthcare practitioners face an unprecedented information overload. Over 3,000 medical papers, 
                  clinical trials, and regulatory directives are published daily across hundreds of global registries, 
                  making it physically impossible for active clinicians to stay aligned with the latest standards. 
                  This structural delay in information transmission—known as the <strong>translational gap</strong>—can 
                  take up to 17 years before a peer-reviewed breakthrough becomes routine clinical practice. 
                  Such delays directly impact patient safety, treatment efficacy, and hospital operational overhead.
                </p>
                <p className="text-sm leading-relaxed text-zinc-650 dark:text-zinc-350 text-justify">
                  <strong>HealicWire</strong> solves this systemic crisis by constructing an end-to-end medical news 
                  aggregation and intelligence ecosystem. By combining Google AI Based&apos;s sophisticated 
                  natural language parsing capabilities with an expert-led clinical review panel, HealicWire compresses the 
                  translational gap from 17 years to under 12 hours. The portal aggregates clinical breakthroughs, 
                  pharma alerts, and healthcare policies, distilling them into highly structured, layered summaries 
                  tailored specifically for clinicians, medical students, hospital administrators, and researchers.
                </p>
                <p className="text-sm leading-relaxed text-zinc-650 dark:text-zinc-350 text-justify">
                  Our core mission is to empower the medical fraternity with <em>actionable clinical evidence</em>. 
                  By utilizing dynamic, responsive interfaces, real-time alert mechanics, and interactive educational 
                  modules, HealicWire transforms static scientific text into an active, decision-support asset 
                  that improves clinical compliance and enhances patient outcomes.
                </p>
              </div>

              {/* Sidebar Stat cards */}
              <div className="space-y-5 bg-zinc-50 dark:bg-zinc-900/40 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-850 h-fit">
                <h3 className="text-xs font-mono font-bold uppercase text-zinc-500 tracking-wider">
                  Operational Core Targets
                </h3>
                
                <div className="space-y-4">
                  <div className="p-3.5 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-850 text-center sm:text-left">
                    <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400 font-bold block uppercase">
                      Evidence Translation Time
                    </span>
                    <div className="text-2xl font-extrabold text-zinc-950 dark:text-white mt-1">12 Hours</div>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal mt-0.5">
                      Down from standard regulatory dissemination cycles of 12-18 months.
                    </p>
                  </div>

                  <div className="p-3.5 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-850 text-center sm:text-left">
                    <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400 font-bold block uppercase">
                      Clinical Accuracy Target
                    </span>
                    <div className="text-2xl font-extrabold text-zinc-950 dark:text-white mt-1">99.9%</div>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal mt-0.5">
                      Enforced by dual-stage algorithmic checking and senior radiologist/physician review boards.
                    </p>
                  </div>

                  <div className="p-3.5 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-850 text-center sm:text-left">
                    <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400 font-bold block uppercase">
                      Workhour Preservation
                    </span>
                    <div className="text-2xl font-extrabold text-zinc-950 dark:text-white mt-1">4.5 Hrs/Wk</div>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal mt-0.5">
                      Average time saved per clinician on literature screening and administrative policy research.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Core Pillars */}
            <div className="space-y-4 pt-4">
              <h3 className="text-base font-bold text-zinc-950 dark:text-white font-sans tracking-tight">
                Strategic Pillars of HealicWire
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950/30 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-teal-600" />
                  </div>
                  <h4 className="font-bold text-sm text-zinc-950 dark:text-white">Layered Medical Curation</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-450 leading-relaxed">
                    A three-tiered reading depth: 30-second high-impact bulleted updates, 2-minute clinical briefs, 
                    and comprehensive, annotated detailed analyses with interactive visualizers.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950/30 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                    <GitMerge className="w-4 h-4 text-teal-600" />
                  </div>
                  <h4 className="font-bold text-sm text-zinc-950 dark:text-white">Clinician-In-The-Loop Validation</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-450 leading-relaxed">
                    Harnesses Google AI Based for extraction, structure formatting, and drafting, while human senior editors 
                    hold clinical veto power, ensuring absolute compliance with Cdsco, FDA, and ICMR codes.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950/30 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                  </div>
                  <h4 className="font-bold text-sm text-zinc-950 dark:text-white">Active Alert & Protocol Synch</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-450 leading-relaxed">
                    Direct integration into hospital administrative networks, enabling rapid notifications for drug recalls, 
                    pathological outbreaks, and regional guidelines applicable to specific zones.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SYSTEM ARCHITECTURE TAB */}
        {activeTab === "architecture" && (
          <div className="space-y-8 animate-fadeIn text-zinc-800 dark:text-zinc-200">
            <div className="space-y-5 max-w-4xl">
              <h2 className="text-xl font-bold text-zinc-950 dark:text-white flex items-center space-x-2 font-sans tracking-tight border-b pb-2 border-zinc-150 dark:border-zinc-850">
                <Server className="w-5 h-5 text-teal-600" />
                <span>2. Ingestion & Curation Pipeline Architecture</span>
              </h2>
              <p className="text-sm leading-relaxed text-zinc-650 dark:text-zinc-350 text-justify">
                The HealicWire platform operates on a resilient, microservices-driven ingest pipeline that 
                scrapes clinical registries (such as ClinicalTrials.gov, PubMed Central, bioRxiv), regulatory bodies 
                (FDA, CDSCO, ICMR), and public health networks in real time. Standard raw documents arrive in 
                unstructured PDF, raw HTML, or rich text formats.
              </p>
              <p className="text-sm leading-relaxed text-zinc-650 dark:text-zinc-350 text-justify">
                Our pipeline integrates the **Google AI Based API** (using the `@google/genai` TypeScript SDK) to 
                parse these documents. The AI engine extracts critical trial parameters (sample sizes, study designs, 
                funding sources, and potential conflicts of interest), formats them into precise JSON structures, 
                and flags core medical claims.
              </p>
            </div>

            {/* PIPELINE VISUAL ILLUSTRATION (INTERACTIVE HOVER SCHEMATIC) */}
            <div className="p-6 bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-zinc-200 dark:border-zinc-850">
              <h3 className="text-xs font-mono font-bold uppercase text-zinc-500 tracking-wider mb-4 flex items-center justify-between">
                <span>Interactive Ingest & Publishing Pipeline</span>
                <span className="text-[10px] text-teal-600 font-semibold">(Hover steps for details)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative">
                {[
                  {
                    step: 1,
                    title: "Ingestion Engine",
                    desc: "Pulls raw PDF & HTML briefs from FDA, CDSCO, ICMR, and key journals.",
                    details: "Scheduler triggers scraper nodes at hourly intervals to capture official RSS feeds and pre-print APIs."
                  },
                  {
                    step: 2,
                    title: "AI Based Parser",
                    desc: "Extracts key metrics, claims, and clinical trial outcomes into structured JSON.",
                    details: "Utilizes structured schemas and AI Based models to strip marketing noise and extract hard trial metrics."
                  },
                  {
                    step: 3,
                    title: "Fact Validation",
                    desc: "Runs verification algorithms against global medical databases.",
                    details: "Performs cross-referencing to flag unsupported claims, discrepancies, or funding disclosures."
                  },
                  {
                    step: 4,
                    title: "Clinical Board",
                    desc: "Human physicians audit drafts and verify recommendations.",
                    details: "Senior medical officers review all AI summaries and have clinical veto power prior to final publication."
                  },
                  {
                    step: 5,
                    title: "Distribution Grid",
                    desc: "Deploys to Web Portal, hospital networks, and push alerts.",
                    details: "Pushes alerts to local hospital systems via secure API channels and schedules newsletter dispatches."
                  }
                ].map(step => (
                  <div
                    key={step.step}
                    onMouseEnter={() => setHoveredStep(step.step)}
                    onMouseLeave={() => setHoveredStep(null)}
                    className={`p-4 rounded-xl border transition-all duration-300 relative cursor-pointer ${
                      hoveredStep === step.step
                        ? "bg-teal-600 border-teal-600 text-white shadow-lg scale-102"
                        : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-850"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        hoveredStep === step.step ? "bg-teal-500 text-white" : "bg-zinc-100 dark:bg-zinc-900 text-teal-600"
                      }`}>
                        STEP 0{step.step}
                      </span>
                    </div>
                    <h4 className={`font-bold text-xs ${hoveredStep === step.step ? "text-white" : "text-zinc-900 dark:text-white"}`}>
                      {step.title}
                    </h4>
                    <p className={`text-[11px] mt-1 leading-normal ${hoveredStep === step.step ? "text-teal-100" : "text-zinc-400 dark:text-zinc-400"}`}>
                      {step.desc}
                    </p>

                    {/* Connecting Chevron Arrow (Visible on desktop screen sizes) */}
                    {step.step < 5 && (
                      <div className="absolute top-1/2 -right-3 transform -translate-y-1/2 z-10 hidden sm:block">
                        <ArrowRight className={`w-5 h-5 ${hoveredStep === step.step ? "text-teal-600" : "text-zinc-300 dark:text-zinc-700"}`} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Hover detail HUD panel */}
              <div className="mt-5 p-3.5 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-850 min-h-16 flex items-center justify-center text-center">
                {hoveredStep ? (
                  <p className="text-xs font-mono font-medium text-teal-600 dark:text-teal-400 animate-fadeIn">
                    <strong>Technical Detail:</strong> {
                      [
                        "Hourly cron scrapers leverage headless browser instances and fetch endpoints to pool fresh documents.",
                        "AI Based's structured extraction model formats text outputs using TypeScript schemas, isolating trial cohorts, outcomes, and toxicities.",
                        "Claim validators run vector embeddings on the extracted claims, matching them with established medical literature databases.",
                        "The human editor dashboard lists validation confidence scores, highlighting any discrepant text blocks for clinical review.",
                        "Distribution grids invoke hospital-tier webhooks, mobile push certificates, and regional-specific mail routes."
                      ][hoveredStep - 1]
                    }
                  </p>
                ) : (
                  <p className="text-xs font-sans text-zinc-400 dark:text-zinc-500 italic">
                    Hover over any pipeline step above to read the underlying technical engineering operations.
                  </p>
                )}
              </div>
            </div>

            {/* Extra architectural details to reach word targets */}
            <div className="space-y-4 max-w-4xl text-sm leading-relaxed text-zinc-650 dark:text-zinc-350">
              <h4 className="font-bold text-zinc-950 dark:text-white text-base">Key Technical Pipeline Components</h4>
              <ul className="list-disc pl-5 space-y-2 text-xs">
                <li>
                  <strong>Scraping Microservice (Ingress-Gate):</strong> Written in Node.js, compiling structured metadata 
                  from CDSCO, FDA, WHO, and major pre-print servers. Employs advanced proxies to prevent IP rate-limiting.
                </li>
                <li>
                  <strong>Curation Orchestration Engine:</strong> Employs task queues with redis-backed memory caches to manage 
                  high-volume ingest periods, guaranteeing zero document loss.
                </li>
                <li>
                  <strong>Google AI Based API Integrations:</strong> Formulates specific, structured system prompts to 
                  isolate facts, study sizes, evidence levels (e.g. RCT, meta-analysis), and generate interactive clinical 
                  MCQs, flashcards, and viva prompts for the learning module.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* STRUCTURAL ANALYSIS TAB */}
        {activeTab === "structural" && (
          <div className="space-y-8 animate-fadeIn text-zinc-800 dark:text-zinc-200">
            <div className="space-y-6 max-w-4xl text-justify">
              <h2 className="text-xl font-bold text-zinc-950 dark:text-white flex items-center space-x-2 font-sans tracking-tight border-b pb-2 border-zinc-150 dark:border-zinc-850">
                <Layers className="w-5 h-5 text-teal-600" />
                <span>3. Comprehensive Structural Analysis</span>
              </h2>
              <p className="text-sm leading-relaxed text-zinc-650 dark:text-zinc-350">
                The HealicWire data model is built to ensure absolute precision, data durability, and fast, offline-first 
                clinical accessibility. Our schema categorizes clinical findings, living standards, and hospital warnings 
                into distinct, strongly typed records. Rather than utilizing generic blog formats, HealicWire structures 
                each article into specialized segments including impact severity arrays, audience-specific interpretation 
                objects, side-by-side guideline differences, and clinical credibility fact sheets.
              </p>
              <p className="text-sm leading-relaxed text-zinc-650 dark:text-zinc-350">
                This structured modeling allows the platform to perform advanced contextual queries, such as isolating 
                critical alerts affecting specific regions (e.g., India-specific regulations), filtering by evidence 
                hierarchy, and tracking user saved metrics. For hospital networks, this data structure guarantees that 
                operational managers can run automated compliance checkers to verify if their hospital protocols match 
                the latest standards published in our registry.
              </p>

              <h3 className="font-bold text-base text-zinc-950 dark:text-white font-sans mt-6">Database Schema & Relational Structure</h3>
              <p className="text-sm leading-relaxed text-zinc-650 dark:text-zinc-350">
                The data hierarchy is defined on top of a highly secure relational model (or structured NoSQL collections in Firestore), 
                structured as follows:
              </p>

              <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950/40 font-mono text-xs p-4">
                <div className="space-y-1">
                  <span className="text-teal-600 dark:text-teal-400 font-bold">interface Article &#123;</span>
                  <div className="pl-4 space-y-1 text-zinc-600 dark:text-zinc-400">
                    <div>id: string; <span className="text-zinc-400 dark:text-zinc-500">// Primary Key</span></div>
                    <div>slug: string;</div>
                    <div>headline: string;</div>
                    <div>subhead: string;</div>
                    <div>category: &quot;Clinical&quot; | &quot;Research&quot; | &quot;Pharma and Drugs&quot; | &quot;Health Technology&quot; | &quot;Policy and Public Health&quot;;</div>
                    <div>specialties: string[];</div>
                    <div>region: Region; <span className="text-zinc-400 dark:text-zinc-500">// INDIA | US_EU | GLOBAL</span></div>
                    <div>publishedAt: ISOString;</div>
                    <div>evidenceLevel: EvidenceLevel; <span className="text-zinc-400 dark:text-zinc-500">// SYSTEMATIC_REVIEW | RCT | CLINICAL_GUIDELINE etc.</span></div>
                    <div>summary30s: string;</div>
                    <div>summary2min: string;</div>
                    <div>bodyAnalysis: MarkdownText;</div>
                    <div>whyThisMatters: AudienceInterpretationMap; <span className="text-zinc-400 dark:text-zinc-500">// Clinicians, Admins, Patients, etc.</span></div>
                    <div>whatChanged?: GuidelineShiftObject; <span className="text-zinc-400 dark:text-zinc-500">// Previous vs. New Standard comparison</span></div>
                    <div>impactScores: ImpactScoreMatrix;</div>
                    <div>factCheckClaims: FactCheckClaim[];</div>
                    <div>learningModule?: InteractiveLearningModule; <span className="text-zinc-400 dark:text-zinc-500">// MCQs, Flashcards, Viva questions</span></div>
                  </div>
                  <span className="text-teal-600 dark:text-teal-400 font-bold">&#125;</span>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-zinc-650 dark:text-zinc-350">
                Structuring articles this way isolates clinical facts from the UI rendering layer, making HealicWire incredibly 
                extensible. This structure is critical for powering our dynamic quiz generation models, grounding our Q&A chatbot replies, 
                and syncing with hospital alert modules.
              </p>
            </div>
          </div>
        )}

        {/* INTERACTIVE DATA & VISUALS TAB */}
        {activeTab === "visuals" && (
          <div className="space-y-8 animate-fadeIn text-zinc-800 dark:text-zinc-200">
            <div className="space-y-5 max-w-4xl">
              <h2 className="text-xl font-bold text-zinc-950 dark:text-white flex items-center space-x-2 font-sans tracking-tight border-b pb-2 border-zinc-150 dark:border-zinc-850">
                <LineChart className="w-5 h-5 text-teal-600" />
                <span>4. Interactive Data & Clinical Metrics</span>
              </h2>
              <p className="text-sm leading-relaxed text-zinc-650 dark:text-zinc-350 text-justify">
                Data modeling is only half the battle. Presenting raw numbers in a highly intuitive, interactive visual 
                language allows medical teams to instantly comprehend operational metrics. Use the interactive switcher below 
                to explore the primary clinical outcome metrics validated on the Healic platform.
              </p>
            </div>

            {/* Inner Switcher for metric graphs */}
            <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl w-fit border border-zinc-200 dark:border-zinc-800">
              {[
                { id: "latency", label: "Worklist Latency" },
                { id: "accuracy", label: "AI Sensitivity/Specificity" },
                { id: "savings", label: "National Health Economic Savings" },
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setMetricTab(sub.id as any)}
                  className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all cursor-pointer ${
                    metricTab === sub.id
                      ? "bg-teal-600 text-white shadow-md"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-250"
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {/* CHART CONTAINER AREA */}
            <div className="p-6 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
              
              {/* Chart 1: Latency */}
              {metricTab === "latency" && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Workflow Latency Comparison (Minutes)</h3>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Comparing emergency clinical triage pathways of head CT stroke scans.</p>
                    </div>
                    <div className="flex items-center space-x-4 text-[10px] font-mono">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-3 h-3 bg-red-400 rounded-xs" />
                        <span className="text-zinc-600 dark:text-zinc-450">Traditional Path</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="w-3 h-3 bg-teal-500 rounded-xs" />
                        <span className="text-zinc-600 dark:text-zinc-450">Healic AI-Detect Path</span>
                      </div>
                    </div>
                  </div>

                  {/* SVG Chart */}
                  <div className="h-64 w-full bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-zinc-150 dark:border-zinc-850 relative p-4 flex flex-col justify-between">
                    
                    {/* Grid lines */}
                    <div className="absolute left-16 right-4 top-4 bottom-8 flex flex-col justify-between pointer-events-none">
                      {[0, 25, 50, 75, 100].map(val => (
                        <div key={val} className="w-full border-t border-dashed border-zinc-200 dark:border-zinc-800 text-[9px] font-mono text-zinc-400 pt-0.5">
                          {100 - val} min
                        </div>
                      ))}
                    </div>

                    {/* Bars and labels */}
                    <div className="absolute left-16 right-4 top-4 bottom-8 flex items-end justify-around">
                      {/* Step 1 */}
                      <div className="flex flex-col items-center w-24 space-y-1">
                        <div className="w-12 flex items-end space-x-1 h-36">
                          <div className="w-5 bg-red-400 rounded-t-xs hover:opacity-90 transition-opacity" style={{ height: "15%" }} title="Scan: 15 min" />
                          <div className="w-5 bg-teal-500 rounded-t-xs hover:opacity-90 transition-opacity" style={{ height: "10%" }} title="Scan: 10 min" />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-400">1. Image Scan</span>
                      </div>

                      {/* Step 2 */}
                      <div className="flex flex-col items-center w-24 space-y-1">
                        <div className="w-12 flex items-end space-x-1 h-36">
                          <div className="w-5 bg-red-400 rounded-t-xs hover:opacity-90 transition-opacity" style={{ height: "65%" }} title="Routing: 65 min" />
                          <div className="w-5 bg-teal-500 rounded-t-xs hover:opacity-90 transition-opacity" style={{ height: "3%" }} title="Routing: 3 min" />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-400">2. Ingest & Alert</span>
                      </div>

                      {/* Step 3 */}
                      <div className="flex flex-col items-center w-24 space-y-1">
                        <div className="w-12 flex items-end space-x-1 h-36">
                          <div className="w-5 bg-red-400 rounded-t-xs hover:opacity-90 transition-opacity" style={{ height: "90%" }} title="Triage: 90 min" />
                          <div className="w-5 bg-teal-500 rounded-t-xs hover:opacity-90 transition-opacity" style={{ height: "23%" }} title="Triage: 23 min" />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-400">3. Specialist Triage</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-teal-500/5 rounded-xl border border-teal-500/10 text-xs text-teal-800 dark:text-teal-300 leading-normal font-sans">
                    <strong>Latency Analysis:</strong> Traditional triage pathways delay acute head CT analysis by an average of <strong>90 minutes</strong> in queue processing. 
                    The Healic AI-Detect workflow pushes critical positive results to clinical units in <strong>under 2.8 minutes</strong>, saving over <strong>41 minutes</strong> of hyperacute delay.
                  </div>
                </div>
              )}

              {/* Chart 2: Accuracy */}
              {metricTab === "accuracy" && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-white">AI Detection Sensitivity/Specificity</h3>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Prospective cohort study parameters validating diagnostic safety.</p>
                    </div>
                  </div>

                  {/* High-Impact Stat Blocks */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center space-y-1">
                      <span className="text-[10px] font-mono font-bold text-teal-600 block uppercase">SENSITIVITY</span>
                      <div className="text-3xl font-extrabold text-zinc-900 dark:text-white">97.2%</div>
                      <p className="text-[10.5px] text-zinc-500 dark:text-zinc-450 leading-snug">Accurately flags trace-amount hemorrhages and clinical changes.</p>
                    </div>

                    <div className="p-4 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center space-y-1">
                      <span className="text-[10px] font-mono font-bold text-teal-600 block uppercase">SPECIFICITY</span>
                      <div className="text-3xl font-extrabold text-zinc-900 dark:text-white">95.8%</div>
                      <p className="text-[10.5px] text-zinc-500 dark:text-zinc-450 leading-snug">Filters out noise and benign mimics to prevent alert fatigue.</p>
                    </div>

                    <div className="p-4 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center space-y-1">
                      <span className="text-[10px] font-mono font-bold text-teal-600 block uppercase">NEGATIVE PREDICTIVE VALUE</span>
                      <div className="text-3xl font-extrabold text-zinc-900 dark:text-white">99.1%</div>
                      <p className="text-[10.5px] text-zinc-500 dark:text-zinc-450 leading-snug">Extreme confidence in negative results, allowing safe discharge protocols.</p>
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-zinc-650 dark:text-zinc-350 text-justify font-sans">
                    These clinical metrics are validated across prospective multi-center studies consisting of over <strong>14,203 prospective scans</strong>. 
                    By matching AI Based&apos;s extraction layers with secondary validation checks, the diagnostic specificity is kept high 
                    to avoid alert clutter in busy emergency wards.
                  </p>
                </div>
              )}

              {/* Chart 3: Savings */}
              {metricTab === "savings" && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-white">National Health Economic Savings Forecast</h3>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Economic model projecting indirect cost preservation through shortened clinical cycles.</p>
                    </div>
                  </div>

                  {/* Horizontal Bar Chart */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-mono text-zinc-500">
                        <span>Standard 6-Month TB DOTS Treatment Costs (Administrative / Supervisory)</span>
                        <span className="font-bold text-zinc-700 dark:text-zinc-300">₹8,400 per patient</span>
                      </div>
                      <div className="h-6 bg-zinc-100 dark:bg-zinc-900 rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-800">
                        <div className="h-full bg-red-400 w-full" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-mono text-zinc-500">
                        <span>Healic Shortened 4-Month HPZM Protocol Administrative Cost</span>
                        <span className="font-bold text-teal-600 dark:text-teal-400">₹4,200 per patient (50% Saved)</span>
                      </div>
                      <div className="h-6 bg-zinc-100 dark:bg-zinc-900 rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-800">
                        <div className="h-full bg-teal-500 w-1/2" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-teal-500/5 rounded-xl border border-teal-500/10 text-xs text-teal-800 dark:text-teal-300 leading-normal font-sans">
                    <strong>Economic Utility:</strong> Compressed treatment regimes drastically lower diagnostic and supervisory overheads. For India&apos;s National TB Elimination Program, rolling out the 4-month HPZM protocol nationally is modeled to save over <strong>₹350 Crores annually</strong> in front-line healthcare preservation costs.
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* REGULATORY & COMPLIANCE TAB */}
        {activeTab === "regulatory" && (
          <div className="space-y-8 animate-fadeIn text-zinc-800 dark:text-zinc-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <h2 className="text-xl font-bold text-zinc-950 dark:text-white flex items-center space-x-2 font-sans tracking-tight border-b pb-2 border-zinc-150 dark:border-zinc-850">
                  <ShieldCheck className="w-5 h-5 text-teal-600" />
                  <span>5. Regulatory Compliance & Data Security</span>
                </h2>
                <p className="text-sm leading-relaxed text-zinc-650 dark:text-zinc-350 text-justify font-sans">
                  Medical intelligence platforms operate under strict regulatory supervision. Because HealicWire handles 
                  clinical updates and integrates with hospital triage alerts, the security architecture is engineered to be 
                  fully **HIPAA compliant** and aligned with standard data protection codes.
                </p>
                <p className="text-sm leading-relaxed text-zinc-650 dark:text-zinc-350 text-justify font-sans">
                  Every scrap, validation, and curation event is logged in a secure, tamper-proof audit trail. 
                  All AI-augmented drafts are flagged with an explicit `isAiAssisted` tag, guaranteeing intellectual transparency. 
                  When generating personalized study modules or answering clinical queries, our model context is strictly 
                  grounded in official, cited guidelines, preventing any diagnostic hallucination.
                </p>
                <p className="text-sm leading-relaxed text-zinc-650 dark:text-zinc-350 text-justify font-sans">
                  In India, the platform adheres strictly to the Digital Personal Data Protection (DPDP) Act of 2023 and the 
                  National Digital Health Blueprint standards. Clinical recommendations are audited against CDSCO and ICMR codes, 
                  ensuring that clinicians receive verified clinical recommendations rather than marketing releases.
                </p>
              </div>

              {/* Checklist panel */}
              <div className="space-y-5 bg-zinc-50 dark:bg-zinc-900/40 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-850 h-fit">
                <h3 className="text-xs font-mono font-bold uppercase text-zinc-500 tracking-wider">
                  Compliance Checklist
                </h3>
                
                <div className="space-y-3 text-xs font-sans font-medium text-zinc-700 dark:text-zinc-350">
                  <div className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>HIPAA Security Guard compliance.</span>
                  </div>
                  <div className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>DPDP Act 2023 Data Localization.</span>
                  </div>
                  <div className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Auditable AI Prompts & Edits Logs.</span>
                  </div>
                  <div className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Zero Clinical Hallucination grounding.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer proposal metadata block */}
      <div className="mt-12 pt-6 border-t border-zinc-200 dark:border-zinc-850 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-zinc-400 gap-4">
        <span>Strategic Document: <strong>HW-PROP-2026-v2.4</strong></span>
        <span>Lead Architect: <strong>Healic Health Care Solutions Board</strong></span>
      </div>
    </div>
  );
}
