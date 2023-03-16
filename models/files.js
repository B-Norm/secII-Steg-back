const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    stegName: {
      type: String,
      required: true,
    },
    file: {
      type: Array,
      required: true,
    },
    mName: {
      type: String,
      required: true,
    },
    mSkip: {
      type: Number,
      required: true,
    },
    mPeriod: {
      type: Array,
      required: true,
    },
  },
  { collection: "files" }
);

const FileModel = mongoose.model("files", fileSchema);
module.exports = FileModel;
