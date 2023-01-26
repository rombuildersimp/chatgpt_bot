require("dotenv").config();

const express = require("express");

const mongoose = require("mongoose");

const Message = require("./models/Message");
const Reply = require("./models/Reply");

const { Telegraf } = require("telegraf");
const { Configuration, OpenAIApi } = require("openai");
// const chatGPT = import("chatgpt");

// Create a new bot instance using your Telegram bot token
const bot = new Telegraf(process.env.TOKEN);

// Initialize chatGPT with your API key
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const app = express();
app.use(express.static("public"));

// view engine
app.set("view engine", "ejs");

// Handle the /start command to greet the user and start the conversation
bot.start((ctx) => {
  ctx.reply("Hi! I'm a chatbot powered by ChatGPT, let's get started!");

  const msg = { user: ctx.from.username, text: ctx.message.text };

  // Save the message
  const message = new Message(msg);
  message.save((err) => {
    if (err) {
      console.log("Error: ", err);
    } else {
      console.log("Message saved!");
    }
  });

  // // Call ChatGPT to generate a response
  // chatGPT.generateResponse(ctx.message, async (response) => {
  //   // Send the response back to the user
  //   ctx.reply(response);
  // });
});

// bot.command("generate", async (ctx) => {
//   const arr = ctx.message.text.split(" ");
//   arr.shift();
//   const afterCommand = arr.join(" ");

//   const prompt = afterCommand;

//   const result = await openai.createImage({
//     prompt,
//     n: 1,
//     size: "256x256",
//     // size: "512x512",
//     // size: "1024x1024",
//   });

//   const url = result.data.data[0].url;

//   ctx.sendPhoto(url);
// });

bot.on("message", async (ctx) => {
  // const msg = { user: ctx.from.username, text: ctx.message.text };

  // // Save the message
  // const message = new Message(msg);
  // message.save((err) => {
  //   if (err) {
  //     console.log("Error: ", err);
  //   } else {
  //     console.log("Message saved!");
  //   }
  // });

  // console.log(msg);

  const completion = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: ctx.message.text,
    max_tokens: 256,
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });

  // Save the reply
  const reply = new Reply({
    from: ctx.from.username,
    question: ctx.message.text,
    answer: completion.data.choices[0].text,
  });
  reply.save((err) => {
    if (err) {
      console.log("Error: ", err);
    } else {
      console.log("Reply saved!");
    }
  });

  ctx.reply(reply.answer);

  console.log(reply.answer);
});

// Listen for any incoming messages from users and reply with a ChatGPT response
// bot.on("message", async (ctx) => {
//   // Call ChatGPT to generate a response

//   const completion = await openai.createCompletion({
//     model: "text-davinci-003",
//     prompt: ctx.message.text,
//     max_tokens: 256,
//     temperature: 0.7,
//     top_p: 1,
//     frequency_penalty: 0,
//     presence_penalty: 0,
//   });

//   // Send the response back to the user
//   ctx.reply(completion.data.choices[0].text);
//   console.log(completion.data.choices[0].text);
//   console.log(ctx.message.text);
// });

app.get("/", (req, res) => {
  res.render("home");
});
app.get("/replies", async (req, res) => {
  const replies = await Reply.find({});

  res.status(200).json(replies);
});

// Start your bot instance running on port 3000 of your server

mongoose
  .connect(process.env.MONGO_URI)
  .then((result) => {
    app.listen(3000, () => {
      console.log("Bot is connected to db and running on port: 3000!");
      bot.launch();
    });
  })
  .catch((err) => console.log(err));
