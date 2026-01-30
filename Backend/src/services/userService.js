const mongoose = require("mongoose");
const User = require("../models/User");
const Follow = require("../models/Follow");
const Connection = require("../models/Connection");
const ROLES = require("../constants/roles");
const { roleHasPermission } = require("../constants/permissions");
const { PERMISSIONS } = require("../constants/permissions");

const ENTITY_ROLE_MAP = {
  student: [ROLES.STUDENT],
  company: [
    ROLES.COMPANY_EMPLOYER,
    ROLES.COMPANY_HIRING_MANAGER,
    ROLES.COMPANY_FOUNDER,
    ROLES.COMPANY_CEO,
  ],
  school: [ROLES.SCHOOL_ADMIN, ROLES.EDUCATION_MANAGER, ROLES.TEACHER],
  university: [ROLES.UNIVERSITY_ADMIN, ROLES.UNIVERSITY_MANAGER],
};

const BASE_PROJECTION =
  "username email roles name contact media social studentProfile staffProfile companyProfile followerCount followingCount";

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildSearchFilters = ({ search, entity, location, industry, domain, skills }) => {
  const filters = [{ status: { $ne: "suspended" } }];

  if (entity && ENTITY_ROLE_MAP[entity]) {
    filters.push({ roles: { $in: ENTITY_ROLE_MAP[entity] } });
  }

  if (location) {
    const regex = new RegExp(escapeRegex(location), "i");
    filters.push({
      $or: [
        { "contact.location": regex },
        { "companyProfile.city": regex },
        { "companyProfile.country": regex },
      ],
    });
  }

  if (industry) {
    const regex = new RegExp(escapeRegex(industry), "i");
    filters.push({ "companyProfile.industries": regex });
  }

  if (domain) {
    const regex = new RegExp(escapeRegex(domain), "i");
    filters.push({ "companyProfile.companyDomain": regex });
  }

  if (Array.isArray(skills) && skills.length) {
    filters.push({
      $or: [
        { "studentProfile.skills": { $in: skills } },
        { "companyProfile.industries": { $in: skills } },
        { "staffProfile.experiences.title": { $in: skills } },
      ],
    });
  }

  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    filters.push({
      $or: [
        { username: regex },
        { email: regex },
        { "name.first": regex },
        { "name.last": regex },
        { "social.bio": regex },
        { "social.about": regex },
        { "companyProfile.companyName": regex },
        { "studentProfile.specializations": regex },
        { "studentProfile.skills": regex },
      ],
    });
  }

  if (filters.length === 1) return filters[0];
  return { $and: filters };
};

const listStudents = async ({ organizationId, page = 1, limit = 20, search }) => {
  const query = { roles: { $in: ["student"] } };
  if (organizationId) query.organization = organizationId;
  if (search) {
    query.$or = [
      { "name.first": new RegExp(search, "i") },
      { "name.last": new RegExp(search, "i") },
      { username: new RegExp(search, "i") },
      { email: new RegExp(search, "i") },
    ];
  }

  const [items, total] = await Promise.all([
    User.find(query).skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(query),
  ]);

  return { items, total, page, pages: Math.ceil(total / limit) };
};

const searchUsers = async ({ search, entity, location, industry, skills, page = 1, limit = 20 }) => {
  const numericLimit = Math.min(Number(limit) || 20, 100);
  const numericPage = Math.max(Number(page) || 1, 1);
  const query = buildSearchFilters({ search, entity, location, industry, skills });

  const [items, total] = await Promise.all([
    User.find(query)
      .select(BASE_PROJECTION)
      .skip((numericPage - 1) * numericLimit)
      .limit(numericLimit)
      .sort({ followerCount: -1, createdAt: -1 }),
    User.countDocuments(query),
  ]);

  return {
    items,
    total,
    page: numericPage,
    pages: Math.max(Math.ceil(total / numericLimit), 1),
    limit: numericLimit,
  };
};

const getCompanyFilters = async () => {
  const match = {
    status: { $ne: "suspended" },
    $or: [
      { entity: "company" },
      { roles: { $in: ENTITY_ROLE_MAP.company } },
      { "companyProfile.companyName": { $exists: true } },
    ],
  };

  const companies = await User.find(match)
    .select("contact.location companyProfile.city companyProfile.country companyProfile.industries companyProfile.companyDomain")
    .lean();

  const locationSet = new Set();
  const industrySet = new Set();
  const domainSet = new Set();

  companies.forEach((company) => {
    const locations = [
      company?.contact?.location,
      company?.companyProfile?.city,
      company?.companyProfile?.country,
    ]
      .filter(Boolean)
      .map((loc) => loc.trim())
      .filter(Boolean);

    locations.forEach((loc) => locationSet.add(loc));

    if (Array.isArray(company?.companyProfile?.industries)) {
      company.companyProfile.industries
        .filter(Boolean)
        .map((ind) => ind.trim())
        .filter(Boolean)
        .forEach((ind) => industrySet.add(ind));
    }

    if (company?.companyProfile?.companyDomain) {
      domainSet.add(company.companyProfile.companyDomain.trim());
    }
  });

  return {
    locations: Array.from(locationSet).sort(),
    industries: Array.from(industrySet).sort(),
    domains: Array.from(domainSet).sort(),
  };
};

const listConnections = async (userId) => {
  const connections = await Connection.find({
    $or: [{ requester: userId }, { recipient: userId }],
    status: "accepted",
  })
    .populate("requester", "username name media roles social")
    .populate("recipient", "username name media roles social")
    .sort({ updatedAt: -1 });

  return connections;
};

const recalcFollowStats = async (userIds = []) => {
  const uniqueIds = Array.from(
    new Set(
      userIds
        .filter(Boolean)
        .map((id) => id.toString())
    )
  );

  const results = await Promise.all(
    uniqueIds.map(async (id) => {
      const [followerCount, followingCount] = await Promise.all([
        Follow.countDocuments({ following: id }),
        Follow.countDocuments({ follower: id }),
      ]);

      const user = await User.findByIdAndUpdate(
        id,
        { followerCount, followingCount },
        { new: true, select: `${BASE_PROJECTION} followerCount followingCount` }
      );

      return user;
    })
  );

  const map = new Map();
  results.forEach((user) => {
    if (user) map.set(user.id, user);
  });
  return map;
};

const followUser = async ({ followerId, followingId }) => {
  if (followerId.toString() === followingId.toString()) {
    throw Object.assign(new Error("Cannot follow yourself"), { status: 400 });
  }

  const result = await Follow.updateOne(
    { follower: followerId, following: followingId },
    { $setOnInsert: { follower: followerId, following: followingId } },
    { upsert: true }
  );

  if (result.upsertedCount === 0) {
    const stats = await recalcFollowStats([followerId, followingId]);
    return {
      created: false,
      follower: stats.get(followerId.toString()) || null,
      following: stats.get(followingId.toString()) || null,
    };
  }

  const stats = await recalcFollowStats([followerId, followingId]);
  return {
    created: true,
    follower: stats.get(followerId.toString()) || null,
    following: stats.get(followingId.toString()) || null,
  };
};

const unfollowUser = async ({ followerId, followingId }) => {
  const result = await Follow.deleteOne({ follower: followerId, following: followingId });

  if (result.deletedCount === 0) {
    const stats = await recalcFollowStats([followerId]);
    return {
      removed: false,
      follower: stats.get(followerId.toString()) || null,
      following: null,
    };
  }

  const stats = await recalcFollowStats([followerId, followingId]);
  return {
    removed: true,
    follower: stats.get(followerId.toString()) || null,
    following: stats.get(followingId.toString()) || null,
  };
};

const toPlainObject = (value) => {
  if (!value) return {};
  if (typeof value.toObject === "function") {
    return value.toObject();
  }
  return value;
};

const mergeNested = (existing = {}, incoming = {}) => {
  const source = toPlainObject(existing);
  const result = { ...source };

  Object.entries(incoming || {}).forEach(([key, val]) => {
    if (val !== undefined) {
      result[key] = typeof val === "string" ? val.trim() : val;
    }
  });

  return result;
};

const normalizeNameInput = (nameInput) => {
  if (!nameInput) return null;
  if (typeof nameInput === "string") {
    const parts = nameInput.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) {
      return { first: "", last: "" };
    }
    const [first, ...rest] = parts;
    return { first, last: rest.join(" ") };
  }

  const first = (nameInput.first || "").trim();
  const last = (nameInput.last || "").trim();
  return { first, last };
};

const updateProfile = async (userId, data, requester) => {
  if (!requester) {
    throw Object.assign(new Error("Not authorized"), { status: 403 });
  }

  // Platform or school admins can manage any user
  const isAdmin = roleHasPermission(requester.roles, PERMISSIONS.MANAGE_USERS);

  // Education managers can update students and their own education manager profile only
  const isEducationManager = requester.roles?.includes('education_manager') || requester.primaryRole === 'education_manager';

  if (requester.id !== userId) {
    if (isAdmin) {
      // allowed
    } else if (isEducationManager) {
      // education managers may only edit students
      const targetUser = await User.findById(userId).select('roles');
      if (!targetUser) throw Object.assign(new Error('User not found'), { status: 404 });
      const targetIsStudent = targetUser.roles?.includes('student');
      if (!targetIsStudent) {
        throw Object.assign(new Error('Not authorized to edit this user'), { status: 403 });
      }
    } else {
      throw Object.assign(new Error('Not authorized'), { status: 403 });
    }
  }

  const allowedFields = [
    "name",
    "contact",
    "media",
    "social",
    "studentProfile",
    "staffProfile",
    "companyProfile",
  ];

  const currentUser = await User.findById(userId);
  if (!currentUser) {
    throw Object.assign(new Error("User not found"), { status: 404 });
  }

  const update = {};

  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      if (field === "name") {
        const normalizedName = normalizeNameInput(data[field]);
        if (normalizedName) {
          update.name = mergeNested(currentUser.name, normalizedName);
        }
      } else if (field === "media" || field === "contact" || field === "social") {
        update[field] = mergeNested(currentUser[field], data[field]);
        if (field === "media") {
          console.log('📸 Updating media field:');
          console.log('  - Current media:', JSON.stringify(currentUser[field]));
          console.log('  - Incoming media:', JSON.stringify(data[field]));
          console.log('  - Merged media:', JSON.stringify(update[field]));
        }
      } else if (data[field] !== undefined) {
        update[field] = data[field];
      }
    }
  });

  if (!Object.keys(update).length) {
    return currentUser;
  }

  if (update.contact && typeof update.contact.website === "string") {
    const website = update.contact.website;
    if (website && !/^https?:\/\//i.test(website)) {
      update.contact.website = `https://${website}`;
    }
  }

  if (update.social && typeof update.social.handle === "string") {
    update.social.handle = update.social.handle.replace(/^@+/, "").trim();
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: update },
    { new: true, runValidators: true }
  ).select(BASE_PROJECTION);

  // If company profile was updated, sync to organization
  if (update.companyProfile && updatedUser.roles.some(role => role.startsWith('company_'))) {
    const { ensureOrganization } = require('./authService');

    // Check if company name changed and update student records
    const oldCompanyName = currentUser.companyProfile?.companyName;
    const newCompanyName = update.companyProfile.companyName || updatedUser.companyProfile?.companyName;

    if (oldCompanyName && newCompanyName && oldCompanyName !== newCompanyName) {
      // Company name changed - update all student records with the old company name
      const SchoolRecord = require('../models/SchoolRecord');
      try {
        await SchoolRecord.updateMany(
          {
            type: 'student',
            'data.placement': { $regex: new RegExp(`^\\s*${oldCompanyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i') }
          },
          {
            $set: { 'data.placement': newCompanyName }
          }
        );
        console.log(`Updated student records: changed company name from "${oldCompanyName}" to "${newCompanyName}"`);
      } catch (error) {
        console.error('Failed to update student records with new company name:', error);
        // Don't fail the profile update if student record updates fail
      }
    }

    const companyFields = {
      companyPhone: update.companyProfile.companyPhone || updatedUser.companyProfile?.companyPhone,
      website: update.companyProfile.website || updatedUser.companyProfile?.website,
      city: update.companyProfile.city || updatedUser.companyProfile?.city,
      country: update.companyProfile.country || updatedUser.companyProfile?.country,
      companyRegNo: update.companyProfile.companyRegNo || updatedUser.companyProfile?.companyRegNo,
      contactPerson: update.companyProfile.contactPerson || updatedUser.companyProfile?.contactPerson,
      roles: update.companyProfile.roles || updatedUser.companyProfile?.roles,
    };

    try {
      await ensureOrganization({
        entity: 'company',
        organizationName: update.companyProfile.companyName || updatedUser.companyProfile?.companyName || currentUser.companyProfile?.companyName,
        email: updatedUser.email,
        companyFields,
      });
    } catch (error) {
      console.error('Failed to sync company profile to organization:', error);
      // Don't fail the profile update if organization sync fails
    }
  }

  return updatedUser;
};

const checkUsernameAvailability = async (username, currentUserId) => {
  const existingUser = await User.findOne({ username });
  
  if (!existingUser) {
    return { available: true };
  }
  
  if (existingUser._id.toString() === currentUserId) {
    return { available: true, current: true };
  }
  
  return { available: false };
};

const getUserProfile = async (userId, requesterId) => {
  const user = await User.findById(userId).select(BASE_PROJECTION);
  
  if (!user) {
    throw Object.assign(new Error("User not found"), { status: 404 });
  }

  // Check follow status
  let isFollowing = false;
  let isFollower = false;
  let isConnection = false;

  if (requesterId && requesterId !== userId) {
    const [followCheck, followerCheck, connectionCheck] = await Promise.all([
      Follow.exists({ follower: requesterId, following: userId }),
      Follow.exists({ follower: userId, following: requesterId }),
      Connection.exists({
        $or: [
          { requester: requesterId, recipient: userId, status: "accepted" },
          { requester: userId, recipient: requesterId, status: "accepted" },
        ],
      }),
    ]);

    isFollowing = !!followCheck;
    isFollower = !!followerCheck;
    isConnection = !!connectionCheck;
  }

  return {
    ...user.toJSON(),
    isFollowing,
    isFollower,
    isConnection,
  };
};

const getFollowers = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  
  const [follows, total] = await Promise.all([
    Follow.find({ following: userId })
      .populate("follower", "username name media roles social followerCount followingCount")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Follow.countDocuments({ following: userId }),
  ]);

  const items = follows.map((f) => f.follower).filter(Boolean);

  return {
    items,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};

const getFollowing = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  
  const [follows, total] = await Promise.all([
    Follow.find({ follower: userId })
      .populate("following", "username name media roles social followerCount followingCount")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Follow.countDocuments({ follower: userId }),
  ]);

  const items = follows.map((f) => f.following).filter(Boolean);

  return {
    items,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};

const updateProfileSection = async (userId, section, data, requester) => {
  if (!requester) throw Object.assign(new Error('Not authorized'), { status: 403 });

  const isAdmin = roleHasPermission(requester.roles, PERMISSIONS.MANAGE_USERS);
  const isEducationManager = requester.roles?.includes('education_manager') || requester.primaryRole === 'education_manager';

  if (requester.id !== userId) {
    if (isAdmin) {
      // allowed
    } else if (isEducationManager) {
      // education managers can only edit students' sections
      const targetUser = await User.findById(userId).select('roles');
      if (!targetUser) throw Object.assign(new Error('User not found'), { status: 404 });
      const targetIsStudent = targetUser.roles?.includes('student');
      if (!targetIsStudent) {
        throw Object.assign(new Error('Not authorized to edit this section'), { status: 403 });
      }
    } else {
      throw Object.assign(new Error('Not authorized'), { status: 403 });
    }
  }

  const validSections = ["personalInfo", "careerHighlights"];
  
  if (!validSections.includes(section)) {
    throw Object.assign(new Error("Invalid section"), { status: 400 });
  }

  const update = {};
  
  if (section === "personalInfo") {
    // Personal info includes name, contact, social.bio, social.about
    if (data.name) update.name = data.name;
    if (data.contact) update.contact = data.contact;
    if (data.social) {
      update.social = data.social;
    }
    if (data.staffProfile) {
      update.staffProfile = data.staffProfile;
    }
  } else if (section === "careerHighlights") {
    // Career highlights for students
    if (data.studentProfile) {
      update.studentProfile = data.studentProfile;
    }
    if (data.staffProfile) {
      update.staffProfile = data.staffProfile;
    }
    if (data.companyProfile) {
      update.companyProfile = data.companyProfile;
    }
  }

  const user = await User.findByIdAndUpdate(userId, update, { new: true }).select(BASE_PROJECTION);
  return user;
};

module.exports = {
  listStudents,
  searchUsers,
  getCompanyFilters,
  listConnections,
  followUser,
  unfollowUser,
  recalcFollowStats,
  updateProfile,
  checkUsernameAvailability,
  getUserProfile,
  getFollowers,
  getFollowing,
  updateProfileSection,
};
