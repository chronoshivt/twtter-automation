const fs = require('fs');

function rotateProxies(proxyListFile) {
  const proxyList = fs.readFileSync(proxyListFile, 'utf8').split('\n');
  let currentIndex = 0;

  // Look for the next unused proxy
  while (currentIndex < proxyList.length) {
    const proxy = proxyList[currentIndex];
    if (!proxy.startsWith('-U-')) {
      // Parse the proxy string to get the IP, port, user, and password
      const [userpass, ipport] = proxy.split('@');
      const [user, pass] = userpass.split(':');
      // Return the proxy information as an object
      const proxyObj = { ipPort: ipport, user, pass };
      // Mark the proxy as used by adding "-U-" to the beginning of the line
      proxyList[currentIndex] = `-U-${proxy}`;
      fs.writeFileSync(proxyListFile, proxyList.join('\n'), 'utf8');
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

exports.goToPage = goToPage;
exports.waitFor = waitFor;
exports.aLongTime = aLongTime;
exports.rotateProxies = rotateProxies;
