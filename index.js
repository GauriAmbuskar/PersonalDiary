const express = require('express');
const app = express();
const path = require('path');

const userModel = require('./models/user');
const postModel = require('./models/post');

const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

app.set('view engine', 'ejs');

/* ===========================
        HOME
=========================== */

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/login', (req, res) => {
    res.render('login');
});

/* ===========================
        REGISTER
=========================== */

app.post('/register', async (req, res) => {

    try {

        const { username, name, email, age, password } = req.body;

        const existingUser = await userModel.findOne({ email });

        if (existingUser) {
            return res.send("User already exists");
        }

        const hash = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            username,
            name,
            email,
            age,
            password: hash
        });

        const token = jwt.sign(
            {
                userid: user._id,
                email: user.email
            },
            "shhhhhhhhh"
        );

        res.cookie("token", token);

        res.redirect('/profile');

    } catch (err) {

        console.log(err);
        res.status(500).send("Something went wrong");

    }

});

/* ===========================
        LOGIN
=========================== */

app.post('/login', async (req, res) => {

    try {

        const { email, password } = req.body;

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.send("Invalid Email or Password");
        }

        const result = await bcrypt.compare(password, user.password);

        if (!result) {
            return res.send("Invalid Email or Password");
        }

        const token = jwt.sign(
            {
                userid: user._id,
                email: user.email
            },
            "shhhhhhhhh"
        );

        res.cookie("token", token);

        res.redirect('/profile');

    } catch (err) {

        console.log(err);
        res.status(500).send("Something went wrong");

    }

});

/* ===========================
        LOGOUT
=========================== */

app.get('/logout', (req, res) => {

    res.clearCookie("token");

    res.redirect('/login');

});

/* ===========================
     AUTH MIDDLEWARE
=========================== */

function isLoggedIn(req, res, next) {

    if (!req.cookies.token) {
        return res.redirect('/login');
    }

    try {

        const data = jwt.verify(req.cookies.token, "shhhhhhhhh");

        req.user = data;

        next();

    } catch (err) {

        return res.redirect('/login');

    }

}

/* ===========================
        PROFILE
=========================== */

app.get('/profile', isLoggedIn, async (req, res) => {

    const user = await userModel
        .findById(req.user.userid)
        .populate("posts");

    res.render("profile", { user });

});

/* ===========================
      CREATE DIARY
=========================== */

app.post('/create', isLoggedIn, async (req, res) => {

    const { title, details } = req.body;

    const user = await userModel.findById(req.user.userid);

    const post = await postModel.create({

        title,
        details,
        user: user._id

    });

    user.posts.push(post._id);

    await user.save();

    res.redirect('/profile');

});

/* ===========================
      VIEW DIARY
=========================== */

app.get('/post/:id', isLoggedIn, async (req, res) => {

    const post = await postModel.findById(req.params.id);

    if (!post) {
        return res.send("Post not found");
    }

    if (post.user.toString() !== req.user.userid) {
        return res.status(403).send("Unauthorized");
    }

    res.render("show", { post });

});

/* ===========================
      EDIT PAGE
=========================== */

app.get('/edit/:id', isLoggedIn, async (req, res) => {

    const post = await postModel.findById(req.params.id);

    if (!post) {
        return res.send("Post not found");
    }

    if (post.user.toString() !== req.user.userid) {
        return res.status(403).send("Unauthorized");
    }

    res.render("edit", { post });

});

/* ===========================
      UPDATE DIARY
=========================== */

app.post('/edit/:id', isLoggedIn, async (req, res) => {

    const { title, details } = req.body;

    const post = await postModel.findById(req.params.id);

    if (!post) {
        return res.send("Post not found");
    }

    if (post.user.toString() !== req.user.userid) {
        return res.status(403).send("Unauthorized");
    }

    post.title = title;
    post.details = details;

    await post.save();

    res.redirect('/profile');

});

/* ===========================
      DELETE DIARY
=========================== */

app.post('/delete/:id', isLoggedIn, async (req, res) => {

    const post = await postModel.findById(req.params.id);

    if (!post) {
        return res.send("Post not found");
    }

    if (post.user.toString() !== req.user.userid) {
        return res.status(403).send("Unauthorized");
    }

    await userModel.findByIdAndUpdate(
        req.user.userid,
        {
            $pull: {
                posts: post._id
            }
        }
    );

    await postModel.findByIdAndDelete(post._id);

    res.redirect('/profile');

});

/* ===========================
        SERVER
=========================== */

app.listen(3000, () => {

    console.log("Server running on port 3000");

});