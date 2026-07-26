const fs = require('fs');
const file = 'frontend/src/components/AdminCMS.tsx';
let content = fs.readFileSync(file, 'utf-8');

// Remove incorrect UserPlus import
content = content.replace('import { UserPlus,', 'import {');

// Add correct UserPlus import to lucide-react
if (!content.match(/import\s*\{[^}]*UserPlus[^}]*\}\s*from\s*['"]lucide-react['"]/)) {
  content = content.replace(/import\s*\{([^}]*)\}\s*from\s*['"]lucide-react['"]/, 'import { UserPlus, $1 } from "lucide-react"');
}

// Ensure X is also imported from lucide-react
if (!content.match(/import\s*\{[^}]*X[^a-zA-Z]/)) {
  content = content.replace(/import\s*\{([^}]*)\}\s*from\s*['"]lucide-react['"]/, 'import { X, $1 } from "lucide-react"');
}

fs.writeFileSync(file, content, 'utf-8');
console.log('Fixed UserPlus and X import!');
