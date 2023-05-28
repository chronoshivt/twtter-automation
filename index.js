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
    user: "H7ZLEvd4oUxuskm5H5-res_sc-US_ILLINOIS",
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
  const cookieString = await fs.readFile("./cookies/howl-cookies.json");
  const cookies = JSON.parse(cookieString);
  await page.setCookie(...cookies);
  // // Connect to proxy
  await page.authenticate({
    username: proxy.user,
    password: proxy.pass,
  });
  await Util.goToPage(page, "about:blank");
  await Util.goToPage(page, "https://www.whatismyip.com/proxy-check/");

  // Blank slate
  // -----------------

  var CONTINOUS_MODE = false;
  const MAX_ITERATIONS = 4;
  var memory_blob;
  var ACTION_EXECUTING;
  let mission =
    "I am a crypto-rich accelerationist 19 year old kawaii girl. I am creative. i like to type in all lowercase and Sometimes capitalize words to be Quirky. i like to troll.";
  if (agentState === "initial") {
    console.log("mission:", mission);
    if (mission) {
      agentState = agent_states.perceiving;
    }
    // return;
  }
  // start state loop
  let i = 0;
  while (
    i < MAX_ITERATIONS &&
    (agentState !== null || agentState !== "initial")
  ) {
    console.log(`Global: Current state: ${agentState}`);
    i++;
    switch (agentState) {
      case agent_states.perceiving:
        console.log("Currently PERCEIVING...");
        memory_blob = await perceive();
        break;
      case agent_states.memory:
        // await this.logout();
        console.log("Currently accessing MEMORY...");
        // console.log("mem_blbo:", memory_blob);
        ACTION_EXECUTING = await memory(memory_blob, mission);
        memory_blob = null;
        break;
      case agent_states.acting:
        console.log("Currently executing an ACTION...");
        await act(ACTION_EXECUTING, mission);
        ACTION_EXECUTING = null;
        // await this.logout();
        break;
    }
  }

  async function perceive() {
    // GET ALL RELEVANT ENVIRONMENT INFORMATION TO THE AGENT
    var notifications;
    var status;
    var dms;
    // Make into memory stream string format

    // THE TIMELINE
    var the_timeline = "Timeline:\n";
    var scroll = await scroll_the_timeline(1);
    var tweet_mem_string = "";
    scroll.forEach(function (tw) {
      var when = Util.determineFormatAndReturnWithSuffix(tw["time"]);
      the_timeline += `[${tw["date"]}]- USER: ${tw["author"]} POSTED: "${tw["tweet"]}" ${when}. \n LINK:${tw["link"]} \n---\n`;
    });
    // the_timeline = `${tweet_mem_string}`;

    if (!the_timeline) return console.error("NO timeline from twitter");
    // Build memory stream programmatically
    var memory_stream = {
      timeline: the_timeline,
    };

    // console.log(memory_stream);
    // Check for situation?
    agentState = agent_states.memory;
    return memory_stream;
  }
  // returns memory stream segments
  async function memory(memory_blob, mission, situation) {
    // Take in action rewards+ env state summary?

    var background = mission
    if (!memory_blob)
      return console.error("No memory blob provided to memory()");
    // console.log("MEMORIES/EVENTS:", memory_blob);
    const splitter = new CharacterTextSplitter({
      separator: "\n---\n",
      chunkSize: 256,
      chunkOverlap: 64,
    });
    const docs = await splitter.createDocuments([memory_blob["timeline"]]);
    const directory = "./memory_stream";
     
      var loadedVectorStore;
      const files = await fs.readdir(directory);
      if (files.length > 0) {
          console.log('The directory has files.');
            loadedVectorStore = await HNSWLib.load(
            directory,
            new OpenAIEmbeddings()
          );
      } else {
          console.log('The directory is empty.');
          console.log('VectorStore does not exist');
          loadedVectorStore = await HNSWLib.fromDocuments(
          docs,
          new OpenAIEmbeddings()
        );
      }
    // const vectorStore = await HNSWLib.fromTexts(
    //   [memory_blob["timeline"]],
    //   [{ id: "docstore_" + Util.getCurrentDateTime() }],
    //   new OpenAIEmbeddings()
    // );
    // // Save the vector store to a directory

    // Load the vector store from the same directory
    
    // vectorStore and loadedVectorStore are identical
    var situation = "";

    const prompt = new PromptTemplate({
      template: `Use the provided user bio to extract 10 keywords from the 
      provided text titled B. Only return keywords found in Text B.
      Order the keywords from most relevant to least relevant separated by commas.
      Note that the content of the post should be should be more important than user's names when selecting words.
      Do not include words used in the user bio.

      User bio:{background}
      Text B:{memory_blob}

      Response format:
      <10 keywords comma separated>`,
      inputVariables: ["background", "memory_blob"],
    });

    var situation_prompt = await prompt.format({
      background: background,
      memory_blob: memory_blob["timeline"],
    });
    var situation_response = await model.call(situation_prompt);
    console.log("situation keywords", situation_response);
    // Retrieval function here
    // Retrieval(situation) returns memory stream segment relevant to situation
    // Pass to ranking prompt

    const memory_retrieval = await loadedVectorStore.similaritySearch(
      situation_response,
      2
    );
    console.log("result from memory QUERY:", memory_retrieval);
    var memory_ranking_string = "";
    var retrieved_memories = {};

    // const vectorStore = await HNSWLib.load(directory, new OpenAIEmbeddings());
    // // Load the docs into the vector store
    const updateMemories = await loadedVectorStore.addDocuments(docs);
    if (updateMemories)
      console.log("STORED UPDATED MEMORIES..", updateMemories);
    await loadedVectorStore.save(directory);

    var i = 0;
    memory_retrieval.forEach(function (mem) {
      i++;
      memory_ranking_string +=
        "mem_id " + i + ": " + mem["pageContent"] + "\n---\n";
      retrieved_memories[i] = {
        memories: mem["pageContent"],
        mem_id: i,
      };
    });
    console.log(memory_ranking_string);
    const prompt2 = new PromptTemplate({
      template: `Using the provided user bio and situation, analyze each of the 
      provided memories and give each of them a relevance, and importance score:

      Relevance is how pertinent the memory is to the given situation. Rate from
      0.00 to 1. With 0.00 being completely irrelevant to 1 being directly 
      about the topic.

      Importance is how important the memory is to the user in context with
      their bio and slightely less taking into account the situation. Rate from 
      1 - 10. 1 being extremely mundane to 10 being extremely poignant.

      User bio:{background},
      Situation:{situation},

      Memories:{memories}

      The response should an array containing objects.
      Only respond with a raw parse-able array full of JSON string objects:
        "memory":<mem_id number only>,
        "relevance":<0.00 to 1>,
        "importance":<1 to 10>`,
      inputVariables: ["memories", "background", "situation"],
    });

    var retrieval_prompt = await prompt2.format({
      memories: memory_ranking_string,
      background: background,
      situation: mission,
    });

    var retrieval_ranking = await model.call(retrieval_prompt);
    console.log("retrieval ranking:", retrieval_ranking);

    // Map ratings to retrieved memories
    JSON.parse(retrieval_ranking).forEach(function (ranking) {
      retrieved_memories[ranking["memory"]]["relevance"] = ranking["relevance"];
      retrieved_memories[ranking["memory"]]["importance"] =
        ranking["importance"];
    });
    var SEND_TO_ACTION = {
      situation_blob: memory_blob["timeline"],
      retrieved_memories: retrieved_memories,
      context: mission,
      reflection: "",
      planning: "",
    };
    // Make higher level planning

    // Make reflections
    const reflection_prompt = new PromptTemplate({
      template: `
      You are an AI social media account user tasked with running a character's account
      to have realistic interactions and persona.
      Using the provided context and the past memory stream do the following things:
      
      a. Reflect abstractly on the situation in context with past memories and make note of
      emotions, relationships with others, and goals. Reflections should be in first person,
      and take into consideration things important to the character as well as relationships.
      Append a Japanese kaomoji emoticon that describes the thought at the end of each.

      Context:{situation}
      Memories:{retrieved_memories}
      Background:{background}

      Use this response format only, 1 short paragraph each:
      THOUGHTS: <low level inner thoughts>,
      REFLECTIONS: <abstract high level and situational reflections>,
      REASONING: <reasoning for reflections, conclusions, feelings, emotions>
      CRITICISM: <criticisms of self, behavior, relationship etc.>
      PLANNING: <exploration of future short term and long term plans and goals>,
        `,
      inputVariables: ["situation", "retrieved_memories", "background"],
    });
    var reflections = await reflection_prompt.format({
      situation: memory_blob["timeline"],
      retrieved_memories: retrieved_memories,
      background: background,
    });
    let AGENT_REFLECTIONS = await model.call(reflections);

    // Higher level planning
    const planning_prompt = new PromptTemplate({
      template: `
      You are an AI social media account user tasked with running a character's account
      to have realistic interactions and persona. Write all responses in first person view of the character.
      Using the provided context and the past memory stream do the following things:
      
      a. Using the provided context, memories, and background texts,
      write, add, or change both long term and short term plans for the
      charcter to accomplish their goals. Plans should take into account
      past plans, as well as interactions, the context, and memories relevant to
      the characters goals. Take into account relevance and importance of memories to the character.

      Long term goals and plans can be more abstract and vague.
      Long term plans/goal examples: "Tweet more about x topic",

      Short term plans should be 1 or 2 immediate and actionable and are usually situational in response to the context. Be specific.
      Short term plan examples: "Respond to user @JohnDoe 'Thanks for the feedack!' ", "Tweet <x> opinion. ", "Retweet post <x> by user <y>"

      Context:{situation}
      Past Memories:{retrieved_memories}
      Character Background:{background}
      Use this response format only, 1 short paragraph each:
      LONG_TERM:<long term plan and/or goals the character has>,
      SHORT_TERM:<short term plan the character intends to execute>
        `,
      inputVariables: ["situation", "retrieved_memories", "background"],
    });
    var future_plans = await planning_prompt.format({
      situation: memory_blob["timeline"],
      retrieved_memories: retrieved_memories,
      background: background,
    });
    let AGENT_PLANNING = await model.call(future_plans);
    // Send to action
    // console.log("memory_planning_PROMPT", planning);
    // console.log("memory_planning", action);
    SEND_TO_ACTION["reflection"] = AGENT_REFLECTIONS;
    SEND_TO_ACTION["planning"] = AGENT_PLANNING;
    const planning_refelection_docs = await splitter.createDocuments([SEND_TO_ACTION["reflection"]+"\n"+SEND_TO_ACTION["planning"]]);
    const updateReflectionPlans = await loadedVectorStore.addDocuments(planning_refelection_docs);
    if (updateReflectionPlans)
      console.log("STORED UPDATED MEMORIES..", updateReflectionPlans);
    await loadedVectorStore.save(directory);

    console.log("ENYA:", SEND_TO_ACTION);

    // console.log("planning", AGENT_PLANNING, "reflections", AGENT_REFLECTIONS);
    agentState = agent_states.acting;
    return SEND_TO_ACTION;
    // Plan next tasks, plan next action. Make sure to re - evaluate.
  }

  async function act(data, mission) {
    // Check for continuous mode
    // If yes, continue to action
    // If no, ask for user input. Return to memory with user input.
    // Begin action,
    //
    var { situation_blob, retrieved_memories, context, reflection, planning } =
      data;
    const prompt = new PromptTemplate({
      template: `
      You are an AI roleplaying as a character and making decisions based
      on the provided information to execute actions.

      The information provided is defined below and should be considered
      when evaluating which action to take. If the action is interacting with another tweet, 
      make sure provide the tweet's link in your response.

      Context-This is an event stream of the characters current situation and state.
      Planning-These are short term and long term plans the character has made towards
      their goal. The short term plan should be taken into heavy consideration when 
      deciding an action.
      Reflections-These are reflections the character has made based on the current
      context.
      Memories-These are past memories stored in the characters head relevant to the situation,
      rated by relevance and importance. 
        'importance' is how impactful the memory is to the characters life, goals, and relationships
        'relevance' is how pertinent the memory is to the current situation.
      Use these ratings when considering memories to reference in final action evaluation.

      Context:{situation_blob}
      Planning:{planning}
      Reflections:{reflection}
      Memories: {retrieved_memories}
      Current mission:{mission}

      Choose from the following actions and provide it's exact name needed parameters in < >:
        ACTIONS: [
          TWEET:<string>,
          RETWEET:<tweet's link>,
          QUOTE_TWEET:<tweet's link> $ <quote tweet>,
          LIKE:<tweet's link>,
          REPLY:<tweet's link> $ <reply text>,
          FOLLOW/UNFOLLOW:<user @>
        ],
        
        Return only a raw JSON parse-able object of string keys with their values with
        following format:
        Response:
        {response_format}
        `,
      inputVariables: [
        "situation_blob",
        "planning",
        "reflection",
        "retrieved_memories",
        "mission",
        "response_format",
      ],
    });

    const action_prompt = await prompt.format({
      situation_blob: situation_blob,
      planning: planning,
      reflection: reflection,
      retrieved_memories: retrieved_memories,
      mission: mission,
      response_format: `{
        "ACTION":"<action+params>",
        "REASONING":"<reasoning>",
        "EXPECTED_REWARD":"<expected reward>"
      }`,
    });
    const act_res = await model.call(action_prompt);
    console.log("Action RESPONSE:",act_res);
    var ACTION_RESPONSE = JSON.parse(act_res.split(
      "Response:"
    )[1]);
    const inputQuestions = [
      {
        type: "list",
        name: "user_input",
        message: "Choose what to do:",
        choices: ["Confirm Action", "Enter Continous Mode", "Provide Feedback"],
      },
      //when choice continous is true, ask this question
      {
        type: "input",
        name: "continous",
        message: "How many loops to do:",
        when: (answers) => {
          if (answers.user_input === "Enter Continous Mode") {
            return true;
          }
        },
      },

      //when role is intern is true, ask this question
      {
        type: "input",
        name: "feedback",
        message: "Provide agent feedback:",
        when: (answers) => {
          if (answers.user_input === "Provide Feedback") {
            return true;
          }
        },
      },
    ];
    if (CONTINOUS_MODE == false) {
      var raw_action = ACTION_RESPONSE;

      var INQUIRER_RESP = await inquirer
        .prompt(inputQuestions)
        .then((answer) => {
          console.log("Inquirer responses:", answer);
          return answer;
        });
      console.log("RAW ACTION:", raw_action);
      if (INQUIRER_RESP.user_input === "Confirm Action") {
        // execute the action
        await executor(raw_action);
      } else if (INQUIRER_RESP.continous) {
        // Execute action,
        await executor(raw_action);
        // set continous mode loops
        CONTINOUS_MODE = INQUIRER_RESP.continous;
      } else if (INQUIRER_RESP.feedback) {
        // format user input,
        console.log("User returned feedback:" + INQUIRER_RESP.feedback);
        // Either send input back to memory,
        // or use it do decide immediate action.
      }
    } else {
      CONTINOUS_MODE--;
      if (CONTINOUS_MODE == 0) CONTINOUS_MODE = false;
      console.log("IN CONTINOUS MODE, LOOPS LEFT:" + CONTINOUS_MODE);
      // execute action
      await executor(raw_action);
    }
    // Gather immediate results, create expected results here????
    // Write reflection and planning to memory 
  }

  async function executor(RawAction) {
    var action = RawAction.ACTION;
    var action_split= action.split(":");
    var func = action_split[0];
     var data = action_split[1];
    if (!func || !data)
      return "ERROR: Improper or no func or data passed to executor";
    if (func === "TWEET") {
      console.log("AGENT TWEETING:" + data);
      await makeATweet(data);
    } else if (func === "RETWEET") {
      console.log("AGENT RETWEETING:" + data);
      await basicRetweet(data);
    } else if (func === "QUOTE_TWEET") {
      console.log("AGENT QUOTE-TWEETING:" + data);
      let link;
      let text;
      await quoteTweet(data);
    } else if (func === "LIKE") {
      console.log("AGENT LIKING:" + data);
      await likeTweet(data);
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

  async function basicRetweet(tweet) {}

  async function quoteTweet(tweet, quote) {}

  async function likeTweet(tweet) {}

  // -------------------------
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

  async function feed_data() {}

  await browser.close();
  console.timeEnd("whole task");
})();
