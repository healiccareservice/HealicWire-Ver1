const https = require('https');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'public', 'images', 'articles');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    let isSettled = false;

    const request = https.get(url, { timeout: 10000 }, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        const req2 = https.get(response.headers.location, { timeout: 10000 }, (res2) => {
          res2.pipe(file);
          file.on('finish', () => {
            if (!isSettled) { isSettled = true; file.close(resolve); }
          });
        }).on('error', (err) => {
          if (!isSettled) { isSettled = true; fs.unlink(dest, () => reject(err)); }
        }).on('timeout', () => {
          req2.destroy();
          if (!isSettled) { isSettled = true; fs.unlink(dest, () => reject(new Error('Timeout'))); }
        });
      } else if (response.statusCode !== 200) {
        if (!isSettled) { isSettled = true; reject(new Error(`Failed to get '${url}' (${response.statusCode})`)); }
      } else {
        response.pipe(file);
        file.on('finish', () => {
          if (!isSettled) { isSettled = true; file.close(resolve); }
        });
      }
    });

    request.on('error', (err) => {
      if (!isSettled) { isSettled = true; fs.unlink(dest, () => reject(err)); }
    });

    request.on('timeout', () => {
      request.destroy();
      if (!isSettled) { isSettled = true; fs.unlink(dest, () => reject(new Error('Timeout'))); }
    });
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const topics = [
  "Semaglutide", "CAR-T Cell Therapy", "mRNA Vaccines", "Alzheimer's Disease", 
  "Robotic Surgery", "Telemedicine", "Antibiotic Resistance", "Wearable Sensors", 
  "CRISPR Gene Editing", "Mental Health", "Sepsis Detection", "Diabetes Management",
  "Tuberculosis", "Immunotherapy", "Digital Therapeutics", "Precision Medicine",
  "Cardiovascular Mortality", "Deep-Learning MRI", "Digital Health Regulations"
];

async function main() {
  console.log("Starting to download 100 unique healthcare AI images with timeout...");
  let i = 0;
  while (i < 100) {
    const topic = topics[i % topics.length];
    const prompt = `modern healthcare pharma medical ${topic.replace(/\s/g, '%20')}`;
    const url = `https://image.pollinations.ai/prompt/${prompt}?width=800&height=600&nologo=true&seed=${i}`;
    const dest = path.join(dir, `${i}.jpg`);
    
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      console.log(`Skipping ${i}/100 (already exists)`);
      i++;
      continue;
    }
    
    console.log(`Downloading ${i}/100...`);
    try {
      await downloadImage(url, dest);
      
      // Verify file is not 0 bytes
      const stats = fs.statSync(dest);
      if (stats.size === 0) {
        throw new Error("File is 0 bytes");
      }
      
      i++; // Only increment if successful
      await delay(3000); // 3 second delay to avoid rate limiting
    } catch (e) {
      console.error(`Failed to download ${i}: ${e.message}. Retrying...`);
      await delay(5000);
    }
  }
  console.log("Done downloading 100 images!");
}

main();
