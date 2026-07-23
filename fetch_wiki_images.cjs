const https = require('https');
const fs = require('fs');

const topics = [
  "Telemedicine", "CAR-T Cell Therapy", "mRNA Vaccines", "Alzheimer's Disease",
  "Robotic Surgery", "Antibiotic Resistance", "Wearable Sensors", "CRISPR Gene Editing",
  "Mental Health", "Sepsis Detection", "Diabetes Management", "Tuberculosis",
  "Immunotherapy", "Digital Therapeutics", "Precision Medicine", "Cardiovascular Mortality",
  "Deep-Learning MRI", "Digital Health Regulations", "Semaglutide", "Medical Artificial Intelligence"
];

const topicImages = {};

async function fetchWikiImages(topic) {
  return new Promise((resolve) => {
    const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&generator=search&gsrsearch=${encodeURIComponent(topic)}&gsrlimit=10&pithumbsize=800`;
    https.get(url, { headers: { 'User-Agent': 'HealicWireBot (contact@healic.co)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const urls = [];
          if (json.query && json.query.pages) {
            for (const key in json.query.pages) {
              const page = json.query.pages[key];
              if (page.thumbnail && page.thumbnail.source && !page.thumbnail.source.includes('svg')) {
                urls.push(page.thumbnail.source);
              }
            }
          }
          resolve(urls.slice(0, 5)); // get top 5
        } catch (e) {
          resolve([]);
        }
      });
    }).on('error', () => resolve([]));
  });
}

async function run() {
  console.log("Fetching images from Wikipedia...");
  for (const topic of topics) {
    const urls = await fetchWikiImages(topic);
    // If it didn't find 5, fallback to "Hospital" search
    if (urls.length < 5) {
      const fallback = await fetchWikiImages(topic + " medicine");
      urls.push(...fallback);
    }
    // If still less than 5, use generic medical
    if (urls.length < 5) {
      const generic = await fetchWikiImages("hospital doctor patient");
      urls.push(...generic);
    }
    
    // Ensure unique and exactly 5
    const unique = [...new Set(urls)];
    topicImages[topic] = unique.slice(0, 5);
    console.log(`- ${topic}: Found ${topicImages[topic].length} images`);
  }
  
  fs.writeFileSync('wiki_images.json', JSON.stringify(topicImages, null, 2));
  console.log("Done! Saved to wiki_images.json");
}

run();
