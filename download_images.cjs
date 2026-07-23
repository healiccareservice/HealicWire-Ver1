const https = require('https');
const fs = require('fs');
const path = require('path');

const ids = [
  "1576091160399-112ba8d25d1d",
  "1584036561584-b03c19ce876c",
  "1516549655169-df83a0774514",
  "1530497610208-b4bd518c983a",
  "1579684385127-1ef15d508118",
  "1581091226825-a6a2a5aee158",
  "1551076805-e16760c274f7",
  "1527613426441-4da17471b66d",
  "1505751172876-fa143ce4aeae",
  "1584308972272-9e4e7685e80f"
];

const dir = path.join(__dirname, 'public', 'images');

function downloadImage(id, idx) {
  return new Promise((resolve, reject) => {
    const url = `https://images.unsplash.com/photo-${id}?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`;
    const dest = path.join(dir, `${idx}.jpg`);
    const file = fs.createWriteStream(dest);

    https.get(url, (response) => {
      // Unsplash often redirects to another CDN domain.
      if (response.statusCode === 302 || response.statusCode === 301) {
        https.get(response.headers.location, (res2) => {
          res2.pipe(file);
          file.on('finish', () => {
            file.close(resolve);
          });
        }).on('error', reject);
      } else {
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      }
    }).on('error', reject);
  });
}

async function main() {
  for (let i = 0; i < ids.length; i++) {
    console.log(`Downloading image ${i}...`);
    try {
      await downloadImage(ids[i], i);
    } catch(e) {
      console.error(e);
    }
  }
  console.log('Done downloading images.');
}

main();
