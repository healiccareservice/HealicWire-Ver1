const fs = require('fs');
const file = 'frontend/src/components/AdminCMS.tsx';
let content = fs.readFileSync(file, 'utf-8');

// 1. Select Page / Topic Title -> Managed Events & Symposia
content = content.replace(
  '<span>Select Page / Topic Title</span>',
  '<span>Managed Events & Symposia</span>'
);

// 2. (Generated in Create Portal Pages) -> Show all events managed by us
content = content.replace(
  '<span className="text-[10px] text-zinc-400 font-normal normal-case">(Generated in Create Portal Pages)</span>',
  '<span className="text-[10px] text-zinc-400 font-normal normal-case">Show all events managed by us</span>'
);

// 3. Page / Topic Title * -> Managed Events *
content = content.replace(
  'Page / Topic Title *',
  'Managed Events *'
);

// 4. Dropdown option and add filter
const oldDropdownText = '<option value="">-- Choose Page / Topic Title (Recently Uploaded First) --</option>\\n                            {availablePages.map(page => (';

const newDropdownText = '<option value="">-- Choose Events managed by us --</option>\\n                            {availablePages\\n                              .filter(page => page.title.startsWith("Scientific Events:"))\\n                              .map(page => (';

// Use indexOf for safer replacement just in case regex chokes on the spaces
const idx = content.indexOf('<option value="">-- Choose Page / Topic Title (Recently Uploaded First) --</option>');
if (idx !== -1) {
  // Find the exact end of the map statement
  const oldStr = '<option value="">-- Choose Page / Topic Title (Recently Uploaded First) --</option>\\n                            {availablePages.map(page => (';
  content = content.replace(oldStr, newDropdownText);
} else {
  console.log("Could not find dropdown options!");
}

fs.writeFileSync(file, content, 'utf-8');
console.log('Successfully updated text strings in AdminCMS.tsx');
