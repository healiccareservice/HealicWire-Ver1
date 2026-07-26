const fs = require('fs');

const path = 'src/initial_db.ts';
let lines = fs.readFileSync(path, 'utf8').split('\n');

// 1. initialArticles ends at line 620 (index 619). We will insert provider articles before it.
// Wait, index 619 is "];". So we replace index 619 with "," + provider articles + "];"

// 2. The provider articles are from line 698 to 1187 (indices 697 to 1186).
// BUT wait, line 1187 is "  }" (index 1186).
// And line 1188 is "];"
// And line 1189 is "];"
// And line 1190 is ""

// The provider articles are at indices 697 to 1186. Let's extract them.
const providerArticlesLines = lines.slice(697, 1187);
const providerArticlesStr = providerArticlesLines.join('\n');

// 3. Remove the provider articles from the end of the file.
// The file should end with the end of initialHospitalAlerts.
// initialHospitalAlerts ends on line 697 (index 696). 
// Index 696 is "  }"

// We want initialHospitalAlerts to end with "  }\n];\n"

// So lines up to index 696 are kept.
let newLines = lines.slice(0, 697);
newLines.push('];');

// Now, we need to insert `providerArticlesStr` into `initialArticles`.
// initialArticles ends at index 619, which is "];".
// We will replace index 619 with:
// "  },"
// + providerArticlesStr
// + "];"

// Wait, the line before 619 is "  }". Let's just insert a comma at index 618, and then insert provider articles.
const index619 = newLines.indexOf('];');
if (index619 !== -1 && index619 < 650) {
    // This is the end of initialArticles.
    // The previous line is "  }"
    if (newLines[index619 - 1] === '  }') {
        newLines[index619 - 1] = '  },';
    } else if (newLines[index619 - 1] === '    }') {
        newLines[index619 - 1] = '    },';
    }
    
    // Insert providerArticles
    newLines.splice(index619, 0, providerArticlesStr);
}

fs.writeFileSync(path, newLines.join('\n'));
console.log("Fixed!");
