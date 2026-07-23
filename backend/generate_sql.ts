import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'db.json');
const OUT_FILE = path.join(process.cwd(), 'insert_data.sql');

function escapeSql(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val.toString();
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (Array.isArray(val) || typeof val === 'object') {
    const jsonStr = JSON.stringify(val).replace(/'/g, "''");
    return `'${jsonStr}'::jsonb`;
  }
  if (typeof val === 'string') {
    return `'${val.replace(/'/g, "''")}'`;
  }
  return 'NULL';
}

function migrate() {
  if (!fs.existsSync(DB_FILE)) {
    console.error("db.json not found!");
    return;
  }

  const raw = fs.readFileSync(DB_FILE, 'utf8');
  const db = JSON.parse(raw);
  let sql = '-- Generated data insertion script for Supabase\n\n';

  // 1. Articles
  if (db.articles && db.articles.length > 0) {
    sql += '-- Articles\n';
    for (const a of db.articles) {
      const cols = [
        'id', 'slug', 'headline', 'subhead', 'category', 'specialties', 'region',
        'image_url', 'image_credit', 'image_type', 'published_at', 'source_published_at',
        'reading_time_minutes', 'status', 'source_name', 'source_url', 'evidence_level',
        'is_ai_assisted', 'summary_30s', 'summary_2min', 'body_analysis', 'why_this_matters',
        'what_changed', 'impact_scores', 'india_relevance', 'peer_reviewed', 'funding_source',
        'coi_note', 'study_design', 'sample_size', '"references"', 'learning_module',
        'fact_check_claims', 'clinical_impact_score'
      ];
      
      const vals = [
        escapeSql(a.id), escapeSql(a.slug || a.id), escapeSql(a.headline), escapeSql(a.subhead),
        escapeSql(a.category), escapeSql(a.specialties || []), escapeSql(a.region),
        escapeSql(a.imageUrl), escapeSql(a.imageCredit), escapeSql(a.imageType),
        escapeSql(a.publishedAt), escapeSql(a.sourcePublishedAt), escapeSql(a.readingTimeMinutes),
        escapeSql(a.status || 'published'), escapeSql(a.sourceName), escapeSql(a.sourceUrl),
        escapeSql(a.evidenceLevel), escapeSql(a.isAIAssisted || false), escapeSql(a.summary30s),
        escapeSql(a.summary2min), escapeSql(a.bodyAnalysis), escapeSql(a.whyThisMatters),
        escapeSql(a.whatChanged), escapeSql(a.impactScores), escapeSql(a.indiaRelevance),
        escapeSql(a.peerReviewed || false), escapeSql(a.fundingSource), escapeSql(a.coiNote),
        escapeSql(a.studyDesign), escapeSql(a.sampleSize), escapeSql(a.references || []),
        escapeSql(a.learningModule), escapeSql(a.factCheckClaims), escapeSql(a.clinicalImpactScore)
      ];
      
      sql += `INSERT INTO articles (${cols.join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT (id) DO NOTHING;\n`;
    }
    sql += '\n';
  }

  // 2. Alerts
  if (db.alerts && db.alerts.length > 0) {
    sql += '-- Hospital Alerts\n';
    for (const a of db.alerts) {
      const cols = [
        'id', 'headline', 'severity', 'urgency', 'departments_affected',
        'recommended_action', 'source', 'date'
      ];
      const vals = [
        escapeSql(a.id), escapeSql(a.headline), escapeSql(a.severity), escapeSql(a.urgency),
        escapeSql(a.departmentsAffected || []), escapeSql(a.recommendedAction),
        escapeSql(a.source), escapeSql(a.date)
      ];
      sql += `INSERT INTO hospital_alerts (${cols.join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT (id) DO NOTHING;\n`;
    }
    sql += '\n';
  }

  // 3. Guidelines
  if (db.guidelines && db.guidelines.length > 0) {
    sql += '-- Living Guidelines\n';
    for (const g of db.guidelines) {
      const cols = [
        'id', 'condition', 'issuing_organization', 'current_recommendation',
        'previous_recommendation', 'last_updated', 'reason_for_change',
        'india_relevance', '"references"'
      ];
      const vals = [
        escapeSql(g.id), escapeSql(g.condition), escapeSql(g.issuingOrganization),
        escapeSql(g.currentRecommendation), escapeSql(g.previousRecommendation),
        escapeSql(g.lastUpdated), escapeSql(g.reasonForChange),
        escapeSql(g.indiaRelevance), escapeSql(g.references || [])
      ];
      sql += `INSERT INTO living_guidelines (${cols.join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT (id) DO NOTHING;\n`;
    }
    sql += '\n';
  }

  // 4. Events
  if (db.events && db.events.length > 0) {
    sql += '-- Scientific Events\n';
    for (const e of db.events) {
      const cols = [
        'id', 'title', 'organizer', 'scope', 'event_type', 'target_professions',
        'start_date', 'end_date', 'duration', 'venue', 'city', 'state', 'country',
        'institution', 'format', 'specialties', 'cme_credits', 'cme_accreditation_body',
        'description', 'objectives', 'abstract_deadline', 'registration_deadline',
        'early_bird_deadline', 'early_bird_cost', 'cost', 'seats_available', 'seats_left',
        'is_live', 'status', 'image_url', 'poster_url', 'keynote_speakers', 'speaker_profiles',
        'schedule', 'venue_map_url', 'registration_url', 'submission_url', 'ai_summary'
      ];
      const vals = [
        escapeSql(e.id), escapeSql(e.title), escapeSql(e.organizer), escapeSql(e.scope),
        escapeSql(e.eventType), escapeSql(e.targetProfessions || []), escapeSql(e.startDate),
        escapeSql(e.endDate), escapeSql(e.duration), escapeSql(e.venue), escapeSql(e.city),
        escapeSql(e.state), escapeSql(e.country), escapeSql(e.institution), escapeSql(e.format),
        escapeSql(e.specialties || []), escapeSql(e.cmeCredits), escapeSql(e.cmeAccreditationBody),
        escapeSql(e.description), escapeSql(e.objectives || []), escapeSql(e.abstractDeadline),
        escapeSql(e.registrationDeadline), escapeSql(e.earlyBirdDeadline), escapeSql(e.earlyBirdCost),
        escapeSql(e.cost), escapeSql(e.seatsAvailable), escapeSql(e.seatsLeft),
        escapeSql(e.isLive || false), escapeSql(e.status || 'Approved'), escapeSql(e.imageUrl),
        escapeSql(e.posterUrl), escapeSql(e.keynoteSpeakers || []), escapeSql(e.speakerProfiles || []),
        escapeSql(e.schedule || []), escapeSql(e.venueMapUrl), escapeSql(e.registrationUrl),
        escapeSql(e.submissionUrl), escapeSql(e.aiSummary)
      ];
      sql += `INSERT INTO scientific_events (${cols.join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT (id) DO NOTHING;\n`;
    }
  }

  fs.writeFileSync(OUT_FILE, sql);
  console.log("Generated insert_data.sql successfully!");
}

migrate();
