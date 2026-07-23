const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI)

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