const express = require("express"),
    app = express(),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    flash = require("connect-flash"),
    methodOverride = require("method-override"),
    passport = require("passport"),
    LocalStrategy = require("passport-local").Strategy,
    session = require("express-session"),
    User = require("./models/user"),
    port = process.env.port || 3000,
    seedDB = require("./seeds");
    
    require("dotenv").config();

// Requiring routes
const commentRoutes = require("./routes/comments"),
    campgroundRoutes = require("./routes/campgrounds"),
    indexRoutes = require("./routes/index");

app.use(session({
    secret: "Cats are so cute!",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(flash());
app.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    res.locals.moment = require("moment");
    next()
});

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(methodOverride("_method"));

app.set("view engine", "ejs");
app.use(indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);

mongoose.connect("mongodb://william:review123@ds125031.mlab.com:25031/wcyelpcamp");

app.use(express.static(__dirname + "/public"));
// seedDB();

app.listen(port, function () {
    console.log(`Server has started on port ${port}`);
})

