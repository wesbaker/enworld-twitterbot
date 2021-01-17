import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  title: String,
  url: String,
  tweeted_at: {
    type: Date,
    default: Date.now,
  },
  published_at: Date,
});

export default mongoose.model("Post", postSchema);
