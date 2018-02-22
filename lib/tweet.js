"use strict";

const Twitter = require("twitter");

const client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

module.exports = tweet => {
  if (process.env.NODE_ENV === "development") {
    console.info(`🐦 Tweeting: ${tweet}`);
  } else {
    client.post("statuses/update", { status: tweet });
  }
};
