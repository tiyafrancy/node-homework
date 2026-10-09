const os = require('os');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs/promises');

const sampleFilesDir = path.join(__dirname, 'sample-files');
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}

// OS module

const cpus = os.cpus();
const cpuModel = cpus.length > 0 ? cpus[0].model : 'Unknown CPU';

console.log(`Platform: ${os.platform()}`);
console.log(`CPU: ${cpuModel}`);
console.log(`Total Memory: ${os.totalmem()}`);

// Path module

const joinedPath = path.join(__dirname, 'sample-files', 'folder', 'file.txt');
console.log(`Joined path: ${joinedPath}`);

// fs.promises API

async function handleFsPromises() {
  const demoFilePath = path.join(sampleFilesDir, 'demo.txt');

  try {
    await fsPromises.writeFile(demoFilePath, 'Hello from fs.promises!');
    const content = await fsPromises.readFile(demoFilePath, 'utf8');
    console.log(`fs.promises read: ${content}`);
  } catch (err) {
    console.log('Error handling fs.promises:', err.message);
  }
}


// Streams for large files- log first 40 chars of each chunk

function handleStreams() {
  const largeFilePath = path.join(sampleFilesDir, 'large.txt');

  fs.writeFileSync(largeFilePath, 'Hello from streams! '.repeat(20));

  const readStream = fs.createReadStream(largeFilePath, { encoding: 'utf8' });

  readStream.on('data', (chunk) => {
    console.log('Stream chunk start:', chunk.slice(0, 40));
  });

  readStream.on('error', (err) => {
    console.log('Stream read error:', err.message);
  });
}

async function runAll() {
  await handleFsPromises();
  handleStreams();
}

runAll();
