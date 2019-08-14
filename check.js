"use strict";

require("dotenv").config();
const format = require("date-fns/format");
const mongoose = require("mongoose");
const Parser = require("rss-parser");
const Raven = require("raven");
const tweet = require("./lib/tweet");

Raven.config(process.env.SENTRY_DSN).install();
require("./models/Post");
const parser = new Parser();
mongoose.connect(process.env.DATABASE).catch(logError);

function logError(error) {
  if (process.env.NODE_ENV !== "development") {
    Raven.captureException(error);
  } else {
    console.error(error);
  }
}

module.exports = async (req, res) => {
  const feed = await parser
    .parseURL("https://www.enworld.org/ewr-porta/index.rss")
    .catch(logError);

  if (!feed) {
    return res.status(404).end("Feed not found.");
  }

  const Post = mongoose.model("Post");

  const promises = feed.items.map(async item => {
    const { title, pubDate, link } = item;

    const count = await Post.count({ url: link });
    if (count == 0) {
      const published_at = format(pubDate, "YYYY-MM-DD HH:mm:ss.SSS");
      const newPost = new Post({ title, published_at, link });
      await newPost.save();
      return tweet(`${title} ${link}`).catch(logError);
    } else {
      return null;
    }
  });

  await Promise.all(promises);

  res.status(200).end("Finished sending tweets.");
};
