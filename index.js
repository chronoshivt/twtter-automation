console.log("Property of:");
const puppeteer = require("puppeteer");
const fs = require("fs").promises;
const asciify = require("asciify");
require("dotenv").config();
// GPT 3 stuff
const api_key = process.env.API_KEY;

const { Configuration, OpenAIApi } = require("openai");
const autowrong = require("autowrong");

const Util = require("./Util.js");

asciify("nean", { font: "jazmine", color: "red" }, function (err, res) {
  console.log(res);
});

(async () => {
  console.time("whole task");
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: {
      width: 1280,
      height: 1024,
    },
    args: [
      `--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148`,

      `--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36`,
      `--window-size=800,600`,
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
      "--disable-extensions",
      "--disable-component-extensions-with-background-pages",
      "--disable-default-apps",
      "--mute-audio",
      "--no-default-browser-check",
      "--autoplay-policy=user-gesture-required",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-notifications",
      "--disable-background-networking",
      "--disable-breakpad",
      "--disable-component-update",
      "--disable-domain-reliability",
      "--disable-sync",
      '--aggressive-cache-discard',
'--disable-cache',
'--disable-application-cache',
'--disable-offline-load-stale-cache',
'--disable-gpu-shader-disk-cache',
'--media-cache-size=0',
'--disk-cache-size=0',
    ],
  });
  const page = await browser.newPage();

  // Setting cookies for each account to avoid having to relog into Twitter.
  const cookieString = await fs.readFile("./cookies/howl-cookies.json");
  const cookies = JSON.parse(cookieString);
  await page.setCookie(...cookies);

  await Util.goToPage(page, "https://chronoshivt.com/");

  // Sign into Twitter. Only needs to be done once per cookies.
  async function signIn() {
    // Login
    console.time("signin");
    await Util.goToPage(page, "https://twitter.com/login");
    await page.type('div [autocomplete="username"]', "HOWLSMOVLNG");
    await Util.waitFor(4000);
    page.keyboard.press("Enter");
    await Util.waitFor(3000);
    await page.type('div [name="password"]', "getItGwizted72");
    await Util.waitFor(4000);
    page.keyboard.press("Enter");
    await page.waitForNavigation({ timeout: 120000 });

    console.timeEnd("signin");

    return;
  }

  // Makes a tweet
  async function makeATweet(tweet) {
    console.time("make a tweet");
    await Util.goToPage(page, "https://twitter.com/compose/tweet");
    await Util.waitFor(300);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    // await page.keyboard.press("Tab");
    await Util.waitFor(500);
    await page.keyboard.type(tweet, {
      delay: 125,
    });
    // page.keyboard.press("Tab");
    await Util.waitFor(2000);
    await page.keyboard.down("Control");
    await page.keyboard.press("Enter");
    await page.keyboard.up("Control");
    console.timeEnd("make a tweet");
    console.log("Tweeted out: " + tweet);
    await Util.waitFor(3000);
    await Util.goToPage(page, "https://chronoshivt.com/");
    return;
  }

  // Used to write a cookies file. Should be used after signing in.
  async function createCookies(fileName) {
    let file_name = fileName;
    const cookies = await page.cookies();
    await fs.writeFile(
      "./cookies/" + fileName + ".json",
      JSON.stringify(cookies, null, 2)
    );
    return;
  }

  // Scrape tweets from a profile
  async function grabTweets2(handle) {
    var fourTweets;
    var url = "https://twitter.com/" + handle;
    await Util.goToPage(page, url);
    fourTweets = await page.$$eval("article div[lang]", (tweets) => {
      return tweets.map((tweet) => tweet.textContent);
    });
    return fourTweets;
  }

  // saves the tweets from the given handle into the given json file
  async function SaveTweets(handle, file) {
    var daTweets = await grabTweets2(handle);
    await fs
      .readFile(file, "utf-8")
      .then((contents) => {
        var parsed = JSON.parse(contents);
        var combined = parsed.concat(daTweets);
        fs.writeFile(file, JSON.stringify(combined, null, " "));
      })
      .catch((err) => console.error(err));
  }

  //   Tweet a random tweet from the given tweet file.
  async function randomTweet(file) {
    var randomTweet;
    var randomNumber;
    var tweets;
    await fs.readFile(file, "utf-8").then((content) => {
      tweets = JSON.parse(content);
      randomNumber = Math.floor(Math.random() * tweets.length + 1);
    });
    randomTweet = tweets[randomNumber];
    await makeATweet(cutify(randomTweet));
  }

  // @params Array -  Array of handles to farm tweets from.
  // @params String -  Name of file to write tweets to.
  async function farmTweets(handles, file) {
    function printProgress(progress) {
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write("Farmed " + progress + " tweets so far.");
    }
    var totalTweetsFarmed = 0;
    for (const handle of handles) {
      var tweetArr = [];
      await Util.goToPage(page, "https://twitter.com/" + handle);
      for (let index = 0; index < 40; index++) {
        var tweetsBuffer = tweetArr;
        var thisScrolltweets = await page.$$eval(
          "article div[lang]",
          (tweets) => {
            return tweets.map((tweet) => tweet.textContent);
          }
        );
        tweetArr = tweetsBuffer.concat(thisScrolltweets);
        printProgress(tweetArr.length);
        await Util.waitFor(3000);
        await page.evaluate(() => {
          window.scrollBy(0, window.innerHeight);
          window.scrollBy(0, window.innerHeight);
          window.scrollBy(0, window.innerHeight);
          window.scrollBy(0, window.innerHeight);
          window.scrollBy(0, window.innerHeight);
          window.scrollBy(0, window.innerHeight);
        });
      }
      await Util.waitFor(1500);
      let cleanedArr = [...new Set(tweetArr)];

      let fileName = "./tweetsArchive/" + file;

      try {
        await fs.access(fileName);
        // The check succeeded
        console.log("File already exists");
        await fs
          .readFile(fileName, "utf-8")
          .then((contents) => {
            var parsed = JSON.parse(contents);
            var combined = parsed.concat(cleanedArr);
            fs.writeFile(fileName, JSON.stringify(combined, null, " "));
          })
          .catch((err) => {
            console.log(err);
          });
      } catch (error) {
        // The check failed
        await fs.writeFile(
          fileName,
          JSON.stringify(cleanedArr, null, " "),
          (err) => {
            if (err) throw err;
            console.log("File created");
          }
        );
      }

      totalTweetsFarmed += cleanedArr.length;
      console.log(
        " - DONE: " + handle + " : " + cleanedArr.length + " tweets farmed."
      );
    }
    console.log(
      "--Tweet farming completed. Farmed " +
        totalTweetsFarmed +
        " tweets in total."
    );
  }

  // Get the followers from an account
  async function getFollowers(handle) {
    var tweetsArr = [];
    var url = "https://twitter.com/" + handle + "/following";
    await Util.goToPage(page, url);
    await Util.waitFor(5000);
    for (let index = 0; index < 10; index++) {
      var fllwrList = tweetsArr;

      var currentFollowers = await page.$$eval(
        'div[data-testid="cellInnerDiv"] div[data-testid="UserCell"] a[role="link"] div[dir="ltr"] span',
        (followerz) => {
          return followerz.map((follower) =>
            follower.textContent.replace("@", "")
          );
        }
      );
      tweetsArr = fllwrList.concat(currentFollowers);
      await Util.waitFor(3000);
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
        window.scrollBy(0, window.innerHeight);
        window.scrollBy(0, window.innerHeight);
      });
    }
    let cleanedArr = [...new Set(tweetsArr)];
    await fs
      .readFile("./followers/following.json", "utf-8")
      .then((contents) => {
        var parsed = JSON.parse(contents);
        var combined = parsed.concat(cleanedArr);
        fs.writeFile(
          "./followers/following.json",
          JSON.stringify(combined, null, " ")
        );
      })
      .catch((err) => console.error(err));
    return tweetsArr;
  }

  function cutify(tweet) {
    var cutied = "";
    var res = "";
    const awOptions = { adjacent: 0.02, double: 0.01, order: 0.005 };

    // add typos
    if (Math.floor(Math.random() * 11) > 4) {
      console.log("cutied tweet incoming..");
      cutied = autowrong(tweet, awOptions);
    } else {
      cutied = tweet;
    }
    // add random capital letters
    var words = cutied.toLowerCase().split(" ");
    words.forEach((word) => {
      console.log(word);
      var phrase = res;
      var newWord;
      if (Math.floor(Math.random() * 11) > 7) {
        newWord = word.charAt(0).toUpperCase() + word.slice(1);
      } else {
        newWord = word;
      }
      res = phrase += " " + newWord;
    });

    return res;
  }

  //   Pull a random set of tweets for the ai to reference
  async function randomArrayOfTweets(file, filter) {
    let word_filter = filter;
    function removeDuplicates(arr) {
      let filteredArray = [];

      // Iterate over the original array
      for (let i = 0; i < arr.length; i++) {
        let element = arr[i];
        // Check if the element exists in the filtered array
        let index = filteredArray.indexOf(element);
        if (index === -1) {
          // If the element does not exist in the filtered array, add it
          filteredArray.push(element);
        }
      }

      return filteredArray;
    }

    var randomTweets = [];
    var randomNumber;
    var tweets;
    var randomnessArr = [];
    await fs.readFile(file, "utf-8").then((content) => {
      tweets = JSON.parse(content);
      for (let i = 0; i < 6; i++) {
        randomNumber = Math.floor(Math.random() * (tweets.length - 1));
        if (filter && tweets[randomNumber].includes(word_filter) == false) {
          i--;
          continue;
        }
        if (tweets[randomNumber].includes("http")) {
          i--;
          continue;
        }
        randomnessArr.push(randomNumber);
        randomTweets.push(tweets[randomNumber]+"\n");
      }
    });

    let finalArr = removeDuplicates(randomTweets);
    console.log(
      "Randomness: " + randomnessArr + "\n",
      "Example tweets: " + finalArr.length,
      finalArr
    );
    return finalArr;
  }

  // Remove duplicate tweets in a file STILL WIP
  async function cleanTweets() {
    var uniqueData;
    await fs
      .readFile("./tweetsArchive/waters/1028.json", "utf8")
      .then((content) => {
        tweets = JSON.parse(content);
        // Split the string into an array of strings, one for each line

        var uniqueLines = [];

        for (let i = 0; i < tweets.length; i++) {
          if (!uniqueLines.includes(tweets[i])) {
            // If it's not, add it to the array
            uniqueLines.push(tweets[i]);
          }
        }

        var uniqueData = uniqueLines;
        fs.writeFile(
          "./tweetsArchive/waters/1028cleaned.json",
          JSON.stringify(uniqueData, null, " ")
        );
      });
  }
async function combineAndShuffle(arr1, arr2) {

  const combinedArray = arr1.concat(arr2).map((element, index) => `tweet #${index}: ${element}`);
  for (let i = combinedArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combinedArray[i], combinedArray[j]] = [combinedArray[j], combinedArray[i]];
  }
  let stringTweets = combinedArray.join("\n");
  return stringTweets;

}
  
// Farming UnkleDell tweets

// let farmArr = [
//   "UnkleDell"
// ]

//   await farmTweets(farmArr,"UnkleDell.json");



  const configuration = new Configuration({
    apiKey: api_key,
  });
  const openai = new OpenAIApi(configuration);


 
  // add humor explanation
  // Also provide the tweet numbers from which material was sourced from to produce the shitpost and
  // the possible humor of it.\n
  // Give me the response in the following format:\n
  // shitpost:\n
  function removeHashtags(str) {
    return str.replace(/#[\w\d-]+/gi, '');
  }
  
  let GPT35Turbo = async (message) => {
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: message,
    });
  
    return response.data.choices[0].message.content;
  };
  // console.log("-----------------------")
  // console.log("GPT3.5-TURBO says: ", await GPT35Turbo(GPT35TurboMessage));
  for (let index = 0; index < 14; index++) {

    let shuffled = await combineAndShuffle(await randomArrayOfTweets("./tweetsArchive/miya-archive.json"),await randomArrayOfTweets("./tweetsArchive/UnkleDell.json","nigga"));

    console.log(1,shuffled);
  
     const GPT35TurboMessage = [
      { role: "system", content: `
      You are a helpful assistant tasked with producing quality shitposts for the user.\n
      The definition of the word shitpost is: In Internet culture, shitposting is the act of using an online forum or social media page to post content that is satirical and of "aggressively, ironically, and trollishly poor quality", an online analog of trash talk. Shitposts are intentionally designed to derail discussions or cause the biggest reaction with the least effort. Shitposts never contain hashtags.` },
      {
        role: "user",
        content: `Given the sample set of tweets provided below, use the contents from between 2 to 5 tweets as source material to write 1 original shitpost.
         The shitpost should be between 7 to 30 words in length.
          It must be completely lowercase, not contain ANY hashtags, and not be incoherent.
  
         `+'Sample tweets:\n'+JSON.stringify(shuffled)
      },
    ];

    let generated = removeHashtags(await GPT35Turbo(GPT35TurboMessage));

    console.log("Howl says: ", generated);
    await makeATweet(generated);
    var waitingFor = Util.aLongTime();
    console.log(
      "Waiting for " + waitingFor / 60000 + " minutes before tweeting again."
    );
    await Util.waitFor(waitingFor);
  }


  await browser.close();
  console.timeEnd("whole task");
})();
