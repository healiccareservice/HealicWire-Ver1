const fs = require('fs');
const path = require('path');

const wikiImages = JSON.parse(fs.readFileSync('./wiki_images.json', 'utf-8'));
const topicCounts = {};

const DB_FILE = path.join(__dirname, 'db.json');

const categories = ["Clinical", "Research", "Pharma and Drugs", "Health Technology", "Policy and Public Health"];
const specialties = ["General Medicine", "Cardiology", "Oncology", "Neurology", "Endocrinology", "Pediatrics", "Surgery", "Psychiatry", "Immunology", "Pulmonology"];
const regions = ["Global", "India", "US & Europe"];
const evidenceLevels = [
  "Systematic Review", "Meta-Analysis", "Randomized Controlled Trial", 
  "Clinical Guideline", "Regulatory Approval", "Government Notification", 
  "Observational Study", "Preprint", "Case Report", "Expert Opinion"
];

const topics = [
  "Semaglutide", "CAR-T Cell Therapy", "mRNA Vaccines", "Alzheimer's Disease", 
  "Robotic Surgery", "Telemedicine", "Antibiotic Resistance", "Wearable Sensors", 
  "CRISPR Gene Editing", "Mental Health", "Sepsis Detection", "Diabetes Management",
  "Tuberculosis", "Immunotherapy", "Digital Therapeutics", "Precision Medicine",
  "Cardiovascular Mortality", "Deep-Learning MRI", "Digital Health Regulations"
];

const verbs = [
  "FDA Approves", "New Study Links", "AI Tool Predicts", "WHO Updates", 
  "Phase 3 Trial Shows", "ICMR Mandates", "Breakthrough in", "Research Explores",
  "Guidelines Updated for", "Novel Approach to", "Clinical Trial Validates"
];

const outcomes = [
  "Reduced Mortality", "Improved Patient Outcomes", "Faster Recovery Times",
  "Enhanced Accuracy", "Better Diagnostic Yield", "Lower Healthcare Costs",
  "Targeted Treatment", "Fewer Adverse Events", "Extended Progression-Free Survival"
];

const imageIds = [
  "1576091160399-112ba8d25d1d", // surgery room
  "1584036561584-b03c19ce876c", // scientist lab
  "1516549655169-df83a0774514", // pills
  "1530497610208-b4bd518c983a", // doctor
  "1579684385127-1ef15d508118", // microscope
  "1581091226825-a6a2a5aee158", // test tubes
  "1551076805-e16760c274f7", // hospital bed
  "1527613426441-4da17471b66d", // clinic
  "1505751172876-fa143ce4aeae", // stethoscope
  "1584308972272-9e4e7685e80f", // research
  "1583912265922-563d11b3e6ce", // futuristic medical / dna
  "1584515933487-779824d29309", // vaccine
  "1582716401824-00e95ff4eb48", // patient
  "1631553592186-b4d618d3615e", // modern healthcare
  "1584516089334-a3f169ebbf96", // syringe
  "1579154204601-5288a0b0d1de", // medical tech
  "1559839734-2b71ea197ec2", // doctor patient
];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(getRandomInt(0, 23), getRandomInt(0, 59), getRandomInt(0, 59));
  return date.toISOString();
}

function generateParagraphs(topic, outcome, count) {
  const p1 = `The healthcare landscape is rapidly evolving, and recent developments regarding ${topic} have sparked intense interest among medical professionals. Preliminary data and subsequent extensive evaluations suggest a paradigm shift, culminating in ${outcome}. This signifies not only a leap in therapeutic or diagnostic capability but also a fundamental re-evaluation of current standards of care.`;
  const p2 = `Researchers and clinicians have long sought ways to optimize interventions in this domain. The integration of novel methodologies related to ${topic} demonstrates a robust correlation with ${outcome}. Studies highlight that addressing these underlying variables can significantly alter the trajectory of patient management. "This is a watershed moment," noted a lead investigator, emphasizing the necessity of updating existing clinical pathways.`;
  const p3 = `From a logistical and operational standpoint, the rollout of these updates requires coordinated efforts across healthcare systems. Institutions must evaluate their infrastructure to accommodate the specific requirements introduced by ${topic}. Furthermore, ensuring equitable access remains a critical challenge, as the benefits of ${outcome} should ideally reach diverse patient populations without exacerbating existing disparities.`;
  const p4 = `Looking ahead, longitudinal studies will be paramount to confirming the durability of these results. While the short-term indicators of ${outcome} are undeniably promising, the medical community maintains a stance of cautious optimism. Ongoing surveillance and real-world evidence collection will ultimately dictate the permanence of ${topic} in global healthcare guidelines.`;
  
  const pool = [p1, p2, p3, p4];
  let res = [];
  for (let i=0; i<count; i++) {
    res.push(pool[i % pool.length]);
  }
  return res.join('\n\n');
}

const generatedArticles = [];
const TOTAL_ARTICLES = 100;

for (let i = 0; i < TOTAL_ARTICLES; i++) {
  const category = getRandomItem(categories);
  const topic = getRandomItem(topics);
  const verb = getRandomItem(verbs);
  const outcome = getRandomItem(outcomes);
  const imageId = getRandomItem(imageIds);
  
  const headline = `${verb} ${topic}, Demonstrating ${outcome} in Recent Analysis`;
  const subhead = `A comprehensive overview of the latest advancements in ${topic}, highlighting critical data that points directly to ${outcome}. Explore the implications for modern clinical practice and patient care paradigms.`;
  
  let baseDaysAgo = (i / TOTAL_ARTICLES) * 365;
  let jitter = getRandomInt(-2, 2);
  let daysAgo = Math.max(0, Math.floor(baseDaysAgo + jitter));
  
  const publishedAt = generateDate(daysAgo);

  topicCounts[topic] = (topicCounts[topic] || 0) + 1;
  const article = {
    id: `article-${Date.now()}-${i}`,
    slug: `article-${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i}-${getRandomInt(100,999)}`,
    headline,
    subhead,
    category,
    specialties: [getRandomItem(specialties), getRandomItem(specialties)],
    region: getRandomItem(regions),
    imageUrl: wikiImages[topic][topicCounts[topic] % wikiImages[topic].length],
    imageCredit: "Wikimedia Commons",
    imageType: "photograph",
    publishedAt,
    sourcePublishedAt: publishedAt,
    readingTimeMinutes: getRandomInt(4, 15),
    status: "published",
    sourceName: "Global Health Journal",
    sourceUrl: "https://example.com/journal",
    evidenceLevel: getRandomItem(evidenceLevels),
    isAiAssisted: Math.random() > 0.5,
    
    // Detailed 30s Summary
    summary30s: `Recent developments in ${topic} have led to ${outcome}. This update is highly relevant for practitioners seeking to optimize care. The core finding suggests that adopting these new protocols or technologies yields immediate benefits, primarily evidenced by ${outcome}. Clinicians are advised to review these changes and consider integrating them into their current diagnostic or therapeutic workflows to ensure patients receive the most up-to-date and effective interventions available.`,
    
    // Detailed 2m Brief
    summary2min: `**Background:** The management and understanding of ${topic} have been areas of intense scrutiny. Historically, the approaches yielded moderate success, but the demand for better outcomes drove rigorous innovation.\n\n**The Intervention:** The latest intervention centers around the specific application of ${topic}, fundamentally altering how healthcare professionals approach the condition. By leveraging new data and refined methodologies, this approach targets the core mechanisms more effectively.\n\n**The Results:** The most striking outcome from recent evaluations is unequivocally ${outcome}. Across multiple cohorts and diverse patient demographics, the data indicates a consistent and statistically significant improvement. This translates to tangible benefits in clinical settings.\n\n**Next Steps:** Regulatory bodies and clinical guidelines committees are currently reviewing this data. In the interim, healthcare providers should familiarize themselves with the specifics of ${topic}, as it is poised to become a staple in standard care protocols in the near future.`,
    
    // Comprehensive Body Analysis
    bodyAnalysis: `${generateParagraphs(topic, outcome, 4)}\n\n#### Methodology & Study Design\n\nThe underlying research utilized robust frameworks to ensure validity. Double-blinded protocols, extensive cohort tracking, and rigorous peer review have corroborated the initial findings regarding ${topic}.\n\n#### Clinical Implementation\n\nImplementing these findings requires a nuanced approach. While ${outcome} is the primary goal, clinicians must assess individual patient profiles, potential contraindications, and resource availability.\n\n#### Future Horizons\n\nAs the medical community continues to explore ${topic}, further refinements are anticipated. Future studies will likely focus on long-term safety profiles and comparative efficacy against emerging alternatives.`,
    
    whyThisMatters: {
      clinicians: `Directly impacts treatment protocols and decision-making by demonstrating ${outcome}.`,
      students: `Represents the cutting edge of ${category} and will likely be integrated into curriculum and board examinations.`,
      hospitalAdministrators: `Necessitates a review of procurement, resource allocation, and clinical workflow to support ${topic}.`,
      patients: `Offers renewed hope through improved interventions, specifically promising ${outcome}.`,
      researchers: `Provides a validated foundation for subsequent investigations and specialized trials into ${topic}.`
    },
    impactScores: {
      clinicalPractice: getRandomInt(3, 5),
      medicalEducation: getRandomInt(2, 5),
      research: getRandomInt(3, 5),
      publicHealth: getRandomInt(2, 5),
      hospitalOperations: getRandomInt(2, 5),
      patientCare: getRandomInt(3, 5)
    },
    indiaRelevance: {
      status: getRandomItem(["Directly applicable", "Partially applicable", "Requires local adaptation"]),
      explanation: `Given the specific demographic and infrastructural nuances of the Indian healthcare system, the developments in ${topic} hold significant potential, though implementation may require localized adaptation to fully realize ${outcome}.`
    },
    peerReviewed: true,
    fundingSource: getRandomItem(["National Institute of Health", "Global Healthcare Foundation", "Independent Research Grant", "Corporate Sponsorship"]),
    coiNote: "The authors have declared no competing interests.",
    references: [
      "Doe, J. et al. (2025). Advanced insights into " + topic + ". Journal of Clinical Excellence, 45(2), 112-128.",
      "Smith, A. (2025). Evaluating " + outcome + " in modern cohorts. Medical Review Annual, 12(4), 45-60."
    ],
    views: getRandomInt(500, 15000)
  };
  
  generatedArticles.push(article);
}

// Ensure descending order
generatedArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

let db;
try {
  const data = fs.readFileSync(DB_FILE, "utf-8");
  db = JSON.parse(data);
} catch (e) {
  console.error("Failed to read db.json");
  process.exit(1);
}

db.articles = generatedArticles;

fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
console.log('Successfully generated and inserted 100 detailed articles into db.json');
