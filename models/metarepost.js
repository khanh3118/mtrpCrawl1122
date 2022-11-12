const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const metaRepostSchema = new Schema({
  data: [
    {
      name: String,
      members: [
        {
          member_name: String,
          member_items: [String],
          max_level: Boolean,
        },
      ],
      tier: String,
      avg_place: String,
      win_rate: String,
      top_4: String,
      contested: String,
    },
  ],
});

module.exports = mongoose.model("Metareport", metaRepostSchema);
