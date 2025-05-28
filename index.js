const http = require('http');
const fs = require('fs');
const zlib = require('zlib');
const { Transform } = require('stream');

class CustomStream extends Transform {
  _transform(chunk, encoding, callback) {
    const input = chunk.toString();
    const result = input
      .split('')
      .map(char => (/[a-zа-я]/i.test(char) && isNaN(char)) ? char.toUpperCase() : char)
      .join('');
    this.push(result);
    callback();
  }
}

const customStream = new CustomStream();
process.stdin.pipe(customStream).pipe(process.stdout);

const server = http.createServer((req, res) => {
  if (req.method === 'GET') {
    const cookieHeader = req.headers.cookie || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [k, v] = c.trim().split('=');
        return [k, v];
      })
    );
    const user = cookies['user_info'];

    res.writeHead(200, { 'Content-Type': 'application/json' });
    if (user === 'user1') {
      res.end(JSON.stringify({
        id: 1,
        firstName: 'Leanne',
        lastName: 'Graham'
      }));
    } else {
      res.end(JSON.stringify({}));
    }

  } else if (req.method === 'POST') {
    const gunzip = zlib.createGunzip();
    const outputPath = 'received.txt';
    const writeStream = fs.createWriteStream(outputPath);

    req.pipe(gunzip).pipe(writeStream);

    writeStream.on('finish', () => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('File received and unzipped successfully.');
    });

    writeStream.on('error', err => {
      res.writeHead(500);
      res.end('File writing error: ' + err.message);
    });
  } else {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
  }
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
  console.log('Enter text in the console to transform it in upper:');
});
