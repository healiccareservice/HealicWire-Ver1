const fs = require('fs');
const file = 'frontend/src/components/AdminCMS.tsx';
let content = fs.readFileSync(file, 'utf-8');

// The label to replace
const oldLabel = `                          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                            Page / Topic Title *
                          </label>`;
const newLabel = `                          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                            Managed Events *
                          </label>`;
content = content.replace(oldLabel, newLabel);

// The options to replace
const oldOptions = `<option value="">-- Choose Page / Topic Title (Recently Uploaded First) --</option>
                            {availablePages.map(page => (`;
const newOptions = `<option value="">-- Choose Events managed by us --</option>
                            {availablePages
                              .filter(page => page.title.startsWith("Scientific Events:"))
                              .map(page => (`;

content = content.replace(oldOptions, newOptions);

fs.writeFileSync(file, content, 'utf-8');
console.log('Fixed strings!');
