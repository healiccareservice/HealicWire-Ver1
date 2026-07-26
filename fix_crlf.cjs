const fs = require('fs');
const file = 'frontend/src/components/AdminCMS.tsx';
let content = fs.readFileSync(file, 'utf-8');

// The label to replace
content = content.replace(
  />\s*Page \/ Topic Title \*\s*<\/label>/,
  '>\n                            Managed Events *\n                          </label>'
);

// The options to replace
content = content.replace(
  /<option value="">-- Choose Page \/ Topic Title \(Recently Uploaded First\) --<\/option>\s*\{availablePages\.map\(page => \(/,
  `<option value="">-- Choose Events managed by us --</option>
                            {availablePages
                              .filter(page => page.title.startsWith("Scientific Events:"))
                              .map(page => (`
);

fs.writeFileSync(file, content, 'utf-8');
console.log('Fixed strings using flexible regex!');
