const express = require("express"),
    router = express.Router(),
    Campground = require("../models/campground"),
    middleware = require("../middleware")
    multer = require("multer"),
    cloudinary = require('cloudinary');

const storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
const imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
const upload = multer({ storage: storage, fileFilter: imageFilter})

cloudinary.config({ 
  cloud_name: 'williamcwd', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});


router.get("/", function (req, res) {
    if (req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), "gi");
        Campground.find({name: regex}, function (err, allcampgrounds) {
            if (err) {
                console.log(err)
            } else if(allcampgrounds.length < 1){
                req.flash("error", "Campground Search not Found")
                res.redirect("/campgrounds");
            } else{
                res.render("campgrounds/index", {
                    campgrounds: allcampgrounds,
                    page: "campgrounds"
                });
            }
        })
    } else {
        Campground.find({}, function (err, allcampgrounds) {
            if (err) {
                console.log(err)
            } else {
                res.render("campgrounds/index", {
                    campgrounds: allcampgrounds,
                    page: "campgrounds"
                });
            }
        })
    }
})

router.post("/", middleware.isLoggedIn, upload.single("image"), function (req, res) {
    let newCampground = {
        name: req.body.campground.name,
        image: "",
        imageId: "",
        description: req.body.campground.description,
        created: Date.now(),
        price: req.body.campground.price,
        author: {
            username: req.user.username,
            id: req.user._id
        }
    };

    cloudinary.v2.uploader.upload(req.file.path, function(err, result){
        if(err){
            req.flash("error", err.message);
        }
        newCampground.image = result.secure_url;
        newCampground.imageId = result.public_id;

        Campground.create(newCampground, function (err, campground) {
            if (err) {
                console.log(err)
            } else {
                console.log(campground);
                res.redirect("/campgrounds");
            }
        });
    })

    
});

router.get("/new", middleware.isLoggedIn, function (req, res) {
    res.render("campgrounds/new");
});

router.get("/:id", function (req, res) {
    Campground.findById(req.params.id).populate("comments").exec(function (err, foundCampground) {
        if (err || !foundCampground) {
            req.flash("error", "Campground not found...");
            console.log(err);
            res.redirect("/campgrounds");
        } else {
            res.render("campgrounds/show", {
                campground: foundCampground
            });
        }
    })
});

router.get("/:id/edit", middleware.checkCampAuthorization, function (req, res) {
    Campground.findById(req.params.id, function (err, campground) {
        res.render(`campgrounds/edit`, {
            campground: campground
        });
    })

})

router.put("/:id", middleware.checkCampAuthorization, upload.single("image"), function (req, res) {
    Campground.findById(req.params.id, async function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else{
            if(req.file){
                try{
                    await cloudinary.v2.uploader.destroy(campground.imageId)
                    let result = await cloudinary.v2.uploader.upload(req.file.path);
                    campground.image = result.secure_url;
                    campground.imageId = result.public_id;
                } catch(err){
                    req.flash("error", err.message);
                    return res.redirect("back");
                }
            }
            campground.name = req.body.campground.name;
            campground.description = req.body.campground.description;
            campground.price = req.body.campground.price;
            campground.save();
            req.flash("success", "Campground Succesfully Edited!");
            res.redirect(`/campgrounds/${req.params.id}`);
        }

    })
});
    

router.delete("/:id", middleware.checkCampAuthorization, function (req, res) {
    Campground.findByIdAndRemove(req.params.id, function (err, deletedCampground) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect(`/campgrounds`);
        } 
        cloudinary.v2.uploader.destroy(deletedCampground.imageId);
        res.redirect("/campgrounds");
        
    })
})

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};



module.exports = router;