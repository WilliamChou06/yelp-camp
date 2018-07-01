const express = require("express"),
    router = express.Router(),
    passport = require("passport"),
    async = require("async"),
    nodemailer = require("nodemailer"),
    crypto = require("crypto"),
    User = require("../models/user"),
    Campground = require("../models/campground");

router.get("/", function (req, res) {
    res.render("landing")
});

router.get("/register", function (req, res) {
    res.render("register", {
        page: "register"
    });
});

router.post("/register", function (req, res) {
    let newUser = new User({
        username: req.body.username,
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        avatar: req.body.avatar
    });
    if (req.body.adminCode == "secret123") {
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, function (err, user) {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function () {
                req.flash("success", `Welcome to YelpCamp, ${user.username}!!!`);
                res.redirect("/campgrounds");
            });
        }
    });
});

router.get("/login", function (req, res) {
    res.render("login", {
        page: "login"
    });
});

router.post("/login", passport.authenticate("local", {
    successRedirect: "/campgrounds",
    failureRedirect: "/login",
    failureFlash: true
}));

router.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/campgrounds");
});

router.get("/forgot", function (req, res) {
    res.render("forgot");
})

router.post("/forgot", function (req, res, next) {
    async.waterfall([
        function (done) {
            crypto.randomBytes(20, function (err, buf) {
                let token = buf.toString("hex");
                done(err, token)
            })
        },
        function (token, done) {
            User.findOne({
                email: req.body.email
            }, function (err, user) {
                if (!user) {
                    req.flash("error", "No account with that email exists");
                    res.redirect("/forgot");
                } else {
                    user.resetPasswordToken = token;
                    user.resetPasswordExpires = Date.now() + 3600000;
                    console.log(user.resetPasswordExpires)
                    user.save(function (err) {
                        done(err, token, user)
                    })
                }
            })
        },
        function (token, user, done) {
            let smtpTransport = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: "williamchoudev@gmail.com",
                    pass: process.env.gmail_password
                }
            });
            let mailOptions = {
                to: user.email,
                from: "williamchoudev@gmail.com",
                subject: "YelpCamp Password Reset",
                text: `This is a confirmation that your password has been successfully changed.`
            };
            smtpTransport.sendMail(mailOptions, function (err) {
                console.log("mail sent");
                req.flash("success", `Your password has successfully changed.`);
                done(err, "done");
            });
        }
    ], function (err) {
        if (err) return next(err);
        res.redirect("/forgot");
    })
})

router.get("/reset/:token", function (req, res) {
    User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {
            $gt: Date.now()
        }
    }, function (err, user) {
        if (!user) {
            req.flash("error", "Password reset token is invalid or has expired.");
            res.redirect("/forgot");
        } else {
            res.render("reset", {
                token: req.params.token
            })
        }
    })
})

router.post("/reset/:token", function (req, res) {
    async.waterfall([
        function (done) {
            User.findOne({
                resetPasswordToken: req.params.token,
                resetPasswordExpires: {
                    $gt: Date.now()
                }
            }, function (err, user) {
                if (!user) {
                    req.flash("error", "Password reset token is invalid or has expired.");
                    res.redirect("/forgot");
                } else if (req.body.password === req.body.confirm) {
                    user.setPassword(req.body.password, function (err) {
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;

                        user.save(function (err) {
                            req.logIn(user, function (err) {
                                done(err, user)
                            })
                        })
                    })
                } else {
                    req.flash("error", "Passwords do not match.");
                    res.redirect("back");
                }
            })
        },
        function (user, done) {
            let smtpTransport = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: "williamchoudev@gmail.com",
                    pass: process.env.gmail_password
                }
            });
            let mailOptions = {
                to: user.email,
                from: "williamchoudev@gmail.com",
                subject: "YelpCamp Password Reset",
                text: `You are receiving this because you (or someone else) have requested the reset of the password for your account 
                Please follow this link to complete the process 
                http://${req.headers.host}/reset/${req.params.token}/ 
                If you did not request this, please ignore this email and your password will remain unchanged.`
            };
            smtpTransport.sendMail(mailOptions, function (err) {
                console.log("mail sent");
                req.flash("success", `An e-mail has been sent to ${user.email} with further instructions.`);
                done(err, "done");
            });
        }
    ], function(err){
        res.redirect("/campgrounds");
    });
})

router.get("/users/:id", function(req, res){
    User.findById(req.params.id, function(err, user){
        if(err){
            req.flash("error", "User not found");
            res.redirect("/campgrounds");
        } else{
            Campground.find().where("author.id").equals(user._id).exec(function(err, campgrounds){
                if(err){
                    req.flash("error", "User not found");
                    res.redirect("/campgrounds");
                } else{
                    res.render("users/show", {user: user, campgrounds: campgrounds})
                }
            })
        }
    })
})

module.exports = router;