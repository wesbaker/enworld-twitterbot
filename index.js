"use strict";

require("dotenv").config();

const Parser = require("rss-parser");
const parser = new Parser();

const mongoose = require("mongoose");
const moment = require("moment");

const tweet = require("./lib/tweet");

// Require model
require("./models/Post");

// Connect to mLab MongoDB
mongoose.connect(process.env.DATABASE).catch(err => console.error(err));

// Kick it off
(async () => {
  let feed = await parser.parseURL(
    "http://www.enworld.org/forum/external.php?do=rss&type=newcontent&sectionid=1&days=120&count=20"
  );

  const Post = mongoose.model("Post");

  feed.items.forEach(async item => {
    const { title, pubDate, link } = item;
    const url = link.replace(/-.*?$/, ""); // only match post ID
    const published_at = moment(pubDate).format("YYYY-MM-DD HH:mm:ss.SSS");

    const count = await Post.count({ url });
    if (count == 0) {
      // Create the post in mongodb
      const newPost = new Post({ title, published_at, url });
      await newPost.save();

      // Tweet the post
      try {
        await tweet(`${title} ${url}`);
      } catch (err) {
        console.error(err);
      }
    }
  });

  setTimeout(() => process.exit(), 10 * 1000); // ten seconds then exit
})();
