"use strict";

require("dotenv").config();
const moment = require("moment");
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
  let feed = await parser.parseURL(
    "http://www.enworld.org/forum/external.php?do=rss&type=newcontent&sectionid=1&days=120&count=20"
  );

  const Post = mongoose.model("Post");

  await Promise.all(
    feed.items.map(async item => {
      const { title, pubDate, link } = item;
      const url = link.replace(/-.*?$/, ""); // only match post ID

      const count = await Post.count({ url });
      if (count == 0) {
        const published_at = moment(pubDate).format("YYYY-MM-DD HH:mm:ss.SSS");
        const newPost = new Post({ title, published_at, url });
        await newPost.save();

        try {
          await tweet(`${title} ${url}`);
        } catch (err) {
          logError(err);
        }
      }
    })
  );

  res.end("Finished sending tweets.");
};
