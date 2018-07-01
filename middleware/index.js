const middlewareObj = {},
    Campground = require("../models/campground"),
    Comment = require("../models/comment");

middlewareObj.checkCommentAuthorization = function (req, res, next) {
    if (req.isAuthenticated()) {
        Comment.findById(req.params.comment_id, function (err, comment) {
            if (err || !comment) {
                console.log(err);
                req.flash("error", "Comment not found...");
                res.redirect(`/campgrounds/${req.params.id}`);
            } else if (req.user.isAdmin || req.user._id.equals(comment.author.id)) {
                next();
            } else {
                req.flash("error", "You don't own this comment.")
                res.redirect(`/campgrounds/${req.params.id}`);
            }
        })
    } else {
        req.flash("error", "Permission Denied");
        res.redirect(`/campgrounds/${req.params.id}`);
    }
}

middlewareObj.checkCampAuthorization = function (req, res, next) {
    if (req.isAuthenticated()) {
        Campground.findById(req.params.id, function (err, campground) {
            if (err || !campground) {
                req.flash("error", "Campground not found...");
                console.log(err);
                res.redirect("/campgrounds");
            } else if (req.user.isAdmin || req.user._id.equals(campground.author.id)) {
                next();
            } else {
                req.flash("error", "You don't own this campground.");
                res.redirect(`/campgrounds/${req.params.id}`);
            }
        })
    } else {
        req.flash("error", "You don't have permission to do that.");
        res.redirect(`/campgrounds/${req.params.id}`);
    }
}


middlewareObj.isLoggedIn = function (req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        req.flash("error", "Please Login First");
        res.redirect("/login");
    }
}

module.exports = middlewareObj;