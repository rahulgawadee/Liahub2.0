const express = require("express");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");
const userController = require("../controllers/userController");
const uploadImages = require("../config/multerImages");

const router = express.Router();

router.use(auth);

// Search and list
router.get("/", validate(userController.validateSearchUsers()), userController.searchUsers);
router.get("/filters", userController.companyFilters);
router.get("/students", validate(userController.validateListStudents()), userController.listStudents);

// Username availability check
router.get("/check-username", validate(userController.validateCheckUsername()), userController.checkUsername);

// Profile management
router.get("/:userId", validate(userController.validateGetProfile()), userController.getProfile);
router.put("/:userId", validate(userController.validateUpdateProfile()), userController.updateProfile);
router.put("/:userId/sections/:section", validate(userController.validateUpdateSection()), userController.updateSection);

// Image uploads
router.post("/:userId/avatar", uploadImages.single("avatar"), userController.uploadAvatar);
router.post("/:userId/cover", uploadImages.single("cover"), userController.uploadCover);

// Followers and following
router.get("/:userId/followers", validate(userController.validateGetFollowers()), userController.getFollowers);
router.get("/:userId/following", validate(userController.validateGetFollowing()), userController.getFollowing);

// Follow/unfollow
router.post(
	"/:userId/follow",
	validate(userController.validateFollowToggle()),
	userController.followUser
);
router.delete(
	"/:userId/follow",
	validate(userController.validateFollowToggle()),
	userController.unfollowUser
);

module.exports = router;
