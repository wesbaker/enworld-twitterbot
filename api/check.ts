"use strict";

import dotenv from "dotenv";
import compareAsc from "date-fns/compareAsc";
import mongoose from "mongoose";
import Parser from "rss-parser";
import Raven from "raven";
import tweet from "../lib/tweet";
import "../models/Post";
import { ResponseData } from "twitter";
import { NowRequest, NowResponse } from "@vercel/node";

dotenv.config();
Raven.config(process.env.SENTRY_DSN).install();

const parser = new Parser();
mongoose
  .connect(process.env.DATABASE_URI || "", {
    dbName: process.env.DATABASE || "",
    auth: {
      user: process.env.DATABASE_USER || "",
      password: process.env.DATABASE_PASSWORD || "",
    },
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .catch(logError);

function logError(error: Error): void {
  if (process.env.NODE_ENV !== "development") {
    Raven.captureException(error);
  }
  console.error(error);
}

export default async (req: NowRequest, res: NowResponse): Promise<void> => {
  const feed = await parser
    .parseURL("https://www.enworld.org/ewr-porta/index.rss")
    .catch(logError);

  if (!feed) {
    return res.status(404).end("Feed not found.");
  }

  if (!feed.items || feed.items.length === 0) {
    return res.status(200).end("No tweets to send.");
  }

  const Post = mongoose.model("Post");

  const promises: Promise<void | ResponseData>[] = feed.items.map(
    async (item) => {
      const { title, pubDate = "", link: url } = item;

      const count = await Post.countDocuments({ url });
      if (count) return;

      const published_at = new Date(pubDate);
      const newPost = new Post({ title, published_at, url });
      await newPost.save();
      return tweet(`${title} ${url}`).catch(logError);
    }
  );

  await Promise.all(promises).catch(logError);

  // Delete all posts older than what's in the feed
  const oldestDate = feed.items
    .map(({ pubDate = "" }) => new Date(pubDate))
    .sort(compareAsc)[0];

  await Post.deleteMany({ published_at: { $lt: oldestDate } }).catch(logError);
  await Post.deleteMany({ url: null }).catch(logError);

  return res.status(200).end("Finished sending tweets.");
};
