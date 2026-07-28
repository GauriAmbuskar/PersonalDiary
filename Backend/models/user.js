const mongoose = require('mongoose');

require("dotenv").config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

const userSchema = new mongoose.Schema({

    username: String,
    name: String,
    email: String,
    age: Number,
    password: String,

    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "post"
    }]

});

module.exports = mongoose.model("user", userSchema);