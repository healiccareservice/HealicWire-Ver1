const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf-8');
  let updated = content;
  let changed = false;
  
  if (updated.includes('living-guidelines')) {
    updated = updated.replace(/living-guidelines/g, 'current-guidelines');
    changed = true;
  }
  
  if (updated.includes('living guidelines')) {
    updated = updated.replace(/living guidelines/g, 'current guidelines');
    changed = true;
  }

  if (updated.includes('Living guidelines')) {
    updated = updated.replace(/Living guidelines/g, 'Current guidelines');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, updated, 'utf-8');
    console.log(`Updated ${filePath}`);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!fullPath.includes('node_modules') && !fullPath.includes('.git') && !fullPath.includes('dist')) {
        walk(fullPath);
      }
    } else {
      if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.sql')) {
        replaceInFile(fullPath);
      }
    }
  }
}

walk(__dirname);
console.log("Done");
