const express = require("express"),
    router = express.Router({
        mergeParams: true
    }),
    Campground = require("../models/campground"),
    Comment = require("../models/comment"),
    middleware = require("../middleware");

router.get("/new", middleware.isLoggedIn, function (req, res) {
    Campground.findById(req.params.id, function (err, campground) {
        if (err) {
            console.log(err);
        } else {
            res.render("comments/new", {
                campground: campground
            });
        }
    })
})

router.post("/", middleware.isLoggedIn, function (req, res) {
    Campground.findById(req.params.id, function (err, campground) {
        if (err) {
            console.log(err)
        } else {
            Comment.create(req.body.comment, function (err, comment) {
                if (err) {
                    console.log(err);
                } else {
                    comment.author.username = req.user.username;
                    comment.author.id = req.user._id;
                    comment.created = Date.now();
                    comment.save();
                    campground.comments.push(comment);
                    campground.save();
                    req.flash("success", "Comment created!");
                    res.redirect(`/campgrounds/${req.params.id}`);
                }
            })
        }
    })
})

router.get("/:comment_id/edit", middleware.checkCommentAuthorization, function (req, res) {
    Campground.findById(req.params.id, function (err, campground) {
        if (err || !campground) {
            console.log(err);
            req.flash("error", "Campground 404");
            res.redirect(`/campgrounds/${req.params.id}`);
        } else {
            Comment.findById(req.params.comment_id, function (err, comment) {
                if (err) {
                    console.log(err)
                } else {
                    res.render("comments/edit", {
                        campground_id: req.params.id,
                        comment: comment
                    })
                }
            })
        }
    })

})

router.put("/:comment_id", middleware.checkCommentAuthorization, function (req, res) {
    Comment.findByIdAndUpdate(req.params.comment_id, {
        $set: req.body.comment
    }, function (err, updatedComment) {
        if (err) {
            console.log(err)
        } else {
            res.redirect(`/campgrounds/${req.params.id}`)
        }
    })
})

router.delete("/:comment_id", middleware.checkCommentAuthorization, function (req, res) {
    Comment.findByIdAndRemove(req.params.comment_id, function (err, deletedComment) {
        if (err) {
            console.log(err)
        } else {
            req.flash("success", "Comment succesfully deleted!")
            res.redirect(`/campgrounds/${req.params.id}`);
        }
    })
})

module.exports = router;