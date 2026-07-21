const https = require('https');
const fs = require('fs');
const path = require('path');

const tracks = [
  { id: 'peace', url: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/Kevin_MacLeod_-_Angevin_-_120_loop.ogg' },
  { id: 'court', url: 'https://upload.wikimedia.org/wikipedia/commons/5/52/Kevin_MacLeod_-_Virtutes_Instrumenti.ogg' },
  { id: 'intrigue', url: 'https://upload.wikimedia.org/wikipedia/commons/5/5b/Kevin_MacLeod_-_Sneaky_Snitch.ogg' },
  { id: 'war', url: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Kevin_MacLeod_-_Five_Armies.ogg' },
  { id: 'tragedy', url: 'https://upload.wikimedia.org/wikipedia/commons/4/43/Kevin_MacLeod_-_Grief_and_Despair.ogg' },
  { id: 'winter', url: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Kevin_MacLeod_-_Frost_Waltz.ogg' },
  { id: 'victory', url: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Kevin_MacLeod_-_Heroic_Age.ogg' }
];

const dir = path.join(__dirname, 'public', 'audio');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

async function download() {
  for (const track of tracks) {
    const dest = path.join(dir, track.id + '.ogg');
    console.log('Downloading ' + track.id + '...');
    await new Promise((resolve, reject) => {
      https.get(track.url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            https.get(res.headers.location, (res2) => {
                const file = fs.createWriteStream(dest);
                res2.pipe(file);
                file.on('finish', () => { file.close(); resolve(); });
            });
        } else {
            const file = fs.createWriteStream(dest);
            res.pipe(file);
            file.on('finish', () => { file.close(); resolve(); });
        }
      }).on('error', reject);
    });
  }
  console.log('Done!');
}

download().catch(console.error);
