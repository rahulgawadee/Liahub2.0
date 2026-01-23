const express = require("express");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");
const postController = require("../controllers/postController");
const { uploadMultiple, handleUploadError } = require("../middleware/upload");

const router = express.Router();

router.use(auth);

// Post CRUD
router.get("/feed", postController.listFeed);
router.get("/user/:userId", postController.listPostsByUser);
router.post("/", validate(postController.validateCreatePost()), postController.createPost);
router.post("/upload", uploadMultiple, handleUploadError, postController.uploadFiles);
router.put("/:postId", validate(postController.validateUpdatePost()), postController.updatePost);
router.delete("/:postId", postController.deletePost);

// Comments
router.post("/:postId/comments", validate(postController.validateAddComment()), postController.addComment);
router.delete("/:postId/comments/:commentId", validate(postController.validateDeleteComment()), postController.deleteComment);

// Reactions
router.post("/:postId/reactions", validate(postController.validateReaction()), postController.addReaction);
router.delete("/:postId/reactions", postController.removeReaction);

module.exports = router;
