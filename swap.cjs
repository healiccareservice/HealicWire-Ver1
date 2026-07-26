const fs = require('fs');
const file = 'frontend/src/components/AdminCMS.tsx';
let content = fs.readFileSync(file, 'utf-8');

const b2Start = content.indexOf('                      {/* 2. UPLOAD CERTIFICATE FORMAT */}');
const b3Start = content.indexOf('                      {/* 3. UPLOAD EXCEL SHEET OF CONFERENCE ATTENDEES */}');
const b4Start = content.indexOf('                      {/* 4. UPLOAD SOUVENIR */}');

if (b2Start !== -1 && b3Start !== -1 && b4Start !== -1) {
  let block2 = content.substring(b2Start, b3Start);
  let block3 = content.substring(b3Start, b4Start);

  block3 = block3.replace('{/* 3. UPLOAD EXCEL SHEET OF CONFERENCE ATTENDEES */}', '{/* 2. ADD PARTICIPANTS (REGISTRATION) */}');
  
  block3 = block3.replace(
    /<div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center font-mono">[\s\S]*?<\/div>/,
    `<div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center font-mono">\n                              2\n                            </div>`
  );

  block3 = block3.replace('<span>Upload Excel Sheet of Conference Attendees</span>', '<span>Add Participants (Registration)</span>');
  block3 = block3.replace('Upload attendee spreadsheet for CME credit allocation & certificate issuing.', 'Download and upload excel sheet or add Participants one by one.');

  const downloadBtnRegex = /\{\/\* Download Excel Format Button \*\/\}.*?<\/button>/s;
  const newBtns = `
                          <div className="flex space-x-2 self-start sm:self-auto">
                            <button
                              type="button"
                              onClick={() => alert('Add Participant One by One - Coming Soon')}
                              className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold flex items-center space-x-2 hover:bg-blue-100 transition-all shadow-2xs"
                            >
                              <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                              <span>Add One by One</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleDownloadExcelFormat}
                              className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center space-x-2 hover:bg-emerald-100 transition-all shadow-2xs"
                            >
                              <Download className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Download Excel</span>
                            </button>
                          </div>`;

  block3 = block3.replace(downloadBtnRegex, newBtns);

  block2 = block2.replace('{/* 2. UPLOAD CERTIFICATE FORMAT */}', '{/* 3. UPLOAD CERTIFICATE FORMAT */}');
  
  block2 = block2.replace(
    /<div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center justify-center font-mono">[\s\S]*?<\/div>/,
    `<div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center justify-center font-mono">\n                            3\n                          </div>`
  );

  let newContent = content.substring(0, b2Start) + block3 + block2 + content.substring(b4Start);
  
  if (!newContent.includes('UserPlus')) {
    newContent = newContent.replace('import {', 'import { UserPlus,');
  }

  fs.writeFileSync(file, newContent, 'utf-8');
  console.log('Successfully modified blocks.');
} else {
  console.log('Blocks not found.');
}
