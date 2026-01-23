const crypto = require("crypto");
const mongoose = require("mongoose");
const User = require("../models/User");
const Session = require("../models/Session");
const Organization = require("../models/Organization");
const RegistrationToken = require("../models/RegistrationToken");
const emailService = require("./emailService");
const Invitation = require("../models/Invitation");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../utils/token");
const { generateRandomPassword, hashPassword } = require("../utils/password");
const ROLES = require("../constants/roles");

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;
const USE_TRANSACTIONS = String(process.env.MONGO_TRANSACTIONS || "false").toLowerCase() === "true";
const SESSION_TTL_DAYS = 15; // Keep users signed in for 15 days unless they log out

const ROLE_MAP = {
  student: () => ROLES.STUDENT,
  school: (subRole = "admin") => {
    const map = {
      admin: ROLES.SCHOOL_ADMIN,
      "education-manager": ROLES.EDUCATION_MANAGER,
      teacher: ROLES.TEACHER,
    };
    return map[subRole] || ROLES.SCHOOL_ADMIN;
  },
  university: (subRole = "admin") => {
    const map = {
      admin: ROLES.UNIVERSITY_ADMIN,
      "education-manager": ROLES.UNIVERSITY_MANAGER,
      "study-counsellor": ROLES.UNIVERSITY_MANAGER,
      professor: ROLES.UNIVERSITY_MANAGER,
      "asst-professor": ROLES.UNIVERSITY_MANAGER,
      "junior-researcher": ROLES.UNIVERSITY_MANAGER,
    };
    return map[subRole] || ROLES.UNIVERSITY_ADMIN;
  },
  company: (subRole = "employer") => {
    const map = {
      employer: ROLES.COMPANY_EMPLOYER,
      "hiring-manager": ROLES.COMPANY_HIRING_MANAGER,
      founder: ROLES.COMPANY_FOUNDER,
      ceo: ROLES.COMPANY_CEO,
    };
    return map[subRole] || ROLES.COMPANY_EMPLOYER;
  },
};

const deriveEntityFromRoles = (roles = []) => {
  if (!Array.isArray(roles) || roles.length === 0) return "student";
  if (roles.includes(ROLES.STUDENT)) return "student";
  if (roles.some((role) => [ROLES.SCHOOL_ADMIN, ROLES.EDUCATION_MANAGER, ROLES.TEACHER].includes(role))) {
    return "school";
  }
  if (roles.some((role) => [ROLES.UNIVERSITY_ADMIN, ROLES.UNIVERSITY_MANAGER].includes(role))) {
    return "university";
  }
  if (
    roles.some((role) =>
      [ROLES.COMPANY_EMPLOYER, ROLES.COMPANY_HIRING_MANAGER, ROLES.COMPANY_FOUNDER, ROLES.COMPANY_CEO].includes(role)
    )
  ) {
    return "company";
  }
  return "student";
};

const buildAuthPayload = (user, sessionId) => ({
  sub: user.id,
  roles: user.roles,
  organizationId: user.organization,
  sessionId,
});

const generateOtpCode = () => String(Math.floor(100000 + Math.random() * 900000));

const hashOtpCode = (code) => crypto.createHash("sha256").update(String(code)).digest("hex");

const normalizeEmail = (email) => (email ? email.toLowerCase().trim() : null);

const normalizeUsername = (username) => (username ? username.toLowerCase().trim() : null);

const splitFullName = (fullName = "") => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { first: "", last: "" };
  const [first, ...rest] = parts;
  return { first, last: rest.join(" ") };
};

const createSession = async (user, refreshToken, req, workspace) => {
  const payload = {
    user: user.id,
    refreshToken,
    userAgent: req.get("user-agent"),
    ip: req.ip,
    workspace,
    expiresAt: new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000),
  };
  const session = await Session.create(payload);
  return session;
};

const login = async ({ identifier, password, entity, subRole, req }) => {
  const normalizedEntity = entity?.toLowerCase();
  const normalizedSubRole = subRole ? subRole.toLowerCase() : undefined;
  if (!normalizedEntity || !ROLE_MAP[normalizedEntity]) {
    throw Object.assign(new Error("Unsupported workspace"), { status: 400 });
  }

  const expectedRole = ROLE_MAP[normalizedEntity](normalizedSubRole);
  if (!expectedRole) {
    throw Object.assign(new Error("Invalid role selection"), { status: 400 });
  }

  const query = identifier.includes("@") ? { email: identifier.toLowerCase() } : { username: identifier.toLowerCase() };
  console.log('Login attempt:', { identifier, query, expectedRole });
  
  const user = await User.findOne(query).select("+password");
  console.log('User found:', user ? { username: user.username, email: user.email, roles: user.roles } : 'No user found');
  
  if (!user) {
    throw Object.assign(new Error("Invalid credentials"), { status: 401 });
  }

  const matches = await user.comparePassword(password);
  console.log('Password match:', matches);
  
  if (!matches) {
    throw Object.assign(new Error("Invalid credentials"), { status: 401 });
  }

  if (!user.roles?.includes(expectedRole)) {
    console.log('Role mismatch:', { userRoles: user.roles, expectedRole });
    throw Object.assign(new Error("This account cannot access the selected workspace"), { status: 403 });
  }

  user.lastLoginAt = new Date();
  await user.save();

  const refreshToken = signRefreshToken({ sub: user.id, roles: user.roles });
  const session = await createSession(user, refreshToken, req, normalizedEntity);

  const accessToken = signAccessToken(buildAuthPayload(user, session.id));

  const userPayload = user.toJSON();
  userPayload.entity = normalizedEntity;

  return {
    accessToken,
    refreshToken,
    user: userPayload,
    sessionId: session.id,
  };
};

const refresh = async (token, req) => {
  // Validate token format
  if (!token || typeof token !== "string") {
    throw Object.assign(new Error("Invalid refresh token format"), { status: 401 });
  }

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch (error) {
    throw Object.assign(new Error("Invalid or expired refresh token"), { status: 401 });
  }

  if (!payload || !payload.sub) {
    throw Object.assign(new Error("Invalid token payload"), { status: 401 });
  }

  const user = await User.findById(payload.sub).select("+roles +organization");
  if (!user) {
    throw Object.assign(new Error("User not found"), { status: 401 });
  }

  if (!user.roles || user.roles.length === 0) {
    throw Object.assign(new Error("User has no roles"), { status: 401 });
  }

  let session = await Session.findOne({ 
    user: user.id, 
    refreshToken: token, 
    revokedAt: null,
    expiresAt: { $gte: new Date() } // Only accept non-expired sessions
  });

  if (!session) {
    // Check if there's an expired session and create a new one
    const expiredSession = await Session.findOne({ user: user.id, refreshToken: token });
    
    // If session exists but expired, reject (don't auto-create)
    if (expiredSession && expiredSession.expiresAt < new Date()) {
      throw Object.assign(new Error("Session expired"), { status: 401 });
    }

    // Only create session if truly doesn't exist (first refresh after login)
    if (!expiredSession) {
      session = await Session.create({
        user: user.id,
        refreshToken: token,
        userAgent: req.get("user-agent"),
        ip: req.ip,
        workspace: deriveEntityFromRoles(user.roles),
        expiresAt: new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000),
      });
    } else {
      throw Object.assign(new Error("Invalid session state"), { status: 401 });
    }
  }

  // Extend session expiry to keep clients signed in (reset TTL)
  const newExpiryDate = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  session.userAgent = req.get("user-agent");
  session.ip = req.ip;
  session.expiresAt = newExpiryDate;
  
  try {
    await session.save();
  } catch (saveError) {
    throw Object.assign(new Error("Failed to update session"), { status: 500 });
  }

  const accessToken = signAccessToken(buildAuthPayload(user, session.id));
  const userPayload = user.toJSON();
  userPayload.entity = session.workspace || deriveEntityFromRoles(user.roles);
  userPayload.sessionId = session.id;

  return {
    accessToken,
    refreshToken: token, // Keep the same refresh token
    user: userPayload,
    sessionId: session.id,
  };
};

const logout = async (sessionId) => {
  await Session.findByIdAndUpdate(sessionId, { revokedAt: new Date() });
};

const inviteUser = async ({
  email,
  username,
  organizationId,
  role,
  invitedBy,
  expiresInHours = 72,
  metadata = {},
}) => {
  const token = crypto.randomBytes(20).toString("hex");
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

  const invitation = await Invitation.create({
    email,
    username,
    organization: organizationId,
    role,
    invitedBy,
    token,
    expiresAt,
    metadata,
  });

  return invitation;
};

const acceptInvitation = async ({ token, password }) => {
  const invitation = await Invitation.findOne({ token });
  if (!invitation) {
    throw Object.assign(new Error("Invalid invitation"), { status: 400 });
  }

  if (invitation.consumedAt) {
    throw Object.assign(new Error("Invitation already used"), { status: 400 });
  }

  if (invitation.expiresAt < new Date()) {
    throw Object.assign(new Error("Invitation expired"), { status: 400 });
  }

  const username = invitation.username || invitation.email.split("@")[0];

  const user = await User.create({
    username,
    email: invitation.email,
    password,
    roles: [invitation.role],
    organization: invitation.organization,
    status: "active",
    invitedBy: invitation.invitedBy,
  });

  invitation.consumedAt = new Date();
  invitation.metadata.userId = user.id;
  await invitation.save();

  return user;
};

const provisionStudent = async ({
  organizationId,
  payload,
  invitedBy,
}) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const organization = await Organization.findById(organizationId).session(session);
    if (!organization) {
      throw Object.assign(new Error("Organization not found"), { status: 404 });
    }

    const usernameBase = (payload.username || payload.email?.split("@")[0] || payload.name?.first || "student").toLowerCase();
    let username = usernameBase;
    let counter = 1;
    // eslint-disable-next-line no-await-in-loop
    while (await User.exists({ username }).session(session)) {
      username = `${usernameBase}${counter}`;
      counter += 1;
    }

    const temporaryPassword = generateRandomPassword(14);
    const hashedPassword = await hashPassword(temporaryPassword);

    const user = await User.create(
      [
        {
          username,
          email: payload.email,
          password: hashedPassword,
          roles: [ROLES.STUDENT],
          organization: organizationId,
          status: "invited",
          name: payload.name,
          studentProfile: payload.studentProfile,
          contact: payload.contact,
          isPasswordTemporary: true,
          invitedBy,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    return { user: user[0], temporaryPassword };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const ensureOrganization = async ({ entity, organizationName, email, session, companyFields = {} }) => {
  if (!organizationName || entity === "student") {
    return null;
  }

  const name = organizationName.trim();
  if (!name) {
    throw Object.assign(new Error("Organization name is required"), { status: 400 });
  }

  // Build upsert payload with contact/address/metadata when available
  const update = {
    name,
    type: entity,
    active: true,
  };

  const contact = {};
  if (email) contact.email = email;
  if (companyFields.companyPhone) contact.phone = companyFields.companyPhone;
  if (companyFields.website) contact.website = companyFields.website;
  if (Object.keys(contact).length) update.contact = contact;

  const address = {};
  if (companyFields.city) address.city = companyFields.city;
  if (companyFields.country) address.country = companyFields.country;
  if (Object.keys(address).length) update.address = address;

  const metadata = {};
  if (companyFields.companyRegNo) metadata.companyRegNo = companyFields.companyRegNo;
  if (companyFields.contactPerson) metadata.contactPerson = companyFields.contactPerson;
  if (companyFields.roles) metadata.roles = companyFields.roles;
  if (Object.keys(metadata).length) update.metadata = metadata;

  const options = { new: true, upsert: true, setDefaultsOnInsert: true };
  if (session) options.session = session;

  // Use findOneAndUpdate to upsert; set fields on insert and also update selective fields so organization table stays in sync
  const organization = await Organization.findOneAndUpdate(
    { name, type: entity },
    { $set: update },
    options
  );

  return organization;
};

const maskEmail = (email) => {
  if (!email) return null;
  const [local, domain] = email.split("@");
  if (!domain || !local) return email;
  if (local.length <= 2) return `${local[0] || "*"}***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
};

const requestRegistrationOtp = async ({ entity, form }) => {
  const normalizedEntity = entity?.toLowerCase();
  if (!ROLE_MAP[normalizedEntity]) {
    throw Object.assign(new Error("Unsupported entity"), { status: 400 });
  }

  if (!form || typeof form !== "object") {
    throw Object.assign(new Error("Registration details are required"), { status: 400 });
  }

  const email = normalizeEmail(form.email);
  const username = normalizeUsername(form.username);
  const fullName = form.fullName || form.name;
  const subRole = form.subRole;
  const organizationName = form.organizationName;

  if (!email) {
    throw Object.assign(new Error("Email is required"), { status: 400 });
  }
  if (!username) {
    throw Object.assign(new Error("Username is required"), { status: 400 });
  }
  if (!form.password || form.password.length < 6) {
    throw Object.assign(new Error("Password must be at least 6 characters"), { status: 400 });
  }
  if (!fullName) {
    throw Object.assign(new Error("Full name is required"), { status: 400 });
  }

  if (normalizedEntity !== "student") {
    if (!organizationName) {
      throw Object.assign(new Error("Organization name is required"), { status: 400 });
    }
    if (!subRole) {
      throw Object.assign(new Error("Role selection is required"), { status: 400 });
    }
  }

  const emailInUse = await User.exists({ email });
  if (emailInUse) {
    throw Object.assign(new Error("Email already registered"), { status: 409 });
  }

  const usernameInUse = await User.exists({ username });
  if (usernameInUse) {
    throw Object.assign(new Error("Username already taken"), { status: 409 });
  }

  const code = generateOtpCode();
  const codeHash = hashOtpCode(code);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  let token = await RegistrationToken.findOne({ email, entity: normalizedEntity });
  if (!token) {
    token = new RegistrationToken({ email, entity: normalizedEntity, resendCount: 0 });
  }

  token.codeHash = codeHash;
  token.expiresAt = expiresAt;
  token.attempts = 0;
  token.resendCount = (token.resendCount || 0) + 1;
  token.metadata = {
    username,
    subRole,
    organizationName,
  };

  await token.save();

  try {
    await emailService.sendOtpEmail({ to: email, code, name: fullName, expiresInMinutes: OTP_EXPIRY_MINUTES });
  } catch (error) {
    const mailMock = String(process.env.MAIL_MOCK || "false").toLowerCase() === "true";
    const logger = require("../utils/logger");
    if (mailMock) {
      // If MAIL_MOCK=true, log the OTP and return success so registration flow is not blocked while SMTP is fixed
      logger.warn("MAIL_MOCK=true: emailService failed to send OTP, logging OTP instead of failing:", error && error.message ? error.message : error);
      logger.info(`[mail:mock] to=${email} otp=${code} expiresIn=${OTP_EXPIRY_MINUTES}min`);
    } else {
      await token.deleteOne();
      throw Object.assign(new Error("Failed to send verification email"), { status: 500, cause: error });
    }
  }

  return {
    email,
    maskedEmail: maskEmail(email),
    expiresAt,
    expiresIn: OTP_EXPIRY_MINUTES * 60,
  };
};

const verifyRegistration = async ({ entity, otp, form, req }) => {
  const normalizedEntity = entity?.toLowerCase();
  if (!ROLE_MAP[normalizedEntity]) {
    throw Object.assign(new Error("Unsupported entity"), { status: 400 });
  }

  if (!otp || String(otp).length < 4) {
    throw Object.assign(new Error("Invalid OTP"), { status: 400 });
  }

  if (!form || typeof form !== "object") {
    throw Object.assign(new Error("Registration details are required"), { status: 400 });
  }

  const email = normalizeEmail(form.email);
  const username = normalizeUsername(form.username);

  if (!email || !username) {
    throw Object.assign(new Error("Email and username are required"), { status: 400 });
  }

  const token = await RegistrationToken.findOne({ email, entity: normalizedEntity });
  if (!token) {
    throw Object.assign(new Error("OTP not found. Please request a new one."), { status: 404 });
  }

  if (token.expiresAt < new Date()) {
    await token.deleteOne();
    throw Object.assign(new Error("OTP expired. Please request a new one."), { status: 410 });
  }

  const providedHash = hashOtpCode(otp);
  if (providedHash !== token.codeHash) {
    token.attempts = (token.attempts || 0) + 1;
    if (token.attempts >= MAX_OTP_ATTEMPTS) {
      await token.deleteOne();
    } else {
      await token.save();
    }
    throw Object.assign(new Error("Incorrect OTP"), { status: 400 });
  }

  const emailInUse = await User.exists({ email });
  if (emailInUse) {
    await token.deleteOne();
    throw Object.assign(new Error("Email already registered"), { status: 409 });
  }

  const usernameInUse = await User.exists({ username });
  if (usernameInUse) {
    await token.deleteOne();
    throw Object.assign(new Error("Username already taken"), { status: 409 });
  }

  const role = ROLE_MAP[normalizedEntity](form.subRole);
  const { first, last } = splitFullName(form.fullName || form.name);

  let session = null;
  if (USE_TRANSACTIONS) {
    session = await mongoose.startSession();
    session.startTransaction();
  }

  try {
    const companyFields = {};
    if (normalizedEntity === 'company') {
      companyFields.companyPhone = form.companyPhone || form.phone || undefined;
      companyFields.website = form.website || undefined;
      companyFields.city = form.city || undefined;
      companyFields.country = form.country || undefined;
      companyFields.companyRegNo = form.companyRegNo || form.orgNumber || undefined;
      companyFields.contactPerson = form.fullName || form.name || undefined;
      companyFields.roles = form.subRole ? [form.subRole] : undefined;
    }

    const organization = await ensureOrganization({
      entity: normalizedEntity,
      organizationName: form.organizationName,
      email,
      session,
      companyFields,
    });

    const createOptions = session ? { session } : {};
    
    // Prepare user document
    const userDoc = {
      username,
      email,
      password: form.password,
      roles: [role],
      status: "active",
      organization: organization ? organization.id : undefined,
      name: { first, last },
      contact: { email },
    };

    if (role === ROLES.EDUCATION_MANAGER) {
      userDoc.staffProfile = {
        ...(userDoc.staffProfile || {}),
        programme: form.programme || form.program || '',
      };
    }
    
    // Add company-specific data for company users
    if (normalizedEntity === 'company') {
      userDoc.companyProfile = {
        companyName: form.organizationName || '',
        contactPerson: form.fullName || form.name || '',
        roles: form.subRole ? [form.subRole] : [],
        companyEmail: email,
      };
    }
    
    const [user] = await User.create([userDoc], createOptions);

    if (session) await session.commitTransaction();

    await RegistrationToken.deleteMany({ email, entity: normalizedEntity });

    const refreshToken = signRefreshToken({ sub: user.id, roles: user.roles });
  const userSession = await createSession(user, refreshToken, req, normalizedEntity);
    const accessToken = signAccessToken(buildAuthPayload(user, userSession.id));
    const userPayload = user.toJSON();
    userPayload.entity = normalizedEntity;

    return {
      accessToken,
      refreshToken,
      user: userPayload,
      sessionId: userSession.id,
    };
  } catch (error) {
    if (session) await session.abortTransaction();
    throw error;
  } finally {
    if (session) session.endSession();
  }
};

module.exports = {
  login,
  refresh,
  logout,
  inviteUser,
  acceptInvitation,
  provisionStudent,
  requestRegistrationOtp,
  verifyRegistration,
};
