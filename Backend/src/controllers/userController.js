const { body, param, query } = require("express-validator");
const userService = require("../services/userService");

const buildUserSummary = (user) => {
  if (!user) return null;
  const plain = typeof user.toJSON === "function" ? user.toJSON() : user;
  return {
    id: plain.id || plain._id?.toString(),
    username: plain.username,
    email: plain.email,
    name: plain.name,
    roles: plain.roles,
    media: plain.media,  // Ensure media is included
    contact: plain.contact,
    social: plain.social,
    followerCount: plain.followerCount,
    followingCount: plain.followingCount,
    companyProfile: plain.companyProfile,
    schoolProfile: plain.schoolProfile,
    studentProfile: plain.studentProfile,
    staffProfile: plain.staffProfile,
  };
};

const validateSearchUsers = () => [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("entity")
    .optional()
    .isIn(["all", "student", "company", "school", "university"]),
  query("location").optional().isString(),
  query("industry").optional().isString(),
  query("search").optional().isString(),
  query("skills").optional().isString(),
];

const searchUsers = async (req, res, next) => {
  try {
    const skills = req.query.skills
      ? req.query.skills
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

    const result = await userService.searchUsers({
      search: req.query.search,
      entity: req.query.entity !== "all" ? req.query.entity : undefined,
      location: req.query.location !== "all" ? req.query.location : undefined,
      industry: req.query.industry !== "all" ? req.query.industry : undefined,
      skills,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const validateListStudents = () => [query("page").optional().isInt({ min: 1 }), query("limit").optional().isInt({ min: 1, max: 100 })];

const listStudents = async (req, res, next) => {
  try {
    const result = await userService.listStudents({
      organizationId: req.user.organization,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      search: req.query.search,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const validateUpdateProfile = () => [param("userId").isMongoId(), body().notEmpty()];

const updateProfile = async (req, res, next) => {
  try {
    const user = await userService.updateProfile(req.params.userId, req.body, req.user);
    res.json(buildUserSummary(user));
  } catch (error) {
    next(error);
  }
};

const validateFollowToggle = () => [param("userId").isMongoId()];

const followUser = async (req, res, next) => {
  try {
    const result = await userService.followUser({ followerId: req.user.id, followingId: req.params.userId });
    res.json({
      status: result.created ? "followed" : "unchanged",
      follower: buildUserSummary(result.follower),
      following: buildUserSummary(result.following),
    });
  } catch (error) {
    next(error);
  }
};

const unfollowUser = async (req, res, next) => {
  try {
    const result = await userService.unfollowUser({ followerId: req.user.id, followingId: req.params.userId });
    
    // Return updated counts for both users
    res.json({
      status: result.removed ? "unfollowed" : "unchanged",
      follower: buildUserSummary(result.follower), // Current user's updated counts
      following: buildUserSummary(result.following), // Unfollowed user's updated counts (followerCount decreased)
      unfollowedUserId: req.params.userId, // ID of the user who was unfollowed
    });
  } catch (error) {
    next(error);
  }
};

const validateCheckUsername = () => [
  query("username").isString().notEmpty().trim().isLength({ min: 3, max: 30 }),
];

const checkUsername = async (req, res, next) => {
  try {
    const result = await userService.checkUsernameAvailability(
      req.query.username,
      req.user.id
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const companyFilters = async (req, res, next) => {
  try {
    const result = await userService.getCompanyFilters();
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const validateGetProfile = () => [param("userId").isMongoId()];

const getProfile = async (req, res, next) => {
  try {
    const profile = await userService.getUserProfile(req.params.userId, req.user.id);
    res.json(profile);
  } catch (error) {
    next(error);
  }
};

const validateGetFollowers = () => [
  param("userId").isMongoId(),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
];

const getFollowers = async (req, res, next) => {
  try {
    const result = await userService.getFollowers(
      req.params.userId,
      Number(req.query.page) || 1,
      Number(req.query.limit) || 20
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const validateGetFollowing = () => [
  param("userId").isMongoId(),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
];

const getFollowing = async (req, res, next) => {
  try {
    const result = await userService.getFollowing(
      req.params.userId,
      Number(req.query.page) || 1,
      Number(req.query.limit) || 20
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const validateUpdateSection = () => [
  param("userId").isMongoId(),
  param("section").isIn(["personalInfo", "careerHighlights"]),
  body().notEmpty(),
];

const updateSection = async (req, res, next) => {
  try {
    const user = await userService.updateProfileSection(
      req.params.userId,
      req.params.section,
      req.body,
      req.user
    );
    res.json(user);
  } catch (error) {
    next(error);
  }
};

const validateUploadAvatar = () => [param("userId").isMongoId()];

const uploadAvatar = async (req, res, next) => {
  try {
    console.log('🔵 Avatar upload request received');
    console.log('  - User ID:', req.params.userId);
    console.log('  - File:', req.file ? req.file.filename : 'NO FILE');
    console.log('  - Request user:', req.user?.id);
    
    // Manual validation since multer runs before express-validator
    if (!req.params.userId || !req.params.userId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('❌ Invalid user ID');
      return res.status(400).json({ error: "Invalid user ID" });
    }

    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({ error: "No avatar file provided" });
    }

    const avatarUrl = `/uploads/images/${req.file.filename}`;
    console.log('📝 Saving avatar URL:', avatarUrl);
    
    const user = await userService.updateProfile(
      req.params.userId, 
      { media: { avatar: avatarUrl } }, 
      req.user
    );
    
    console.log('✅ Avatar uploaded successfully:', avatarUrl);
    console.log('✅ Updated user media:', user.media);
    
    res.json({ 
      avatar: avatarUrl, 
      user: buildUserSummary(user),
      message: 'Avatar uploaded successfully'
    });
  } catch (error) {
    console.error('❌ Avatar upload error:', error);
    next(error);
  }
};

const validateUploadCover = () => [param("userId").isMongoId()];

const uploadCover = async (req, res, next) => {
  try {
    console.log('🔵 Cover upload request received');
    console.log('  - User ID:', req.params.userId);
    console.log('  - File:', req.file ? req.file.filename : 'NO FILE');
    console.log('  - Request user:', req.user?.id);
    
    // Manual validation since multer runs before express-validator
    if (!req.params.userId || !req.params.userId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('❌ Invalid user ID');
      return res.status(400).json({ error: "Invalid user ID" });
    }

    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({ error: "No cover file provided" });
    }

    const coverUrl = `/uploads/images/${req.file.filename}`;
    console.log('📝 Saving cover URL:', coverUrl);
    
    const user = await userService.updateProfile(
      req.params.userId, 
      { media: { cover: coverUrl } }, 
      req.user
    );
    
    console.log('✅ Cover uploaded successfully:', coverUrl);
    console.log('✅ Updated user media:', user.media);
    
    res.json({ 
      coverImage: coverUrl, 
      user: buildUserSummary(user),
      message: 'Cover image uploaded successfully'
    });
  } catch (error) {
    console.error('❌ Cover upload error:', error);
    next(error);
  }
};

module.exports = {
  validateSearchUsers,
  searchUsers,
  validateListStudents,
  listStudents,
  validateUpdateProfile,
  updateProfile,
  validateFollowToggle,
  followUser,
  unfollowUser,
  validateCheckUsername,
  checkUsername,
  companyFilters,
  validateGetProfile,
  getProfile,
  validateGetFollowers,
  getFollowers,
  validateGetFollowing,
  getFollowing,
  validateUpdateSection,
  updateSection,
  validateUploadAvatar,
  uploadAvatar,
  validateUploadCover,
  uploadCover,
};
