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
