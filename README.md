# HealicWire — Production Cloud & Architecture Deployment Guide

HealicWire is a futuristic medical intelligence, news synthesis, and scientific event portal built with React 19, Express, TypeScript, and Google Gemini AI Studio.

---

## 📁 Repository Structure

```
HealicWire-Ver 1/
├── frontend/                  # React 19 + Vite SPA (Deploy to Netlify)
│   ├── src/                   # React Components, Views, Design System
│   ├── public/                # Static Media & Assets
│   ├── index.html             # HTML Root
│   ├── package.json           # Frontend Dependencies
│   ├── vite.config.ts         # Vite Config + Dev Proxy
│   ├── tsconfig.json          # TypeScript Config
│   └── .env.example           # Frontend Environment Template
│
├── backend/                   # Node.js + Express API (Deploy to Google Cloud Run)
│   ├── src/                   # Database Schemas & Data Collections
│   ├── server.ts              # Express API Server & Gemini Proxy
│   ├── db.json                # Persistent JSON Database
│   ├── package.json           # Backend Dependencies & Scripts
│   ├── tsconfig.json          # Backend TypeScript Config
│   ├── Dockerfile             # Multi-stage Docker Container Definition
│   └── .env.example           # Secrets & Environment Template
│
├── implementation_plan.md    # Architecture & Deployment Plan
└── README.md                  # Deployment Guide & Documentation
```

---

## 🔐 Environment Variables & Secrets

Never commit `.env` files to git repositories. All secrets should be configured via Google Secret Manager (Backend) and Netlify Environment Variables (Frontend).

### Backend (`backend/.env.example`)
```env
PORT=8080
CORS_ORIGIN=http://localhost:5173,https://healicwire.in,https://www.healicwire.in
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
JWT_SECRET=your_jwt_secret_here
```

### Frontend (`frontend/.env.example`)
```env
VITE_API_URL=http://localhost:8080
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

---

## 🚀 Local Development Setup

### 1. Start Backend API Server
```bash
cd backend
npm install
npm run dev
# Server listening on http://localhost:8080
```

### 2. Start Frontend App
```bash
cd frontend
npm install
npm run dev
# Frontend running on http://localhost:5173
```

---

## ☁️ Production Deployment

### 1. Backend (Google Cloud Run)
1. **Build Container Image:**
   ```bash
   cd backend
   docker build -t healicwire-api .
   ```
2. **Deploy to Cloud Run:**
   ```bash
   gcloud run deploy healicwire-api \
     --region asia-south1 \
     --platform managed \
     --allow-unauthenticated \
     --port 8080 \
     --memory 1Gi \
     --cpu 1 \
     --min-instances 0 \
     --max-instances 10
   ```
3. **Configure Secrets:** Attach secrets from Google Secret Manager (`GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, etc.).

### 2. Frontend (Netlify)
1. Connect Netlify to your GitHub repository.
2. Set Base directory: `frontend`
3. Build command: `npm run build`
4. Publish directory: `frontend/dist`
5. Set Environment Variable: `VITE_API_URL=https://api.healicwire.in`

---

## 🌐 Custom Domain Setup (GoDaddy DNS)

### Frontend Domain (`healicwire.in`)
- Netlify Domain Management → Add custom domain `healicwire.in`
- GoDaddy CNAME: `www` → `your-site.netlify.app`
- GoDaddy A Record (@) → Netlify Load Balancer IP

### Backend Subdomain (`api.healicwire.in`)
- Cloud Run → Manage Custom Domains → Add Mapping `api.healicwire.in`
- GoDaddy CNAME: `api` → `<gcloud-provided-url>`
