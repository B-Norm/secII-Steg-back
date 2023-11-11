const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    stegName: {
      type: String,
      required: true,
    },
    file: {
      type: String,
      required: true,
    },
    mName: {
      type: String,
      required: true,
    },
    mSize: {
      type: Number,
      required: true,
    },
  },
  { collection: "files" }
);

const FileModel = mongoose.model("files", fileSchema);
module.exports = FileModel;
