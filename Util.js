const fs = require("fs");

function rotateProxies(proxyListFile) {
  const proxyList = fs.readFileSync(proxyListFile, "utf8").split("\n");
  let currentIndex = 0;

  // Look for the next unused proxy
  while (currentIndex < proxyList.length) {
    const proxy = proxyList[currentIndex];
    if (!proxy.startsWith("-U-")) {
      // Parse the proxy string to get the IP, port, user, and password
      const [userpass, ipport] = proxy.split("@");
      const [user, pass] = userpass.split(":");
      // Return the proxy information as an object
      const proxyObj = { ipPort: ipport, user, pass };
      // Mark the proxy as used by adding "-U-" to the beginning of the line
      proxyList[currentIndex] = `-U-${proxy}`;
      fs.writeFileSync(proxyListFile, proxyList.join("\n"), "utf8");
      return proxyObj;
    } else {
      currentIndex++;
    }
  }

  // If all proxies have been used, start over from the beginning
  currentIndex = 0;
  return rotateProxies(proxyListFile);
}

async function goToPage(page, url) {
  await page.goto(url, {
    waitUntil: "networkidle2",
  });
}

function waitFor(delay) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

function aLongTime() {
  min = Math.ceil(16);
  max = Math.floor(42);
  var time = (Math.floor(Math.random() * (max - min + 1)) + min) * 60000;
  return time;
}
function getCurrentDateTime() {
  let now = new Date();

  let months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  let year = now.getFullYear();
  let month = months[now.getMonth()];
  let date = now.getDate().toString().padStart(2, "0");

  let hours = now.getHours();
  let minutes = now.getMinutes().toString().padStart(2, "0");
  let ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'

  return (
    month + " " + date + " " + year + " - " + hours + ":" + minutes + " " + ampm
  );
}
function determineFormatAndReturnWithSuffix(str) {
  if (!str || str.trim() === "") {
    return "";
  }

  // Extract the first matching "xs", "xm", "xh", "xd" format
  let timeFormatRegex = /(\d+(s|m|h|d))/;
  let match = str.match(timeFormatRegex);
  if (match) {
    return match[0] + " ago";
  }

  // Extract the first part that can be parsed as a date
  let dateRegex =
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})/;
  match = str.match(dateRegex);
  if (match) {
    return " on " + match[0];
  }

  // Throw error if neither condition is met
  throw new Error(
    `Input string "${str}" is neither in 'xs', 'xm', 'xh', 'xd' format nor a valid date.`
  );
}
function getStringBetweenDelimiters(source, delimiter1, delimiter2) {
  var start = source.indexOf(delimiter1);
  if (start === -1) {
    return null; // delimiter1 is not in the source
  }
  start += delimiter1.length; // start after the first delimiter

  var end = source.indexOf(delimiter2, start);
  if (end === -1) {
    return null; // delimiter2 is not in the source after delimiter1
  }

  return source.substring(start, end); // return the portion of source between the delimiters
}

function removeTwitterFromString(str) {
  var tw = "https://twitter.com";
  if (str.includes(tw)) {
    return str.replace(tw, "");
  } else {
    return str;
  }
}

function createOrAppendFile(path, dataToAdd) {
  fs.access(path, fs.constants.F_OK, (err) => {
    if (err) {
      // If file doesn't exist, write the new data
      fs.writeFile(path, JSON.stringify({ memories: dataToAdd }), (err) => {
        if (err) throw err;
        console.log("File created!");
      });
    } else {
      // If file exists, read the file and append the new data
      fs.readFile(path, "utf8", (err, fileData) => {
        if (err) throw err;
        let existingData = JSON.parse(fileData);
        existingData.memories.push(...dataToAdd);

        fs.writeFile(path, JSON.stringify(existingData), (err) => {
          if (err) throw err;
          console.log("File appended!");
        });
      });
    }
  });
}
exports.createOrAppendFile = createOrAppendFile;
exports.goToPage = goToPage;
exports.waitFor = waitFor;
exports.aLongTime = aLongTime;
exports.rotateProxies = rotateProxies;
exports.getCurrentDateTime = getCurrentDateTime;
exports.determineFormatAndReturnWithSuffix = determineFormatAndReturnWithSuffix;
exports.getStringBetweenDelimiters = getStringBetweenDelimiters;
exports.removeTwitterFromString = removeTwitterFromString;
