const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'db.json');
const imgDir = path.join(__dirname, 'public', 'images', 'articles');

function run() {
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  const validFiles = fs.readdirSync(imgDir).filter(f => f.endsWith('.jpg') && fs.statSync(path.join(imgDir, f)).size > 0);
  console.log(`Found ${validFiles.length} valid local image files.`);
  
  for (let i = 0; i < db.articles.length; i++) {
    const article = db.articles[i];
    const dest = path.join(imgDir, `${i}.jpg`);
    
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      article.imageUrl = `/images/articles/${i}.jpg`;
    } else {
      // Pick one of the valid downloaded images deterministically
      const fallbackFile = validFiles[i % validFiles.length];
      article.imageUrl = `/images/articles/${fallbackFile}`;
    }
  }
  
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  console.log(`Done! All ${db.articles.length} articles now point to local static images!`);
}

run();
