// For testing twitter automation without bot

const readline = require("readline");
// Puppeteer config
// Stealth attachments
// const puppeteer = require("puppeteer");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
// langchain config
const { OpenAI } = require("langchain/llms/openai");
const { PromptTemplate } = require("langchain/prompts");
const { HNSWLib } = require("langchain/vectorstores/hnswlib");
const { OpenAIEmbeddings } = require("langchain/embeddings/openai");
const { CharacterTextSplitter } = require("langchain/text_splitter");
const { TextLoader } = require("langchain/document_loaders/fs/text");

const { JSONLoader } = require("langchain/document_loaders/fs/json");

// Other config
const cheerio = require("cheerio");
const fs = require("fs").promises;
const Util = require("./Util.js");
const asciify = require("asciify");
require("dotenv").config();
const autowrong = require("autowrong");
const inquirer = require("inquirer");

// OpenAI config
const { Configuration, OpenAIApi } = require("openai");
const api_key = process.env.API_KEY;
const configuration = new Configuration({
  apiKey: api_key,
});
const openai = new OpenAIApi(configuration);
const model = new OpenAI({
  openAIApiKey: api_key,
  temperature: 0.9,
});
// let GPT4Turbo = async (message) => {
//   const response = await openai.createChatCompletion({
//     model: "gpt-4",
//     messages: message,
//   });
//   return response.data.choices[0].message.content;
// };
console.log("Property of:");
asciify(
  "O_o Research",
  { font: "jazmine", color: "cyan" },
  function (err, res) {
    console.log(res);
  }
);

const agent_states = {
  initial: "initial",
  perceiving: "perceiving",
  memory: "memory",
  acting: "acting",
};
let agentState = agent_states.initial;
(async () => {
  // Configure proxy
  // const proxy = Util.rotateProxies("./proxies/proxies.txt");
  const proxy = {
    ipPort: "gw.thunderproxies.net:5959",
    user: "H7ZLEvd4oUxuskm5H5-res-ROW",
    pass: "rdA9xtg2qfcZAg1uwT",
  };
  // Launch browser
  console.time("whole task");
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: {
      width: 1280,
      height: 1024,
    },
    args: [
      `--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148`,
      `--proxy-server=${proxy.ipPort}`,
      `--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36`,
      `--window-size=800,600`,
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
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
      "--aggressive-cache-discard",
      "--disable-cache",
      "--disable-application-cache",
      "--disable-offline-load-stale-cache",
      "--disable-gpu-shader-disk-cache",
    ],
  });
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0);
  // Setting cookies for each account to avoid having to relog into Twitter.
  // const cookieString = await fs.readFile("./cookies/howl-cookies.json");
  // const cookies = JSON.parse(cookieString);
  // await page.setCookie(...cookies);
  // // Connect to proxy
  await page.authenticate({
    username: proxy.user,
    password: proxy.pass,
  });
  await Util.goToPage(page, "about:blank");
  await Util.goToPage(page, "https://www.whatismyip.com/proxy-check/");

  // Blank slate
  // -----------------

  async function executor(RawAction) {
    var action = RawAction.ACTION;
    var action_split = action.split(":");
    var func = action_split[0];
    var data = action_split[1];
    if (!func || !data)
      return "ERROR: Improper or no func or data passed to executor";
    if (func === "TWEET") {
      console.log("AGENT TWEETING:" + data);
      await makeATweet(data);
    } else if (func === "RETWEET") {
      console.log("AGENT RETWEETING:" + data);
      var link = Util.removeTwitterFromString(data.trim());
      await basicRetweet(link);
    } else if (func === "QUOTE_TWEET") {
      console.log("AGENT QUOTE-TWEETING:" + data);
      var datasplit = data.split("$");
      var link = Util.removeTwitterFromString(datasplit[0].trim());
      var text = datasplit[1];
      await quoteTweet(link, text);
    } else if (func === "LIKE") {
      console.log("AGENT LIKING:" + data);
      var link = Util.removeTwitterFromString(data.trim());
      await likeTweet(link);
    } else if (func === "REPLY") {
      console.log("AGENT REPLYING:" + data);
    } else if (func === "FOLLOW" || func === "UNFOLLOW") {
      console.log("AGENT UNFOLLOWING/FOLLOWING:" + data);
    }

    // Write action exection to memory;
  }

  async function makeATweet(tweet) {
    console.time("make a tweet");
    await Util.goToPage(page, "https://twitter.com/compose/tweet");
    await Util.waitFor(300);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
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
    await Util.goToPage(page, "about:blank");
    return;
  }

  async function basicRetweet(tweet) {
    await Util.goToPage(page, "https://twitter.com" + tweet);
    await Util.waitFor(3000);
    const links = await page.$$('div[aria-label="Retweet"]');
    await links[0].click(); // Clicks the following tab
    await Util.waitFor(2000);
    await page.keyboard.press("Enter");
  }

  async function quoteTweet(tweet, quote) {
    await Util.goToPage(page, "https://twitter.com" + tweet);
    await Util.waitFor(3000);
    const links = await page.$$('div[aria-label="Retweet"]');
    await links[0].click(); // Clicks the following tab
    await Util.waitFor(2000);
    await page.keyboard.press("Tab");
    await Util.waitFor(500);
    await page.keyboard.press("Enter");

    await page.keyboard.type(quote, {
      delay: 125,
    });
    await page.keyboard.down("Control");
    await page.keyboard.press("Enter");
    await page.keyboard.up("Control");
  }

  async function likeTweet(tweet) {
    await Util.goToPage(page, "https://twitter.com" + tweet);
    await Util.waitFor(3000);
    const links = await page.$$('div[aria-label="Like"]');
    await links[0].click(); // Clicks the following tab
    await Util.waitFor(3000);
  }

  async function replyToTweet(tweet, reply) {
    await Util.goToPage(page, "https://twitter.com" + tweet);
    await Util.waitFor(3000);
    const links = await page.$$('div[aria-label="Tweet text"]');
    console.log(links);
    await Util.waitFor(3000);
    await links[0].click(); // Clicks the following tab
    await Util.waitFor(3000);
    await page.keyboard.type(reply, {
      delay: 125,
    });
    await Util.waitFor(500);

    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await Util.waitFor(500);
    await page.keyboard.press("Enter");
    await Util.waitFor(3000);
    // await page.keyboard.down("Control");
    // await page.keyboard.press("Enter");
    // await page.keyboard.up("Control");
  }
  // -------------------------
  // Sign into Twitter. Only needs to be done once per cookies.
  async function signIn() {
    // Login
    console.time("signin");
    await Util.goToPage(page, "https://twitter.com/login");
    await Util.waitFor(20000);
    await page.$$('div [autocomplete="username"]');
    await page.type('div [autocomplete="username"]', "wobypass");
    await Util.waitFor(4000);
    page.keyboard.press("Enter");
    await Util.waitFor(3000);
    await page.type('div [name="password"]', "Neutulsa7715");
    await Util.waitFor(4000);
    page.keyboard.press("Enter");
    await page.waitForNavigation({ timeout: 120000 });
    await Util.waitFor(4000);
    console.timeEnd("signin");

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
      // process.stdout.clearLine();
      // process.stdout.cursorTo(0);
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);
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

  // Make tweet stylometry cute :3
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
        randomTweets.push(tweets[randomNumber] + "\n");
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

  // Combine two sets of tweets and shuffle them.
  async function combineAndShuffle(arr1, arr2) {
    const combinedArray = arr1
      .concat(arr2)
      .map((element, index) => `tweet #${index}: ${element}`);
    for (let i = combinedArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combinedArray[i], combinedArray[j]] = [
        combinedArray[j],
        combinedArray[i],
      ];
    }
    let stringTweets = combinedArray.join("\n");
    return stringTweets;
  }

  function parseHTML(htmlString) {
    // Create a new DOM parser
    var parser = new DOMParser();

    // Parse the HTML string into a document object
    var doc = parser.parseFromString(htmlString, "text/html");

    // Get all nodes in the document body
    var nodes = doc.body.getElementsByTagName("*");

    // Create an array to hold the output
    var output = [];

    // Iterate over all nodes
    for (var i = 0; i < nodes.length; i++) {
      // Only process nodes with text content (excluding whitespace)
      if (nodes[i].textContent.trim().length > 0) {
        // Create an object with the tag name and text content and add it to the array
        output.push({
          tag: nodes[i].tagName,
          text: nodes[i].textContent.trim(),
        });
      }
    }

    // Return the array of objects
    return output;
  }
  // Remove hashtags from a string
  function removeHashtags(str) {
    return str.replace(/#[\w\d-]+/gi, "");
  }

  async function scroll_the_timeline(amount) {
    if (!amount) return "Error: No amount to scroll provided";
    await Util.goToPage(page, "https://twitter.com/home");
    const links = await page.$$('a[href="/home"]');
    await links[3].click(); // Clicks the following tab
    await Util.waitFor(3000);
    var tweetArr = [];
    for (let index = 0; index < amount; index++) {
      var tweetsBuffer = tweetArr;
      var thisScrolltweets = await page.$$eval("article", (tweets) => {
        return tweets.map((tweet) => {
          return {
            text: tweet.textContent,
            innerHTML: tweet.innerHTML,
          };
        });
      });
      tweetArr = tweetsBuffer.concat(thisScrolltweets);
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
    var formatted_tweets = [];
    var now = Util.getCurrentDateTime();
    tweetArr.forEach(function (tweet_mess) {
      const $ = cheerio.load(tweet_mess.innerHTML);
      const yipee = {
        tweet: $("div[lang]").text(),
        author: $('div[data-testid="User-Name"] span').text(),
        time: $("time").text(),
        likes: $('div[data-testid="like"]').text(),
        retweets: $('div[data-testid="reply"]').text(),
        is_a_retweet: $('span[data-testid="socialContext"]').text(),
        date: now,
        link: $('div[data-testid="User-Name"] a[dir="ltr"]').attr("href"),
      };
      formatted_tweets.push(yipee);
    });
    // await createCookies("howl-cookies");
    return formatted_tweets;
  }

  async function feed_txt_file(data_path) {
    const splitter = new CharacterTextSplitter({
      separator: "\n---\n",
      chunkSize: 256,
      chunkOverlap: 64,
    });
    const directory = "./memory_stream";
    const loader = new JSONLoader(data_path);

    const docs = await loader.load();
    const files = await fs.readdir(directory);
    var loadedVectorStore;
    if (files.length > 0) {
      console.log("The directory has files.");
      loadedVectorStore = await HNSWLib.load(directory, new OpenAIEmbeddings());
      const updateMemories = await loadedVectorStore.addDocuments(docs);
      if (updateMemories)
        console.log("STORED UPDATED MEMORIES..", updateMemories);
      await loadedVectorStore.save(directory);
    } else {
      console.log("The directory is empty.");
      console.log("VectorStore does not exist");
      loadedVectorStore = await HNSWLib.fromDocuments(
        docs,
        new OpenAIEmbeddings()
      );
      await loadedVectorStore.save(directory);
    }
  }

async function manual_signIn(cookies) {
     // Login
     console.time("signin");
     await Util.goToPage(page, "https://twitter.com/login");
     await Util.waitFor(240000);
    console.log("5 mins left");
     await Util.waitFor(240000);

     console.timeEnd("signin");
     await createCookies(cookies);

     return;
}

await manual_signIn("wobypass");
console.log("completed"
)
// await makeATweet('whats guud')
await browser.close();
  console.timeEnd("whole task");
})();
