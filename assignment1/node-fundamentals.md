# Node.js Fundamentals

## What is Node.js?
Node.js is a runtime environment that lets you run JavaScript outside the browser, on your computer or a server.

## How does Node.js differ from running JavaScript in the browser?
Node is not a diffrent language, it is a diffrent environment for running JS.
Node doesnot have window, document or DOM. Node provides backend tools instead.
file system access
process information
environment variables
command-line arguments
networking API's
built-in modules like fs, http, path and os

## What is the V8 engine, and how does Node use it?
V8 is google's open source, high-performance JS and webAssembly engine. engine reads your JS and turns it into test-instructions the computer can run.

## What are some key use cases for Node.js?
web API's and servers
command-line tools
Real-time apps
Build tools and scripts

## Explain the difference between CommonJS and ES Modules. Give a code example of each.

**CommonJS (default in Node.js):**
```js
It uses synchronous loading through require() and exports tools using module.exports
```

**ES Modules (supported in modern Node.js):**
```js
It uses asynchronous loading with import and export statements.
``` 

CommonJS example:

function add(a, b) {
    return a + b;
}
module.exports = { add };

const { add } = require("./math.js");
console.log(add(2, 3));

ES Modules example:

export function add(a, b) {
    return a + b;
}

import { add } from "./math.js";
console.log(add(2, 3));

