const readline = require("readline");
const jsonfile = require("jsonfile");

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
const { JSONLoader } = require("langchain/document_loaders/fs/json");
const { StructuredOutputParser } = require("langchain/output_parsers");

// Other config
const cheerio = require("cheerio");
const fs = require("fs").promises;
const Util = require("./Util.js");
const asciify = require("asciify");
require("dotenv").config();
const autowrong = require("autowrong");
const inquirer = require("inquirer");
let config = require("./config.json");

// OpenAI config
const { Configuration, OpenAIApi } = require("openai");
const api_key = process.env.API_KEY;

const model = new OpenAI({
  modelName: "gpt-4",
  openAIApiKey: api_key,
  temperature: 0.9,
});
const modelgpt35 = new OpenAI({
  modelName: "gpt-3.5-turbo", // Defaults to "text-davinci-003" if no model provided.
  temperature: 0.9,
  openAIApiKey: api_key, // In Node.js defaults to process.env.OPENAI_API_KEY
});
console.log("Property of:");
asciify(
  "O_o Research",
  { font: "jazmine", color: "cyan" },
  function (err, res) {
    console.log(res);
  }
);

const __PROMPTS__ = {
  keywords: `Select 10 keywords/topics from the provided text titled 'B'.
    Follow these directions closely:
    Use the character bio, and user feedback (if any) to decide which words to select.
    Only choose words or names that would be relevant to the character.
    Only return words and content found in text 'B'.
    Order the keywords from most relevant to least relevant separated by commas.
    Do not include ANY words from the character bio or user feedback.
    
    Text B: {memory_blob}
    Character bio: {background}
    User feedback: {user_feedback}
    
    Response format:
    <10 keywords comma separated>`,
  mem_rankings: `Using the provided character bio and situation, analyze each of the 
    provided memories and give each of them a relevance, and importance score using
    the following definitions:
  
    Relevance is how pertinent the memory is to the given situation. Rate from
    0.00 to 1. With 0.00 being completely irrelevant to 1 being directly 
    about the situation.
  
    Importance is how important the memory is to the user in context with
    their bio, values, and ego, and slightely less taking into account the situation.
    Rate from 1 - 10. 1 being extremely mundane to 10 being extremely poignant.
  
    Character bio:{background},
    Situation:{situation},
  
    Rate the following memories:
    {memories}
  
    The response should an array containing objects.
    Only respond with a raw parse-able array full of JSON string objects:
      "memory":<mem_id number only>,
      "relevance":<0.00 to 1>,
      "importance":<1 to 10>`,
  planning: `You are an AI social media account user tasked with running a character's account
    to have realistic interactions and persona. Write all responses in first person view of the character.
    Using the provided context and the past memory stream do the following things:
    
    a. Using the provided context, memories, and background texts,
    write, add, or change both long term and short term plans for the
    charcter to accomplish their goals. Plans should take into account
    past plans, as well as interactions, the context, and memories relevant to
    the characters goals. Take into account relevance and importance of memories to the character.
  
    Long term goals and plans can be more abstract and vague.
    Long term plans/goal examples: "Tweet more about x topic",
  
    Short term plans should be 1 or 2 immediate and actionable and are usually situational in response to the context.
    Specify which tweets to interact with.
    {user_feedback}
    Context:{situation}
    Character Background: {background}
    Past Memories: {retrieved_memories}
  
    Use this response format only, 1 short paragraph each:
    LONG_TERM:<long term plan and/or goals the character has>,
    SHORT_TERM:<short term plan the character intends to execute>
      `,
  reflection: `You are a Twitter user tasked
  with running a character's account to have realistic interactions and persona.
  Using the provided context and the past retrieved memories do the following things:
  
  a. Reflect abstractly on the situation in context with past memories and make note of
  emotions, relationships with others, and goals. Reflections should be in first person,
  and take into consideration things important to the character as well as relationships.
  After each reflection, append a Japanese kaomoji emoticon that describes the thought.

  {user_feedback}
  Context:{situation}
  Memories:{retrieved_memories}
  Background:{background}

  Use this response format only, 1 short paragraph each:
  THOUGHTS: <low level inner thoughts>,
  REFLECTIONS: <abstract high level and situational reflections>,
  REASONING: <reasoning for reflections, conclusions, feelings, emotions>
  CRITICISM: <criticisms of self, behavior, relationship etc.>
    `,
  action: `
  Return an action and it's necessary inputs to execute while role-playing as the character from the
  given information defined below:
  Context - This is an event stream of the the characaters social media environment.
  Planning - These are short term and long term plans the character has made towards
  their goals. Short term plans may contain direct actions to execute. Follow short term plans closely.
  Memories - These are past memories the character has recalled relevant to the situation,
  rated by relevance and importance.
  'importance' is how impactful the memory is to the characters life, goals, and relationships
  'relevance' is how pertinent the memory is to the current situation.
  Use these ratings when considering memories to reference in final action evaluation and text generation.
  Character bio - Basic personality and idiosyncrasies of the character.

  Context: {situation_blob},
  Planning: {planning},
  Memories: {retrieved_memories},
  Character bio: {mission},

  Include the correct LINK to the tweet the action interacts with from the Context.\n
  Provide the exact action name from the list below and replace < > with necessary action parameters:
    ACTIONS: [
      TWEET:<string>,
      RETWEET:<link to tweet>,
      QUOTE_TWEET: <link to tweet> $ <quote string>,
      LIKE:<tweet to tweet>,
      REPLY: <link to tweet> $ <reply string>,
      FOLLOW/UNFOLLOW:<user @>
    ],
    \n
    {format_instructions}
    `,
};

const agent_states = {
  initial: "initial",
  perceiving: "perceiving",
  memory: "memory",
  acting: "acting",
};

// Start off as the intial state
let agentState = agent_states.initial;

// Proxy settings
const proxy = {
  ipPort: config.proxy.ipPort,
  user: config.proxy.user,
  pass: config.proxy.pass,
};
// const proxy = Util.rotateProxies("./proxies/proxies.txt");

(async () => {
  // Launch browser
  console.time("Whole Task Time:");
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
  const cookieString = await fs.readFile(config.cookies_path);
  const cookies = JSON.parse(cookieString);
  await page.setCookie(...cookies);
  // // Connect to proxy
  await page.authenticate({
    username: proxy.user,
    password: proxy.pass,
  });
  await Util.goToPage(page, "about:blank");
  await Util.goToPage(page, "https://www.whatismyip.com/proxy-check/");

  // ----------------
  // Blank slate
  // -----------------

  var CONTINOUS_MODE = false;
  const MAX_ITERATIONS = config.MAX_ITERATIONS;

  var memory_blob;
  var situation = false;
  var ACTION_EXECUTING;
  let mission = config.bio;

  if (agentState === "initial") {
    console.log("Mission:", mission);
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
    switch (agentState) {
      case agent_states.perceiving:
        console.log("Currently PERCEIVING...");
        memory_blob = await perceive();
        break;
      case agent_states.memory:
        console.log("Currently accessing MEMORY...");
        ACTION_EXECUTING = await memory(memory_blob, mission, situation);
        break;
      case agent_states.acting:
        console.log("Currently executing an ACTION...");
        await act(ACTION_EXECUTING, mission);
        ACTION_EXECUTING = null;
        break;
    }
    i++;
  }

  async function perceive() {
    try {
      // GET ALL RELEVANT ENVIRONMENT INFORMATION TO THE AGENT
      var notifications;
      var status;
      var dms;
      // Make into memory stream string format
      let scroll = await scroll_the_timeline(1);
      if (!scroll || scroll.length === 0)
        return console.error("NO timeline from twitter");

      let the_timeline = scroll.map((tw) => {
        let when = Util.determineFormatAndReturnWithSuffix(tw["time"]);
        return {
          tweet_body: tw["tweet"],
          author: tw["author"],
          link: tw["link"],
          when: when,
          date: tw["date"],
        };
      });

      // Build memory blob
      let memory_stream = {
        timeline: the_timeline,
      };

      // Check for situation?
      agentState = agent_states.memory;
      return memory_stream;
    } catch (error) {
      console.error("Error while scrolling the timeline: ", error);
    }
  }

  // async function perceive() {
  //   // GET ALL RELEVANT ENVIRONMENT INFORMATION TO THE AGENT
  //   var notifications;
  //   var status;
  //   var dms;
  //   // Make into memory stream string format
  //   var the_timeline = [];
  //   var scroll = await scroll_the_timeline(1);
  //   scroll.forEach(function (tw) {
  //     var when = Util.determineFormatAndReturnWithSuffix(tw["time"]);
  //     // the_timeline.push(
  //     //   `[${tw["date"]}] - TWEET: ${tw["author"]}: "${tw["tweet"]}" ${when}. \n LINK:${tw["link"]}\n-+-`
  //     // );
  //     the_timeline.push({
  //       tweet_body: tw["tweet"],
  //       author: tw["author"],
  //       link: tw["link"],
  //       when: when,
  //       date: tw["date"],
  //     });
  //   });

  //   if (!the_timeline) return console.error("NO timeline from twitter");
  //   // Build memory blob
  //   var memory_stream = {
  //     timeline: the_timeline,
  //   };
  //   // console.log(memory_stream);
  //   // Check for situation?
  //   agentState = agent_states.memory;
  //   return memory_stream;
  // }

  // returns memory stream segments
  async function memory(memory_blob, mission, situation) {
    // Take in action rewards+ env state summary?
    if (!memory_blob)
      return console.error("No memory blob provided to memory()");

    const MEMORY_DIRECTORY = "./memory";
    const files = await fs.readdir(MEMORY_DIRECTORY + "/vectorstore");
    var background = mission;
    var loadedVectorStore;

    var MEMORY_BLOB_STRING = "";
    memory_blob["timeline"].forEach((__tweet) => {
      MEMORY_BLOB_STRING += `\n-+-\n
      TWEET:${__tweet["tweet_body"]}
      AUTHOR:${__tweet["author"]}
      LINK:${__tweet["link"]}`;
    });

    console.log("MEMORYBLOBSTRING", MEMORY_BLOB_STRING);
    // Check if memory is empty
    if (files.length > 1) {
      console.log("Seems like a vector Memory exists,");
      loadedVectorStore = await HNSWLib.load(
        MEMORY_DIRECTORY + "/vectorstore",
        new OpenAIEmbeddings()
      );
    } else {
      console.log("vector Memory directory is empty, creating a new one");
      loadedVectorStore = await HNSWLib.fromTexts(
        ["My first memory was.. it was.."],
        [{ id: Util.getCurrentDateTime() }],
        new OpenAIEmbeddings()
      );
    }
    const prompt = new PromptTemplate({
      template: __PROMPTS__.keywords,
      inputVariables: ["background", "memory_blob", "user_feedback"],
    });
    var user_feedback = situation ? "User feedback: " + situation : "";
    console.log("User feedback? :", user_feedback);
    var situation_prompt = await prompt.format({
      background: background,
      memory_blob: MEMORY_BLOB_STRING,
      user_feedback: situation,
    });
    var situation_response = await modelgpt35.call(situation_prompt);
    console.log("---\nKeywords extracted: ", situation_response);
    // Retrieval function here
    // Retrieval(situation) returns memory stream segment relevant to situation
    // Pass to ranking prompt
    const memory_retrieval = await loadedVectorStore.similaritySearch(
      situation_response,
      4
    );
    // console.log("Result from memory QUERY:", memory_retrieval);
    var memory_ranking_string = "";
    var retrieved_memories = {};

    await write_to_memory(MEMORY_DIRECTORY, memory_blob, loadedVectorStore);

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
    // console.log("RETRIEVED MEMORIES:",memory_ranking_string);
    const prompt2 = new PromptTemplate({
      template: __PROMPTS__.mem_rankings,
      inputVariables: ["memories", "background", "situation"],
    });

    var retrieval_prompt = await prompt2.format({
      memories: memory_ranking_string,
      background: background,
      situation: mission,
    });

    var retrieval_ranking = await modelgpt35.call(retrieval_prompt);
    // Map ratings to retrieved memories
    JSON.parse(retrieval_ranking).forEach(function (ranking) {
      retrieved_memories[ranking["memory"]]["relevance"] = ranking["relevance"];
      retrieved_memories[ranking["memory"]]["importance"] =
        ranking["importance"];
    });
    console.log("RETRIEVED MEMORIES + RANKINGS:", retrieved_memories);
    var SEND_TO_ACTION = {
      situation_blob: MEMORY_BLOB_STRING,
      retrieved_memories: retrieved_memories,
      context: mission,
      reflection: "",
      planning: "",
    };
    // Make higher level planning

    // Make reflections
    const reflection_prompt = new PromptTemplate({
      template: __PROMPTS__.reflection,
      inputVariables: [
        "situation",
        "retrieved_memories",
        "background",
        "user_feedback",
      ],
    });
    var reflections = await reflection_prompt.format({
      situation: MEMORY_BLOB_STRING,
      retrieved_memories: retrieved_memories,
      background: background,
      user_feedback: user_feedback,
    });
    let AGENT_REFLECTIONS = await model.call(reflections);

    // Higher level planning
    const planning_prompt = new PromptTemplate({
      template: __PROMPTS__.planning,
      inputVariables: [
        "situation",
        "retrieved_memories",
        "background",
        "user_feedback",
      ],
    });
    var future_plans = await planning_prompt.format({
      situation: MEMORY_BLOB_STRING,
      retrieved_memories: retrieved_memories,
      background: background,
      user_feedback: user_feedback,
    });
    let AGENT_PLANNING = await model.call(future_plans);
    // Send to action
    // console.log("memory_planning_PROMPT", planning);
    // console.log("memory_planning", action);
    SEND_TO_ACTION["reflection"] = AGENT_REFLECTIONS + "-+-";
    SEND_TO_ACTION["planning"] = AGENT_PLANNING + "-+-";

    await write_to_memory(
      MEMORY_DIRECTORY,
      {
        reflection: [{ mem: SEND_TO_ACTION["reflection"] }],
        planning: [{ mem: SEND_TO_ACTION["planning"] }],
      },
      loadedVectorStore
    );

    console.log(
      "ACTION PLANNING+ REFLECTIONS:",
      AGENT_PLANNING,
      AGENT_REFLECTIONS
    );

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
    const parser = StructuredOutputParser.fromNamesAndDescriptions({
      action: "action and parameters to execute",
      reason: "reasoning for choosing action",
    });
    const formatInstructions = parser.getFormatInstructions();

    var { situation_blob, retrieved_memories, context, reflection, planning } =
      data;
    const prompt = new PromptTemplate({
      template: __PROMPTS__.action,
      inputVariables: [
        "situation_blob",
        "planning",
        "retrieved_memories",
        "mission",
      ],
      partialVariables: { format_instructions: formatInstructions },
    });

    const action_prompt = await prompt.format({
      situation_blob: situation_blob,
      planning: planning,
      reflection: reflection,
      retrieved_memories: retrieved_memories,
      mission: mission,
    });

    const act_res = await model.call(action_prompt);
    console.log("Action RESPONSE:", act_res);
    var ACTION_RESPONSE = await parser.parse(act_res);
    // User input questions
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
        let user_feedback_memory =
          `USER FEEDBACK: The user has provided the following feedback
        to the action you've chosen:\n` + INQUIRER_RESP.feedback;
        situation = user_feedback_memory;
        agentState = agent_states.memory;
        return;
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
    situation = "";
    agentState = agent_states.perceiving;
    return;
  }

  async function write_to_memory(path, memories, vectordb) {
    var MEM_STRING_BLOB = "";
    // Get current mem stream
    var mem_stream = JSON.parse(
      await fs.readFile(path + "/mem_stream.json", "utf8", (err) => {
        if (err) throw err;
      })
    );
    Object.keys(memories).forEach(async function (key) {
      console.log(key + " -> " + memories[key]);

      memories[key].forEach((ind_mem) => {
        if (key == "timeline") {
          MEM_STRING_BLOB += `\n-+-\n
            TWEET:${ind_mem["tweet_body"]}
            AUTHOR:${ind_mem["author"]}
            LINK:${ind_mem["link"]}`;
        } else if (key == "planning" || key == "relflection") {
          MEM_STRING_BLOB += `\n-+-\n
          ${ind_mem["mem"]}
            `;
        }
      });

      // Add to mem stream array and write to file
      mem_stream.memories.push(...memories[key]);
      await fs.writeFile(
        path + "/mem_stream.json",
        JSON.stringify(mem_stream),
        (err) => {
          if (err) throw err;
          console.log("Mem stream appended");
        }
      );
    });
    // Write to vector DB
    const text = MEM_STRING_BLOB;
    const splitter = new CharacterTextSplitter({
      separator: "-+-",
      chunkSize: 140,
      chunkOverlap: 24,
    });
    const docs = await splitter.createDocuments([text]);

    const updateMemories = await vectordb.addDocuments(docs);
    if (updateMemories)
      console.log("UPDATED memories to vector_memory:", updateMemories);
    await vectordb.save(path + "/vectorstore");
    return;
    // return status
  }

  async function executor(RawAction) {
    const action = RawAction;
    const func = action.action;
    let reason = action.reason;
    if (!func || !reason)
      return "ERROR: Improper or no func or data passed to executor";

    var action_name = func.split(":")[0];
    var action_params = func.split(":")[1];
    // Remove < and > characters from data, if present
    action_params = action_params.replace(/<|>/g, "");

    // Log the action and remove twitter from data string
    console.log(`AGENT ${action_name}ing: ${action_params}`);
    if (["RETWEET", "LIKE"].includes(action_name)) {
      action_params = Util.removeTwitterFromString(action_params.trim());
    }

    // Define link and text variables once if they're needed
    let link, text;
    if (["QUOTE_TWEET", "REPLY"].includes(action_name)) {
      [link, text] = action_params.split("$");
      link = Util.removeTwitterFromString(link.trim());
    }

    switch (action_name) {
      case "TWEET":
        await makeATweet(action_params);
        break;
      case "RETWEET":
        await basicRetweet(action_params);
        break;
      case "QUOTE_TWEET":
        await quoteTweet(link, text);
        break;
      case "LIKE":
        await likeTweet(action_params);
        break;
      case "REPLY":
        await replyToTweet(link, text);
        break;
      case "FOLLOW":
      case "UNFOLLOW":
        // do something for FOLLOW and UNFOLLOW
        break;
      default:
        console.log(`No valid action was provided.`);
    }

    // Write action history execution to memory
  }

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
    await Util.waitFor(5000);
    const links = await page.$$('a[href="/home"]');
    console.log("SCROLLING THE TL LINKS:", links);
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

  async function feed_data() {}

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

  await browser.close();
  console.timeEnd("whole task");
})();
