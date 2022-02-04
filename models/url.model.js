const mongoose = require("mongoose");
const schema = mongoose.Schema;

const shortUrlSchema = new schema({
  url: {
    type: String,
    required: true,
  },
  shortId: {
    type: String,
    required: true,
  },
});

const shortUrl = mongoose.model("shortUrl", shortUrlSchema);

module.exports = shortUrl;
