const fs = require('fs');
const path = require('path');

const sampleDirPath = path.join(__dirname, 'sample-files');
const sampleFilePath = path.join(sampleDirPath, 'sample.txt');

// Write a sample file for demonstration

if (!fs.existsSync(sampleDirPath)) {
  fs.mkdirSync(sampleDirPath, { recursive: true });
}
fs.writeFileSync(sampleFilePath, 'Hello, async world!');

// 1. Callback style

fs.readFile(sampleFilePath, 'utf8', (err, callbackContent) => {
  if (err) {
    console.log('File read failed:', err.message);
    return;
  }
  console.log(`Callback: ${callbackContent}`);


  // Callback hell example (test and leave it in comments):

  /*
  fs.readFile(sampleFilePath, 'utf8', (err, data1) => {
    fs.readFile(sampleFilePath, 'utf8', (err, data2) => {
      fs.readFile(sampleFilePath, 'utf8', (err, data3) => {
      });
    });
  });
  */


  // 2. Promise style

  function readTextFile(pathToFile) {
    return new Promise((resolve, reject) => {
      fs.readFile(pathToFile, 'utf8', (readErr, content) => {
        if (readErr) {
          reject(readErr);
          return;
        }
        resolve(content);
      });
    });
  }

  readTextFile(sampleFilePath)
    .then((promiseContent) => {
      console.log(`Promise: ${promiseContent}`);

      // 3. Async/Await style

      async function run() {
        try{
          const asyncContent = await readTextFile(sampleFilePath);
          console.log(`Async/Await: ${asyncContent}`);
        } catch (asyncErr) {
          console.log('An error occurred:', asyncErr.message);
        }
      }

      run();
    })
    .catch((promiseErr) => {
      console.log('An error occurred:', promiseErr.message);
    });
  });
