const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: String,
  url: String,
  tweeted_at: {
    type: Date,
    default: Date.now
  },
  published_at: Date
});

module.exports = mongoose.model("Post", postSchema);
