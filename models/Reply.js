const mongoose = require("mongoose");

const replySchema = new mongoose.Schema({
  from: {
    type: String,
  },
  question: {
    type: String,
  },
  answer: {
    type: String,
  },
});

const Reply = mongoose.model("Reply", replySchema);

module.exports = Reply;
