const fs = require('fs');
const mongoose = require('mongoose');
const JobPosting = require("../models/JobPosting");
const JobApplication = require("../models/JobApplication");
const Connection = require("../models/Connection");
const Notification = require("../models/Notification");
const LiaEssential = require("../models/LIAEssential");
const SchoolRecord = require("../models/SchoolRecord");
const Organization = require("../models/Organization");
const User = require("../models/User");
const Contract = require("../models/Contract");
const ContractTemplate = require("../models/ContractTemplate");
const XLSX = require("xlsx");
const path = require("path");
const { sendEmail } = require("../services/emailService");
const logger = require("../utils/logger");
const ROLES = require("../constants/roles");

// --- Helper constants and functions ---
const RECORD_TYPE_TO_SECTION_KEY = {
  student: "students",
  all_student: "allStudents",
  my_student: "myStudents",
  teacher: "teachers",
  education_manager: "educationManagers",
  admin: "adminManagement",
  company: "companies",
  lead_company: "leadCompanies",
  liahub_company: "liahubCompanies",
};

const ALLOWED_RECORD_TYPES = new Set(Object.keys(RECORD_TYPE_TO_SECTION_KEY));

const COMPANY_ROLES = [
  ROLES.COMPANY_EMPLOYER,
  ROLES.COMPANY_HIRING_MANAGER,
  ROLES.COMPANY_FOUNDER,
  ROLES.COMPANY_CEO,
];

const SCHOOL_DECISION_NOTIFICATION_ROLES = [
  ROLES.SCHOOL_ADMIN,
  ROLES.EDUCATION_MANAGER,
  ROLES.UNIVERSITY_ADMIN,
  ROLES.UNIVERSITY_MANAGER,
];

const STUDENT_ASSIGNED_NOTIFICATION = "student_assigned";
const STUDENT_ASSIGNMENT_CONFIRMED_NOTIFICATION = "student_assignment_confirmed";
const STUDENT_ASSIGNMENT_REJECTED_NOTIFICATION = "student_assignment_rejected";

const ASSIGNMENT_STATUS = Object.freeze({
  PENDING: "pending",
  CONFIRMED: "confirmed",
  REJECTED: "rejected",
});

const normalizeProgrammeValue = (value) => {
  const raw = String(value || '');
  if (!raw) return '';
  return raw
    .toLowerCase()
    .replace(/^nbi\s*\/\s*/i, '')
    .replace(/\bprogram(me)?\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const getUserProgrammes = async (userId) => {
  const id = userId || null;
  if (!id) return [];
  const user = await User.findById(id).select('staffProfile roles').lean();
  if (!user) return [];
  const staffProfile = user.staffProfile || {};
  const programme = staffProfile.programme || staffProfile.program || '';
  const programmes = Array.isArray(staffProfile.programmes) ? staffProfile.programmes : [];
  return [programme, ...programmes].map(normalizeProgrammeValue).filter(Boolean);
};

const rowMatchesProgramme = (row, programmes = []) => {
  if (!row) return false;
  // If no programmes are configured for the user, do not filter out any rows.
  if (!programmes.length) return true;

  const tryGet = (obj, keys) => {
    if (!obj) return '';
    for (const k of keys) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) {
        const v = obj[k];
        if (v !== undefined && v !== null && String(v).trim() !== '') return String(v);
      }
    }
    return '';
  };

  // Support multiple shapes: row.programme / row.program, row.data.programme, or raw data object
  const candidateRaw = tryGet(row, ['programme', 'program']) || tryGet(row.data || {}, ['programme', 'program']) || tryGet(toDataObject(row) || {}, ['programme', 'program']);
  const candidate = normalizeProgrammeValue(candidateRaw);
  if (!candidate) return false;
  return programmes.includes(candidate);
};

const defaultTablesShape = () => ({
  allStudents: [],
  students: [],
  myStudents: [],
  teachers: [],
  educationManagers: [],
  adminManagement: [],
  companies: [],
  leadCompanies: [],
  liahubCompanies: [],
});

const toDataObject = (data) => {
  if (!data) return {};
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (e) {
      return {};
    }
  }
  return data;
};

const parseStudents = (val) => {
  if (!val) return 0;
  const n = Number(val);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
};

const sanitizeStatus = (s) => (s ? s : 'Active');

const toTrimmedString = (value) => {
  if (value === undefined || value === null) return '';
  return String(value).trim();
};

const mapToPlainObject = (value) => {
  if (!value) return {};
  if (value instanceof Map) {
    const output = {};
    value.forEach((mapValue, mapKey) => {
      output[mapKey] = mapValue;
    });
    return output;
  }
  if (typeof value.toObject === 'function') {
    return value.toObject();
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return { ...value };
  }
  return toDataObject(value);
};

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const asComparable = (value) => {
  const trimmed = toTrimmedString(value);
  return trimmed.toLowerCase();
};

const isValidDate = (year, month, day) => {
  if (!year || !month || !day) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const constructed = new Date(Date.UTC(year, month - 1, day));
  return (
    constructed.getUTCFullYear() === year &&
    constructed.getUTCMonth() === month - 1 &&
    constructed.getUTCDate() === day
  );
};

const normalizeYear = (year) => {
  if (year >= 1000) return year;
  if (year >= 70) return 1900 + year;
  return 2000 + year;
};

const formatAsYYMMDD = (year, month, day) => {
  const yy = String(year).slice(-2).padStart(2, '0');
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${yy}/${mm}/${dd}`;
};

const normalizeCohortDate = (value) => {
  const trimmed = toTrimmedString(value);
  if (!trimmed) return '';

  const alreadyFormatted = trimmed.match(/^(\d{2})[\/-](\d{2})[\/-](\d{2})$/);
  if (alreadyFormatted) {
    const [, yy, mm, dd] = alreadyFormatted;
    const y = Number(yy);
    const m = Number(mm);
    const d = Number(dd);
    if (isValidDate(normalizeYear(y), m, d)) return `${yy}/${mm.padStart(2, '0')}/${dd.padStart(2, '0')}`;
  }

  const matchYMD = trimmed.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
  if (matchYMD) {
    const year = Number(matchYMD[1]);
    const month = Number(matchYMD[2]);
    const day = Number(matchYMD[3]);
    if (isValidDate(year, month, day)) return formatAsYYMMDD(year, month, day);
  }

  const matchDMY = trimmed.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (matchDMY) {
    const day = Number(matchDMY[1]);
    const month = Number(matchDMY[2]);
    const rawYear = Number(matchDMY[3]);
    const year = matchDMY[3].length === 2 ? normalizeYear(rawYear) : rawYear;
    if (isValidDate(year, month, day)) return formatAsYYMMDD(year, month, day);
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = parsed.getMonth() + 1;
    const day = parsed.getDate();
    if (isValidDate(year, month, day)) return formatAsYYMMDD(year, month, day);
  }

  return trimmed;
};

const sanitizeGenericData = (incoming = {}, existing = {}) => {
  const result = { ...existing };
  Object.keys(incoming).forEach((key) => {
    result[key] = toTrimmedString(incoming[key]);
  });

  // Normalize common field variants to keep frontend keys consistent.
  if (!result.liaType && result.lia_type) {
    result.liaType = toTrimmedString(result.lia_type);
  }

  if (!result.notes && result.note) {
    result.notes = toTrimmedString(result.note);
  }

  return result;
};

const sanitizeStudentData = (incoming = {}, existing = {}) => {
  const previous = sanitizeGenericData(existing);
  const merged = sanitizeGenericData(incoming, previous);

  if (merged.companySelect !== undefined) {
    delete merged.companySelect;
  }

  const previousPlacement = asComparable(previous.placement);
  const nextPlacement = asComparable(merged.placement);

  merged.cohort = normalizeCohortDate(merged.cohort || merged.date || '');
  delete merged.date;

  if (!merged.cohort) delete merged.cohort;

  if (!merged.placement) {
    delete merged.companyNotified;
    delete merged.companyNotificationAt;
    delete merged.companyNotificationMethod;
    delete merged.assignedCompanyId;
    delete merged.assignedCompanyName;
    delete merged.assignmentStatus;
    delete merged.assignmentAssignedAt;
    delete merged.assignedByUserId;
    delete merged.assignedByName;
    delete merged.companyDecisionAt;
    delete merged.companyDecisionBy;
    delete merged.companyDecisionName;
    delete merged.companyDecisionReason;
    delete merged.verifiedAt;
  } else if (previousPlacement && previousPlacement !== nextPlacement) {
    delete merged.companyNotified;
    delete merged.companyNotificationAt;
    delete merged.companyNotificationMethod;
    delete merged.assignedCompanyId;
    delete merged.assignedCompanyName;
    delete merged.assignmentStatus;
    delete merged.assignmentAssignedAt;
    delete merged.assignedByUserId;
    delete merged.assignedByName;
    delete merged.companyDecisionAt;
    delete merged.companyDecisionBy;
    delete merged.companyDecisionName;
    delete merged.companyDecisionReason;
    delete merged.verifiedAt;
  }

  const normalizedStatus = toTrimmedString(merged.assignmentStatus).toLowerCase();
  if (normalizedStatus && Object.values(ASSIGNMENT_STATUS).includes(normalizedStatus)) {
    merged.assignmentStatus = normalizedStatus;
  } else if (previous.assignmentStatus) {
    merged.assignmentStatus = toTrimmedString(previous.assignmentStatus).toLowerCase();
  } else {
    delete merged.assignmentStatus;
  }

  const ensureString = (value) => {
    const trimmed = toTrimmedString(value);
    return trimmed ? trimmed : '';
  };

  const carryForwardKeys = [
    'assignedCompanyId',
    'assignedCompanyName',
    'assignedByUserId',
    'assignedByName',
    'assignmentAssignedAt',
    'companyDecisionAt',
    'companyDecisionBy',
    'companyDecisionName',
    'companyDecisionReason',
    'verifiedAt',
  ];

  carryForwardKeys.forEach((key) => {
    const next = ensureString(merged[key]);
    if (next) {
      merged[key] = next;
    } else if (previous[key]) {
      const prev = ensureString(previous[key]);
      if (prev) merged[key] = prev;
      else delete merged[key];
    } else {
      delete merged[key];
    }
  });

  return merged;
};

const normalizeYesNo = (value) => {
  const normalized = toTrimmedString(value).toLowerCase();
  if (!normalized) return '';
  if (["ja", "yes", "y", "true", "1"].includes(normalized)) return "JA";
  if (["nej", "no", "n", "false", "0"].includes(normalized)) return "NEJ";
  return normalized.toUpperCase();
};

const sanitizeLiahubCompanyData = (incoming = {}, existing = {}) => {
  const previous = sanitizeGenericData(existing);
  const merged = sanitizeGenericData(incoming, previous);

  merged.date = normalizeCohortDate(merged.date || merged.datum || '');
  if (!merged.date) delete merged.date;

  merged.business = toTrimmedString(merged.business || merged.company || merged.name);
  if (!merged.business) delete merged.business;

  merged.location = toTrimmedString(merged.location || merged.place || merged['ort/land']);
  merged.contactPerson = toTrimmedString(merged.contactPerson || merged.kontaktperson);
  merged.role = toTrimmedString(merged.role || merged.roll);
  merged.contactEmail = toTrimmedString(merged.contactEmail || merged.companyEmail || merged.email || merged.mejl);
  merged.educationLeaderEmail = toTrimmedString(merged.educationLeaderEmail || merged.educationLeaderMejl || '');
  merged.phone = toTrimmedString(merged.phone || merged.telefon);
  merged.orgNumber = toTrimmedString(merged.orgNumber || merged['org/reg'] || merged.ftgOrg);
  merged.note = toTrimmedString(merged.note || merged.notering || merged.notes);
  merged.nextStepPriority = toTrimmedString(merged.nextStepPriority || merged['nästaStegPrio'] || merged.nextStepPrio);
  merged.assignmentProcess = toTrimmedString(merged.assignmentProcess || merged['tilldela/urvalsprocess']);
  merged.program = toTrimmedString(merged.program || merged['program'] || merged['nbi/handelsakadmin program']);
  merged.educationLeader = toTrimmedString(merged.educationLeader || merged.ul);
  merged.studentName = toTrimmedString(merged.studentName || merged['studerandeNamn']);
  merged.studentEmail = toTrimmedString(merged.studentEmail || merged['studerandeMejl'] || merged['studerande mejladress']);
  merged.infoFromUL = toTrimmedString(merged.infoFromUL || merged['infoFrånUl']);
  merged.nextStep = toTrimmedString(merged.nextStep || merged['nästaSteg']);

  const ja = normalizeYesNo(merged.jaFlag || merged.ja);
  const nej = normalizeYesNo(merged.nejFlag || merged.nej);
  if (ja) merged.jaFlag = ja;
  if (nej) merged.nejFlag = nej;

  return merged;
};

const pickUserEmail = (user) => {
  if (!user) return '';
  const profileEmail = user.companyProfile?.companyEmail;
  const contactEmail = user.contact?.email;
  const email = profileEmail || contactEmail || user.email;
  return toTrimmedString(email);
};

const buildCompanyRecipients = async (placementName) => {
  if (!placementName) return { users: [], organization: null };
  const normalized = toTrimmedString(placementName);
  if (!normalized) return { users: [], organization: null };
  const regex = new RegExp(`^\s*${escapeRegex(normalized)}\s*$`, 'i');

  const users = await User.find({
    roles: { $in: COMPANY_ROLES },
    status: { $ne: 'suspended' },
    companyProfile: { $exists: true },
    'companyProfile.companyName': regex,
  })
    .select('_id email name companyProfile contact organization')
    .lean();

  let organization = null;
  if (users.length) {
    const orgIds = users
      .map((user) => (user.organization ? String(user.organization) : null))
      .filter(Boolean);
    if (orgIds.length) {
      organization = await Organization.findOne({ _id: { $in: orgIds } })
        .select('name contact metadata')
        .lean();
    }
  }

  if (!organization) {
    organization = await Organization.findOne({
      type: 'company',
      $or: [
        { name: regex },
        { 'metadata.companyName': regex },
        { 'metadata.tradeName': regex },
      ],
    })
      .select('name contact metadata')
      .lean();
  }

  return { users, organization };
};

const ensureStudentPlacementNotification = async ({ record, actor }) => {
  if (!record || record.type !== 'student') return record;

  try {
    const data = mapToPlainObject(record.data);
    const placementName = toTrimmedString(data.placement || data.company);
    const alreadyNotified = toTrimmedString(data.companyNotified).toLowerCase() === 'true';
    if (!placementName || alreadyNotified) return record;

    const studentName = toTrimmedString(data.name) || 'A LiaHub student';
    const cohort = toTrimmedString(data.cohort);
    const studentEmail = toTrimmedString(data.email);
    const actorId = actor && (actor.id || actor._id || actor);
    const actorName = actor?.name
      ? [actor.name.first, actor.name.last].filter(Boolean).join(' ')
      : actor?.fullName || '';

    const { users, organization } = await buildCompanyRecipients(placementName);
    const assignedByName = toTrimmedString(data.assignedByName) || actorName || '';
    const assignedCompanyId = organization?._id ? String(organization._id) : toTrimmedString(data.assignedCompanyId);

    const notificationPayload = {
      studentName,
      cohort,
      placement: placementName,
      studentEmail,
      assignedByName,
      assignmentStatus: data.assignmentStatus || ASSIGNMENT_STATUS.PENDING,
    };

    const subject = `New student assigned: ${studentName}`;
    const htmlBody = `<!doctype html><html><body style="font-family: Arial, Helvetica, sans-serif; color: #111;">
      <p>Hello${organization?.metadata?.contactPerson ? ` ${organization.metadata.contactPerson}` : ''},</p>
      <p>${studentName} has been assigned to <strong>${placementName}</strong>${cohort ? ` for the ${cohort} cohort` : ''}${assignedByName ? ` by ${assignedByName}` : ''}.</p>
      ${studentEmail ? `<p>You can reach the student at <a href="mailto:${studentEmail}">${studentEmail}</a>.</p>` : ''}
      <p>Please log in to LiaHub to review the student details. You can confirm the assignment to verify the student or reject it with a short reason if the placement is not a fit.</p>
      <p style="margin-top: 24px;">Thanks,<br/>The LiaHub Team</p>
    </body></html>`;
    const textBody = [
      `Hello${organization?.metadata?.contactPerson ? ` ${organization.metadata.contactPerson}` : ''},`,
      '',
      `${studentName} has been assigned to ${placementName}${cohort ? ` for the ${cohort} cohort` : ''}${assignedByName ? ` by ${assignedByName}` : ''}.`,
      studentEmail ? `You can reach the student at ${studentEmail}.` : '',
      'Please log in to LiaHub to review the student details. Confirm to verify the student or reject the assignment with a short reason.',
      '',
      'Thanks,',
      'The LiaHub Team',
    ]
      .filter(Boolean)
      .join('\n');

    let emailSent = false;
    let notificationSent = false;
    const emailTargets = new Set();

    for (const user of users) {
      const email = pickUserEmail(user);
      if (email) emailTargets.add(email);
      try {
        await Notification.create({
          recipient: user._id,
          actor: actorId || undefined,
          type: STUDENT_ASSIGNED_NOTIFICATION,
          entity: { kind: 'SchoolRecord', id: record._id },
          payload: notificationPayload,
        });
        notificationSent = true;
      } catch (notificationError) {
        logger.warn('Failed to create student assignment notification', notificationError);
      }
    }

    if (!emailTargets.size && organization?.contact?.email) {
      emailTargets.add(toTrimmedString(organization.contact.email));
    }

    for (const email of emailTargets) {
      if (!email) continue;
      try {
        await sendEmail({ to: email, subject, text: textBody, html: htmlBody });
        emailSent = true;
      } catch (emailError) {
        logger.warn('Failed to send student assignment email', emailError);
      }
    }

    if (emailSent || notificationSent) {
      const method = [emailSent ? 'email' : null, notificationSent ? 'notification' : null]
        .filter(Boolean)
        .join('+');
      const updatedData = {
        ...data,
        companyNotified: 'true',
        companyNotificationAt: new Date().toISOString(),
      };
      if (method) updatedData.companyNotificationMethod = method;
      if (assignedCompanyId) {
        updatedData.assignedCompanyId = assignedCompanyId;
        updatedData.assignedCompanyName = organization?.name || placementName;
      }
      if (!toTrimmedString(updatedData.assignmentStatus)) {
        updatedData.assignmentStatus = ASSIGNMENT_STATUS.PENDING;
      }
      if (!toTrimmedString(updatedData.assignmentAssignedAt)) {
        updatedData.assignmentAssignedAt = new Date().toISOString();
      }
      if (actorId) {
        updatedData.assignedByUserId = String(actorId);
      }
      if (actorName) {
        updatedData.assignedByName = actorName;
      }
      record.set('data', updatedData);
      await record.save();
    }
  } catch (error) {
    logger.error('Failed to process student assignment notification', error);
  }

  return record;
};

const notifySchoolTeamOfAssignmentDecision = async ({ record, actor, status, reason }) => {
  if (!record || record.type !== 'student') return;

  try {
    const data = mapToPlainObject(record.data);
    const placementName = toTrimmedString(data.placement || data.assignedCompanyName || '');
    const studentName = toTrimmedString(data.name) || 'A LiaHub student';
    const cohort = toTrimmedString(data.cohort);
    const studentEmail = toTrimmedString(data.email);
    const organizationId = record.organization;
    if (!organizationId) return;

    const recipients = await User.find({
      organization: organizationId,
      roles: { $in: SCHOOL_DECISION_NOTIFICATION_ROLES },
      status: { $ne: 'suspended' },
    })
      .select('_id email contact name roles')
      .lean();

    if (!recipients.length) return;

    const actorName = actor?.name
      ? [actor.name.first, actor.name.last].filter(Boolean).join(' ')
      : actor?.fullName || '';

    const decisionLabel = status === ASSIGNMENT_STATUS.CONFIRMED ? 'confirmed' : 'rejected';
    const subject = status === ASSIGNMENT_STATUS.CONFIRMED
      ? `${placementName || 'Company'} confirmed ${studentName}`
      : `${placementName || 'Company'} rejected ${studentName}`;

    const htmlLines = [
      `<p>Hello,</p>`,
      `<p>${placementName || 'A company'} has <strong>${decisionLabel}</strong> the assignment for ${studentName}${cohort ? ` (${cohort})` : ''}${actorName ? ` via ${actorName}` : ''}.</p>`,
    ];

    if (studentEmail) {
      htmlLines.push(`<p>Student email: <a href="mailto:${studentEmail}">${studentEmail}</a></p>`);
    }

    if (status === ASSIGNMENT_STATUS.REJECTED && reason) {
      htmlLines.push(`<p><strong>Reason provided:</strong><br/>${reason}</p>`);
    }

    htmlLines.push('<p>Please log in to LiaHub to review the student record and take the next steps.</p>');
    htmlLines.push('<p>Thanks,<br/>The LiaHub Team</p>');

    const htmlBody = `<!doctype html><html><body style="font-family: Arial, Helvetica, sans-serif; color: #111;">${htmlLines.join('')}</body></html>`;

    const textParts = [
      'Hello,',
      '',
      `${placementName || 'A company'} has ${decisionLabel} the assignment for ${studentName}${cohort ? ` (${cohort})` : ''}${actorName ? ` via ${actorName}` : ''}.`,
    ];

    if (studentEmail) {
      textParts.push(`Student email: ${studentEmail}`);
    }

    if (status === ASSIGNMENT_STATUS.REJECTED && reason) {
      textParts.push('');
      textParts.push('Reason provided:');
      textParts.push(reason);
    }

    textParts.push('');
    textParts.push('Please log in to LiaHub to review the student record and take the next steps.');
    textParts.push('');
    textParts.push('Thanks,');
    textParts.push('The LiaHub Team');

    const textBody = textParts.join('\n');

    const notificationType = status === ASSIGNMENT_STATUS.CONFIRMED
      ? STUDENT_ASSIGNMENT_CONFIRMED_NOTIFICATION
      : STUDENT_ASSIGNMENT_REJECTED_NOTIFICATION;

    for (const recipient of recipients) {
      try {
        await Notification.create({
          recipient: recipient._id,
          actor: actor?._id || actor?.id || undefined,
          type: notificationType,
          entity: { kind: 'SchoolRecord', id: record._id },
          payload: {
            studentName,
            placement: placementName,
            cohort,
            decision: decisionLabel,
            reason: reason || '',
          },
        });
      } catch (notificationError) {
        logger.warn('Failed to create school decision notification', notificationError);
      }

      const emailTarget = toTrimmedString(recipient.contact?.email || recipient.email);
      if (!emailTarget) continue;

      try {
        await sendEmail({ to: emailTarget, subject, html: htmlBody, text: textBody });
      } catch (emailError) {
        logger.warn('Failed to send school decision email', emailError);
      }
    }
  } catch (error) {
    logger.error('Unable to notify school team of assignment decision', error);
  }
};

const sanitizeDataPayload = (type, data = {}, existing = {}) => {
  if (!data || typeof data !== 'object') return mapToPlainObject(existing);
  const incoming = mapToPlainObject(data);
  const previous = mapToPlainObject(existing);

  if (type === 'student') {
    return sanitizeStudentData(incoming, previous);
  }

  if (type === 'all_student') {
    // "All Students" is a separate master list; keep student fields but strip placement/assignment fields.
    const merged = sanitizeStudentData(incoming, previous);
    delete merged.placement;
    delete merged.company;
    delete merged.location;
    delete merged.liaType;
    delete merged.lia_type;
    delete merged.contactPerson;
    delete merged.role;
    delete merged.companyEmail;
    delete merged.phone;
    delete merged.orgNumber;
    delete merged.org_number;
    delete merged.assignmentStatus;
    delete merged.assignmentAssignedAt;
    delete merged.companyNotified;
    delete merged.companyNotificationAt;
    delete merged.companyNotificationMethod;
    delete merged.assignedCompanyId;
    delete merged.assignedCompanyName;
    delete merged.assignedByUserId;
    delete merged.assignedByName;
    delete merged.companyDecisionAt;
    delete merged.companyDecisionBy;
    delete merged.companyDecisionName;
    delete merged.companyDecisionReason;
    delete merged.verified;
    delete merged.verifiedAt;
    return merged;
  }

  if (type === 'my_student') {
    // Use the student sanitizer but strip assignment-only fields so "My Students" stays a pre-assignment list.
    const merged = sanitizeStudentData(incoming, previous);
    // Also strip company/placement fields. My Students should capture student info only.
    delete merged.placement;
    delete merged.company;
    delete merged.location;
    delete merged.liaType;
    delete merged.lia_type;
    delete merged.contactPerson;
    delete merged.role;
    delete merged.companyEmail;
    delete merged.phone;
    delete merged.orgNumber;
    delete merged.org_number;
    delete merged.assignmentStatus;
    delete merged.assignmentAssignedAt;
    delete merged.companyNotified;
    delete merged.companyNotificationAt;
    delete merged.companyNotificationMethod;
    delete merged.assignedCompanyId;
    delete merged.assignedCompanyName;
    delete merged.assignedByUserId;
    delete merged.assignedByName;
    delete merged.companyDecisionAt;
    delete merged.companyDecisionBy;
    delete merged.companyDecisionName;
    delete merged.companyDecisionReason;
    delete merged.verified;
    delete merged.verifiedAt;
    // Keep any extra "my student" marker fields
    if (incoming.internshipAssigned !== undefined) {
      merged.internshipAssigned = toTrimmedString(incoming.internshipAssigned);
    }
    if (incoming.assignedStudentId !== undefined) {
      merged.assignedStudentId = toTrimmedString(incoming.assignedStudentId);
    }
    return merged;
  }

  if (type === 'liahub_company') {
    return sanitizeLiahubCompanyData(incoming, previous);
  }

  return sanitizeGenericData(incoming, previous);
};

const normalizeRecordId = (record) => (record && record._id ? String(record._id) : null);

const mapRecordToRow = (record) => {
  if (!record || !record.type) return null;
  const data = toDataObject(record.data || {});
  const common = {
    id: normalizeRecordId(record),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    status: record.status || 'Active',
  };

  switch (record.type) {
    case 'teacher':
    case 'education_manager':
    case 'admin':
      return {
        ...common,
        leader: data.leader || data.name || data.firstName || '',
        contact: data.contact || data.email || '',
        phone: data.phone || data.contactNumber || '',
        place: data.place || data.location || '',
        students: parseStudents(data.students),
        programme: data.programme || data.program || '',
      };
    case 'company':
    case 'lead_company':
      return {
        ...common,
        date: normalizeCohortDate(data.date || ''),
        business: data.business || data.name || '',
		liaType: data.liaType || data.lia_type || '',
        location: data.location || data.place || '',
        contactPerson: data.contactPerson || data.contact || '',
        role: data.role || '',
        companyEmail: data.companyEmail || data.email || '',
        phone: data.phone || data.contactNumber || '',
        orgNumber: data.orgNumber || '',
        notes: data.notes || '',
        assignmentProcess: data.assignmentProcess || '',
        programme: data.programme || data.program || '',
        educationLeader: data.educationLeader || '',
        studentName: data.studentName || '',
        studentEmail: data.studentEmail || '',
        infoFromLeader: data.infoFromLeader || '',
        students: parseStudents(data.students),
        quality: record.quality || data.quality || '',
      };
    case 'liahub_company':
      return {
        ...common,
        date: normalizeCohortDate(data.date || ''),
        business: data.business || data.name || data.company || '',
		liaType: data.liaType || data.lia_type || '',
        location: data.location || data.place || '',
        contactPerson: data.contactPerson || '',
        role: data.role || '',
        contactEmail: data.contactEmail || data.companyEmail || data.email || '',
        phone: data.phone || '',
        orgNumber: data.orgNumber || '',
		// Frontend uses `notes` key; keep `note` for backward compatibility.
		notes: data.notes || data.note || '',
		note: data.note || data.notes || '',
        nextStepPriority: data.nextStepPriority || data.nextStepPrio || '',
        assignmentProcess: data.assignmentProcess || '',
        program: data.program || '',
        educationLeader: data.educationLeader || '',
        educationLeaderEmail: data.educationLeaderEmail || '',
        studentName: data.studentName || '',
        studentEmail: data.studentEmail || '',
        infoFromUL: data.infoFromUL || '',
        nextStep: data.nextStep || '',
        jaFlag: data.jaFlag || '',
        nejFlag: data.nejFlag || '',
        quality: record.quality || data.quality || '',
      };
    case 'student':
      return {
        ...common,
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        programme: data.programme || data.program || '',
        placement: data.placement || data.company || '',
        cohort: normalizeCohortDate(data.cohort || data.date || ''),
        location: data.location || '',
        liaType: data.liaType || data.lia_type || '',
        contactPerson: data.contactPerson || '',
        role: data.role || '',
        companyEmail: data.companyEmail || '',
        orgNumber: data.orgNumber || '',
        notes: data.notes || '',
        assignmentProcess: data.assignmentProcess || '',
        educationLeader: data.educationLeader || '',
        infoFromLeader: data.infoFromLeader || '',
        companyNotified: toTrimmedString(data.companyNotified).toLowerCase() === 'true',
        companyNotificationAt: data.companyNotificationAt || '',
        companyNotificationMethod: data.companyNotificationMethod || '',
        assignmentStatus: toTrimmedString(data.assignmentStatus).toLowerCase() || ASSIGNMENT_STATUS.PENDING,
        assignedCompanyId: record.assignedCompanyId ? String(record.assignedCompanyId) : (data.assignedCompanyId || ''),
        assignedCompanyName: data.assignedCompanyName || data.placement || '',
        assignedByUserId: data.assignedByUserId || '',
        assignedByName: data.assignedByName || '',
        assignmentAssignedAt: data.assignmentAssignedAt || '',
        companyDecisionAt: data.companyDecisionAt || '',
        companyDecisionBy: data.companyDecisionBy || '',
        companyDecisionName: data.companyDecisionName || '',
        companyDecisionReason: data.companyDecisionReason || '',
        verified: (toTrimmedString(data.verified).toLowerCase() === 'true') || toTrimmedString(data.assignmentStatus).toLowerCase() === ASSIGNMENT_STATUS.CONFIRMED,
        verifiedAt: data.verifiedAt || '',
      };
    case 'my_student':
      return {
        ...common,
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        studentPhone: data.studentPhone || data.student_phone || '',
        educationManagerId: data.educationManagerId || '',
        programme: data.programme || data.program || '',
        placement: data.placement || data.company || '',
        cohort: normalizeCohortDate(data.cohort || data.date || ''),
        location: data.location || '',
        liaType: data.liaType || data.lia_type || '',
        contactPerson: data.contactPerson || '',
        role: data.role || '',
        companyEmail: data.companyEmail || '',
        orgNumber: data.orgNumber || '',
        notes: data.notes || data.note || '',
        assignmentProcess: data.assignmentProcess || '',
        educationLeader: data.educationLeader || '',
        infoFromLeader: data.infoFromLeader || data.infoFromUL || '',
        internshipAssigned: ['true', '1', 'yes'].includes(toTrimmedString(data.internshipAssigned).toLowerCase()),
        assignedStudentId: data.assignedStudentId || '',
      };
    case 'all_student':
      return {
        ...common,
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        studentPhone: data.studentPhone || data.student_phone || '',
        programme: data.programme || data.program || '',
        cohort: normalizeCohortDate(data.cohort || data.date || ''),
        notes: data.notes || data.note || '',
        assignmentProcess: data.assignmentProcess || '',
        educationLeader: data.educationLeader || '',
        infoFromLeader: data.infoFromLeader || data.infoFromUL || '',
      };
    default:
      return null;
  }
};

const serializeRecordForResponse = (record) => {
  if (!record) return null;
  const sectionKey = RECORD_TYPE_TO_SECTION_KEY[record.type];
  if (!sectionKey) return null;
  const row = mapRecordToRow(record);
  if (!row) return null;
  return { sectionKey, record: row };
};

const buildTablesResponse = (records = []) => {
  const tables = defaultTablesShape();
  records.forEach((record) => {
    const serialized = serializeRecordForResponse(record);
    if (serialized && tables[serialized.sectionKey]) {
      tables[serialized.sectionKey].push(serialized.record);
    }
  });
  return tables;
};

// --- Controllers ---
const getSchoolDashboard = async (req, res, next) => {
  try {
    const organization = req.user.organization;
    const isEducationManager = Array.isArray(req.user.roles) && req.user.roles.includes('education_manager');
    const currentUserId = (req.user && (req.user._id || req.user.id)) || null;
    const educationManagerProgrammes = isEducationManager ? await getUserProgrammes(currentUserId) : [];

    const liahubCompaniesQuery = isEducationManager ? { type: 'liahub_company' } : { organization, type: 'liahub_company' };
    const [lia, students, teachers, companies, leadCompanies, liahubCompanies, staffUsers] = await Promise.all([
      LiaEssential.find({ organization, active: true }).sort({ updatedAt: -1 }).limit(1).lean(),
      SchoolRecord.find({ organization, type: 'student' }).sort({ createdAt: -1 }).limit(100).lean(),
      SchoolRecord.find({ organization, type: 'teacher' }).sort({ createdAt: -1 }).limit(100).lean(),
      SchoolRecord.find({ organization, type: 'company' }).sort({ createdAt: -1 }).limit(100).lean(),
      SchoolRecord.find({ organization, type: 'lead_company' }).sort({ createdAt: -1 }).limit(100).lean(),
      SchoolRecord.find(liahubCompaniesQuery).sort({ createdAt: -1 }).limit(200).lean(),
      User.find({
        organization,
        roles: { $in: ['school_admin', 'education_manager', 'teacher', 'university_admin', 'university_manager'] },
        status: { $ne: 'suspended' },
      }).select('name contact staffProfile roles email createdAt updatedAt organization').sort({ createdAt: -1 }).lean(),
    ]);

    // Build company map from Organization + companyProfile
    const allCompanies = await Organization.find({ type: 'company', active: true }).select('name address contact metadata').lean();
    const companyDataMap = new Map();
    await Promise.all(
      allCompanies.map(async (org) => {
        const companyUser = await User.findOne({
          organization: org._id,
          roles: { $in: ['company_employer', 'company_hiring_manager', 'company_founder', 'company_ceo'] },
          companyProfile: { $exists: true },
        }).select('companyProfile').lean();

        const companyName = companyUser?.companyProfile?.companyName || org.name;
        const companyKey = String(companyName || '').trim().toLowerCase();
        
        // Check if organization is verified (contract signed)
        const verified = org.metadata?.contractSigned === true;

        companyDataMap.set(companyKey, {
          name: companyName,
          location: companyUser?.companyProfile?.city && companyUser?.companyProfile?.country
            ? [companyUser.companyProfile.city, companyUser.companyProfile.country].filter(Boolean).join(', ')
            : (org.address ? [org.address.city, org.address.country].filter(Boolean).join(', ') : ''),
          contactPerson: companyUser?.companyProfile?.contactPerson || org.metadata?.contactPerson || '',
          role: companyUser?.companyProfile?.roles ? companyUser.companyProfile.roles[0] : (org.metadata?.roles ? org.metadata.roles[0] : ''),
          companyEmail: companyUser?.companyProfile?.companyEmail || org.contact?.email || '',
          phone: companyUser?.companyProfile?.companyPhone || org.contact?.phone || '',
          orgNumber: companyUser?.companyProfile?.companyRegNo || org.metadata?.companyRegNo || '',
          verified: verified,
        });
      })
    );

    // Enrich students with fresh company metadata
    const enrichedStudents = (students || []).map((student) => {
      const data = toDataObject(student.data);
      const placement = data.placement || data.company;
      if (!placement) return mapRecordToRow(student) || student;
      const companyData = companyDataMap.get(String(placement).trim().toLowerCase());
      if (!companyData) return mapRecordToRow(student) || student;
      const merged = { ...data, location: companyData.location || data.location, contactPerson: companyData.contactPerson || data.contactPerson, role: companyData.role || data.role, companyEmail: companyData.companyEmail || data.companyEmail, phone: companyData.phone || data.phone, orgNumber: companyData.orgNumber || data.orgNumber };
      return { ...student, data: merged };
    });

    // Enrich staff users
    const enrichedStaff = (staffUsers || []).map((user) => {
      const fullName = typeof user.name === 'string'
        ? user.name
        : [user.name?.first, user.name?.last].filter(Boolean).join(' ');
      const leaderName = fullName || user.username || user.email || '';
      const primaryRole = Array.isArray(user.roles) ? user.roles.find((r) => ['school_admin', 'education_manager', 'teacher', 'university_admin', 'university_manager'].includes(r)) || 'staff' : 'staff';
      const staffProfile = user.staffProfile || {};
      const experiences = Array.isArray(staffProfile.experiences) ? staffProfile.experiences : [];
      const currentExperience = experiences.find((e) => e.current) || experiences[0] || {};

      return {
        id: String(user._id),
        leader: leaderName,
        contact: user.contact?.email || user.email || '',
        phone: user.contact?.phone || '',
        place: user.contact?.location || staffProfile.location || '',
        students: staffProfile.studentsHandled || 0,
        status: user.status || 'Active',
        updatedAt: user.updatedAt,
        organization: user.organization,
        roles: Array.isArray(user.roles) ? user.roles : [],
        primaryRole,
        programme: staffProfile.programme || staffProfile.program || '',
      };
    });

    const enrichedTeachers = enrichedStaff.filter((s) => s.roles.includes('teacher') || s.primaryRole === 'teacher');
    const enrichedEducationManagers = enrichedStaff.filter((s) => s.roles.includes('education_manager') || s.primaryRole === 'education_manager');
    const enrichedAdmins = enrichedStaff.filter((s) => s.roles.includes('school_admin') || s.roles.includes('university_admin') || s.primaryRole === 'admin');

    const filteredStudents = isEducationManager
      ? enrichedStudents.filter((record) => rowMatchesProgramme(toDataObject(record.data), educationManagerProgrammes))
      : enrichedStudents;

    const filteredLiahubCompanies = isEducationManager
      ? (liahubCompanies || []).filter((record) => rowMatchesProgramme(toDataObject(record.data), educationManagerProgrammes))
      : (liahubCompanies || []);

    const counts = {
      students: await SchoolRecord.countDocuments({ organization, type: 'student' }),
      jobs: await JobPosting.countDocuments({ organization, type: { $ne: 'lia' } }),
      lia: await JobPosting.countDocuments({ organization, type: 'lia' }),
      connections: await Connection.countDocuments({ status: 'accepted' }),
    };

    res.json({
      liaEssential: (lia && lia[0]) || null,
      tables: {
        students: filteredStudents.map((s) => (typeof s === 'object' && s.data ? mapRecordToRow({ ...s, type: 'student' }) : s)),
        teachers: enrichedTeachers,
        educationManagers: enrichedEducationManagers,
        adminManagement: enrichedAdmins,
        companies: companies || [],
        leadCompanies: leadCompanies || [],
        liahubCompanies: filteredLiahubCompanies.map((rec) => mapRecordToRow({ ...rec, type: 'liahub_company' })),
      },
      counts,
    });
  } catch (error) {
    next(error);
  }
};

const getStudentDashboard = async (req, res, next) => {
  try {
    const organization = req.user.organization;
    const roles = Array.isArray(req.user?.roles) ? req.user.roles : [];
    const currentUserId = toTrimmedString(req.user?._id || req.user?.id);
    const isEducationManager = roles.includes('education_manager');
    const isSchoolAdminLike = roles.some((role) => ['school_admin', 'platform_admin', 'university_admin'].includes(role));

    // Admin users (platform_admin, university_admin) should see ALL records across all organizations
    const isAdmin = Array.isArray(req.user?.roles) && req.user.roles.some(role => ['platform_admin', 'university_admin'].includes(role));
    const organizationFilter = (organization && !isAdmin) ? { organization } : {};
    const recordQuery = {
      ...organizationFilter,
      type: { $in: ['student', 'all_student', 'my_student', 'teacher', 'education_manager', 'admin', 'company', 'lead_company', 'liahub_company'] },
    };

    const [activePlacements, messageCount, recentNotifications, tableRecords, companies, staffUsers] = await Promise.all([
      JobPosting.countDocuments({ ...(organization && !isAdmin ? { organization } : {}), status: 'open', type: { $in: ['job', 'internship'] } }),
      Notification.countDocuments({ recipient: req.user.id, type: 'message', readAt: null }),
      Notification.find({ recipient: req.user.id }).sort({ createdAt: -1 }).limit(10).lean(),
      SchoolRecord.find(recordQuery).sort({ createdAt: -1 }).lean(),
      Organization.find({ type: 'company', active: true }).select('name address contact metadata').sort({ name: 1 }).lean(),
      User.find({ roles: { $in: ['school_admin', 'education_manager', 'teacher', 'university_admin', 'university_manager'] }, status: { $ne: 'suspended' } }).select('name contact staffProfile roles email createdAt updatedAt organization').sort({ createdAt: -1 }).lean(),
    ]);

    let effectiveRecords = tableRecords;
    if (!effectiveRecords || !effectiveRecords.length) {
      effectiveRecords = await SchoolRecord.find({ type: { $in: ['student', 'all_student', 'my_student', 'teacher', 'education_manager', 'admin', 'company', 'lead_company', 'liahub_company'] } }).sort({ createdAt: -1 }).lean();
    }

    // Education managers should ONLY see My Students they created/own.
    if (isEducationManager && !isSchoolAdminLike && currentUserId) {
      effectiveRecords = (effectiveRecords || []).filter((record) => {
        if (!record || record.type !== 'my_student') return true;
        const data = toDataObject(record.data || {});
        return toTrimmedString(data.educationManagerId) === currentUserId;
      });
    }

    const tables = buildTablesResponse(effectiveRecords);

    const educationManagerProgrammes = isEducationManager ? await getUserProgrammes(currentUserId) : [];

    if (isEducationManager) {
      if (Array.isArray(tables.students)) {
        tables.students = tables.students.filter((row) => rowMatchesProgramme(row, educationManagerProgrammes));
      }
      // My Students are already filtered by owner above.
      if (Array.isArray(tables.liahubCompanies)) {
        tables.liahubCompanies = tables.liahubCompanies.filter((row) => rowMatchesProgramme(row, educationManagerProgrammes));
      }
    }

    const isCompanyUser = Array.isArray(req.user?.roles)
      ? req.user.roles.some((role) => COMPANY_ROLES.includes(role))
      : false;
    const companyOrgId = req.user?.organization ? String(req.user.organization) : '';

    let pendingAssignments = [];
    if (isCompanyUser && Array.isArray(tables.students)) {
      const normalizedCompanyOrgId = companyOrgId.trim();
      const companyOrg = (companies || []).find((org) => String(org._id) === normalizedCompanyOrgId);
      const normalizedCompanyName = toTrimmedString(
        req.user?.companyProfile?.companyName ||
        companyOrg?.name ||
        companyOrg?.metadata?.companyName ||
        ''
      ).toLowerCase();

      const students = tables.students || [];
      const matchesCompany = (row) => {
        const assignedId = toTrimmedString(row.assignedCompanyId);
        if (normalizedCompanyOrgId && assignedId === normalizedCompanyOrgId) {
          return true;
        }
        if (!normalizedCompanyName) {
          return false;
        }
        const assignedName = toTrimmedString(row.assignedCompanyName || row.placement).toLowerCase();
        return assignedName && assignedName === normalizedCompanyName;
      };

      const companyStudents = students.filter(matchesCompany);
      pendingAssignments = companyStudents.filter(
        (row) =>
          toTrimmedString(row.assignmentStatus).toLowerCase() === ASSIGNMENT_STATUS.PENDING,
      );

      tables.students = companyStudents;
    }

    // Build company map
    const companyDataMap = new Map();
    await Promise.all(
      (companies || []).map(async (org) => {
        const companyUser = await User.findOne({ organization: org._id, roles: { $in: ['company_employer', 'company_hiring_manager', 'company_founder', 'company_ceo'] }, companyProfile: { $exists: true } }).select('companyProfile').lean();
        const companyName = companyUser?.companyProfile?.companyName || org.name;
        const companyKey = String(companyName || '').trim().toLowerCase();
        companyDataMap.set(companyKey, {
          name: companyName,
          location: companyUser?.companyProfile?.city && companyUser?.companyProfile?.country ? [companyUser.companyProfile.city, companyUser.companyProfile.country].filter(Boolean).join(', ') : (org.address ? [org.address.city, org.address.country].filter(Boolean).join(', ') : ''),
          contactPerson: companyUser?.companyProfile?.contactPerson || org.metadata?.contactPerson || '',
          role: companyUser?.companyProfile?.roles ? companyUser.companyProfile.roles[0] : (org.metadata?.roles ? org.metadata.roles[0] : ''),
          companyEmail: companyUser?.companyProfile?.companyEmail || org.contact?.email || '',
          phone: companyUser?.companyProfile?.companyPhone || org.contact?.phone || '',
          orgNumber: companyUser?.companyProfile?.companyRegNo || org.metadata?.companyRegNo || '',
        });
      })
    );

    // Enrich students in tables
    const enrichStudentsWithCompanyData = (students = []) =>
      (students || []).map((s) => {
        const placement = s.placement;
        if (!placement) return s;
        const companyData = companyDataMap.get(String(placement).trim().toLowerCase());
        if (!companyData) return s;
        return {
          ...s,
          location: companyData.location || s.location,
          contactPerson: companyData.contactPerson || s.contactPerson,
          role: companyData.role || s.role,
          companyEmail: companyData.companyEmail || s.companyEmail,
          phone: companyData.phone || s.phone,
          orgNumber: companyData.orgNumber || s.orgNumber,
        };
      });

    if (Array.isArray(tables.students) && tables.students.length) {
      tables.students = enrichStudentsWithCompanyData(tables.students);
    }

    // Enrich staff users
    const enrichedStaff = (staffUsers || []).map((user) => {
      const fullName = typeof user.name === 'string'
        ? user.name
        : [user.name?.first, user.name?.last].filter(Boolean).join(' ');
      const primaryRole = Array.isArray(user.roles) ? user.roles.find((r) => ['school_admin', 'education_manager', 'teacher', 'university_admin', 'university_manager'].includes(r)) || 'staff' : 'staff';
      const staffProfile = user.staffProfile || {};
      const experiences = Array.isArray(staffProfile.experiences) ? staffProfile.experiences : [];
      const current = experiences.find((e) => e.current) || experiences[0] || {};

      return {
        id: String(user._id),
        leader: fullName || user.username || user.email || '',
        contact: user.contact?.email || user.email || '',
        phone: user.contact?.phone || '',
        place: user.contact?.location || staffProfile.location || '',
        students: staffProfile.studentsHandled || 0,
        status: user.status || 'Active',
        updatedAt: user.updatedAt,
        organization: user.organization,
        roles: Array.isArray(user.roles) ? user.roles : [],
        primaryRole,
        programme: staffProfile.programme || staffProfile.program || '',
      };
    });

    tables.teachers = enrichedStaff.filter((s) => s.roles?.includes('teacher') || s.primaryRole === 'teacher');
    tables.educationManagers = enrichedStaff.filter((s) => s.roles?.includes('education_manager') || s.primaryRole === 'education_manager');
    tables.adminManagement = enrichedStaff.filter((s) => s.roles?.some((r) => ['school_admin', 'university_admin'].includes(r)) || enrichedStaff.some((s) => s.primaryRole === 'admin'));

    // Enrich companies list
    const enrichedCompanies = await Promise.all((companies || []).map(async (org) => {
      const companyUser = await User.findOne({ organization: org._id, roles: { $in: ['company_employer', 'company_hiring_manager', 'company_founder', 'company_ceo'] }, companyProfile: { $exists: true } }).select('companyProfile').lean();
      const companyName = companyUser?.companyProfile?.companyName || org.name;
      const escapedName = companyName ? companyName.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&') : '';
      const studentCount = await SchoolRecord.countDocuments({
        ...(organization ? { organization } : {}),
        type: 'student',
        'data.assignmentStatus': ASSIGNMENT_STATUS.CONFIRMED,
        $or: [
          { 'data.assignedCompanyId': String(org._id) },
          escapedName
            ? {
                'data.assignedCompanyName': {
                  $regex: new RegExp(`^\\s*${escapedName}\\s*$`, 'i'),
                },
              }
            : null,
          escapedName
            ? {
                'data.placement': {
                  $regex: new RegExp(`^\\s*${escapedName}\\s*$`, 'i'),
                },
              }
            : null,
        ].filter(Boolean),
      });
      
      // Check if company has signed contract
      const contractSigned = org.metadata?.contractSigned || false;
      
      return {
        id: String(org._id),
        business: companyName,
        location: org.address ? [org.address.city, org.address.country].filter(Boolean).join(', ') : '',
        contactPerson: companyUser?.companyProfile?.contactPerson || org.metadata?.contactPerson || '',
        role: companyUser?.companyProfile?.roles ? companyUser.companyProfile.roles[0] : (org.metadata?.roles ? org.metadata.roles[0] : ''),
        companyEmail: companyUser?.companyProfile?.companyEmail || org.contact?.email || '',
        phone: companyUser?.companyProfile?.companyPhone || org.contact?.phone || '',
        orgNumber: companyUser?.companyProfile?.companyRegNo || org.metadata?.companyRegNo || '',
        students: studentCount,
        status: 'Active',
        verified: contractSigned,
        contractSigned,
      };
    }));

    if (!Array.isArray(tables.companies) || tables.companies.length === 0) {
      // Only fall back to enriched organization companies when there are no uploaded company records
      tables.companies = enrichedCompanies;
    }

    const counts = {
      students: await SchoolRecord.countDocuments({ ...(organization && !isAdmin ? { organization } : {}), type: 'student' }),
      jobs: await JobPosting.countDocuments({ ...(organization && !isAdmin ? { organization } : {}), type: { $ne: 'lia' } }),
      lia: await JobPosting.countDocuments({ ...(organization && !isAdmin ? { organization } : {}), type: 'lia' }),
      connections: await Connection.countDocuments({ status: 'accepted' }),
    };

    res.json({
      liaEssential: (await LiaEssential.find({ ...(organization && !isAdmin ? { organization } : {}), active: true }).sort({ updatedAt: -1 }).limit(1).lean())[0] || null,
      tables,
      counts,
      messageCount: messageCount || 0,
      recentNotifications: recentNotifications || [],
      activePlacements: activePlacements || 0,
      pendingAssignments,
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to create company organization and user from SchoolRecord data
const createCompanyOrganizationAndUser = async (companyData, schoolOrganization) => {
  try {
    // Check if organization already exists
    const existingOrg = await Organization.findOne({ 
      name: companyData.business,
      type: 'company' 
    });
    
    if (existingOrg) {
      return existingOrg._id;
    }

    // Create new company organization
    const companyOrg = await Organization.create({
      name: companyData.business,
      type: 'company',
      address: {
        city: companyData.location?.split(',')[0]?.trim() || '',
        country: companyData.location?.split(',')[1]?.trim() || '',
      },
      contact: {
        email: companyData.companyEmail || '',
        phone: companyData.phone || '',
      },
      metadata: {
        contactPerson: companyData.contactPerson || '',
        companyRegNo: companyData.orgNumber || '',
        roles: companyData.role ? [companyData.role] : [],
        partnerSchool: schoolOrganization,
      },
      active: true,
    });

    // Generate random password for initial setup (alphanumeric only for safety)
    const generatePassword = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
      let password = '';
      for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };
    const tempPassword = generatePassword();
    
    logger.info('CREATING COMPANY USER - Password before save:', tempPassword);

    // Generate username from company name or email
    const baseUsername = companyData.business.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    const username = baseUsername || companyData.companyEmail?.split('@')[0] || `company${Date.now()}`;

    // Create company user (password will be auto-hashed by pre-save hook)
    const companyUser = await User.create({
      username: username,
      email: companyData.companyEmail || `${username}@company.com`,
      password: tempPassword, // Plain password - will be hashed by User model pre-save hook
      name: {
        first: companyData.contactPerson?.split(' ')[0] || 'Company',
        last: companyData.contactPerson?.split(' ').slice(1).join(' ') || 'Admin',
      },
      roles: [ROLES.COMPANY_EMPLOYER],
      organization: companyOrg._id,
      companyProfile: {
        companyName: companyData.business,
        companyEmail: companyData.companyEmail || '',
        companyPhone: companyData.phone || '',
        companyRegNo: companyData.orgNumber || '',
        contactPerson: companyData.contactPerson || '',
        city: companyData.location?.split(',')[0]?.trim() || '',
        country: companyData.location?.split(',')[1]?.trim() || '',
        roles: companyData.role ? [companyData.role] : [],
      },
      status: 'active',
    });

    logger.info('Company user created successfully:', {
      username: companyUser.username,
      email: companyUser.email,
      roles: companyUser.roles,
      organization: companyUser.organization,
      plainPassword: tempPassword, // IMPORTANT: Use this password to login!
      passwordHashLength: companyUser.password?.length, // Should be 60 for bcrypt
    });

    // Auto-create contract from template if available
    try {
      const activeTemplate = await ContractTemplate.findOne({ 
        school: schoolOrganization, 
        isActive: true 
      });

      if (activeTemplate) {
        const contract = await Contract.create({
          organization: companyOrg._id,
          createdBy: activeTemplate.createdBy,
          contractType: activeTemplate.contractType,
          contractContent: activeTemplate.contractContent,
          contractFileUrl: activeTemplate.contractFileUrl,
          schoolSignature: activeTemplate.schoolSignature,
          schoolSignedBy: activeTemplate.schoolSignedBy,
          schoolSignedAt: activeTemplate.schoolSignedAt,
          status: 'pending',
          metadata: {
            companyName: companyData.business,
            contractTitle: activeTemplate.title || 'Company Partnership Agreement',
            notes: `Auto-generated from template v${activeTemplate.version}`,
          },
        });

        logger.info('Contract auto-created for new company:', {
          contractId: contract._id,
          companyOrg: companyOrg._id,
          companyName: companyData.business,
        });
      } else {
        logger.warn('No active contract template found for school:', schoolOrganization);
      }
    } catch (contractErr) {
      logger.error('Failed to auto-create contract from template:', contractErr);
      // Don't throw - company creation should succeed even if contract creation fails
    }

    // Send email with credentials
    if (companyData.companyEmail) {
      try {
        await sendEmail({
          to: companyData.companyEmail,
          subject: 'Welcome to LiaHub - Company Account Created',
          text: `Your company account has been created.\n\nLogin Instructions:\nUsername: ${companyUser.username}\nEmail: ${companyUser.email}\nTemporary Password: ${tempPassword}\n\nIMPORTANT: When logging in:\n1. Select "Company" as your account type\n2. Select "Employer" as your role\n3. Use your username or email\n4. Use the temporary password above\n\nYou will be required to sign a partnership contract on your first login.\n\nPlease change your password after logging in.`,
          html: `
            <h2>Welcome to LiaHub</h2>
            <p>Your company account has been created by your partner school.</p>
            
            <h3>Login Credentials:</h3>
            <table style="border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 8px; font-weight: bold;">Username:</td>
                <td style="padding: 8px; font-family: monospace; background: #f5f5f5;">${companyUser.username}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold;">Email:</td>
                <td style="padding: 8px; font-family: monospace; background: #f5f5f5;">${companyUser.email}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold;">Temporary Password:</td>
                <td style="padding: 8px; font-family: monospace; background: #f5f5f5;">${tempPassword}</td>
              </tr>
            </table>
            
            <h3>Login Instructions:</h3>
            <ol>
              <li>Go to LiaHub login page</li>
              <li><strong>Select "Company" as your account type</strong></li>
              <li><strong>Select "Employer" as your role</strong></li>
              <li>Enter your username (${companyUser.username}) or email</li>
              <li>Enter the temporary password above</li>
            </ol>
            
            <p><strong>Important:</strong> You will need to sign a partnership contract on your first login before accessing the platform.</p>
            <p>Please change your password immediately after logging in.</p>
          `,
        });
      } catch (emailErr) {
        logger.error('Failed to send company welcome email:', emailErr);
      }
    }

    return companyOrg._id;
  } catch (error) {
    logger.error('Error creating company organization and user:', error);
    throw error;
  }
};

const createSchoolRecord = async (req, res, next) => {
  try {
    const organization = req.user.organization;
    const userId = (req.user._id || req.user.id || '').toString();
    const roles = Array.isArray(req.user.roles) ? req.user.roles : [];
    const isAdmin = roles.some((role) => ['school_admin', 'platform_admin', 'university_admin'].includes(role));
    const isEducationManager = roles.includes('education_manager');

    const { type, status, data } = req.body || {};
    if (!ALLOWED_RECORD_TYPES.has(type)) return res.status(400).json({ message: 'Unsupported record type' });

    const sanitizedData = sanitizeDataPayload(type, data);

    const isSchoolAdmin = Array.isArray(req.user.roles) && req.user.roles.some((role) => ['school_admin', 'platform_admin', 'university_admin'].includes(role));

    if (type === 'liahub_company' && !isSchoolAdmin) {
      return res.status(403).json({ message: 'Only school administrators can manage LiaHub companies' });
    }

    if (type === 'liahub_company') {
      const programme = sanitizedData.program || sanitizedData.programme || req.body?.programme || req.body?.program || '';
      if (!programme) {
        return res.status(400).json({ message: 'Programme is required for LiaHub companies' });
      }
      sanitizedData.program = programme;
    }

    if (type === 'liahub_company') {
      const businessKey = asComparable(sanitizedData.business);
      const orgNumberKey = asComparable(sanitizedData.orgNumber);
      const studentEmailKey = asComparable(sanitizedData.studentEmail || sanitizedData.contactEmail);

      if (!businessKey) {
        return res.status(400).json({ message: 'Company name is required' });
      }

      const duplicateQuery = {
        organization,
        type: 'liahub_company',
        $or: [
          { 'data.business': { $regex: new RegExp(`^\\s*${escapeRegex(sanitizedData.business)}\\s*$`, 'i') } },
          orgNumberKey ? { 'data.orgNumber': sanitizedData.orgNumber } : null,
          studentEmailKey ? { 'data.studentEmail': sanitizedData.studentEmail || sanitizedData.contactEmail } : null,
        ].filter(Boolean),
      };

      const duplicate = await SchoolRecord.findOne(duplicateQuery).lean();
      if (duplicate) {
        return res.status(409).json({ message: 'Duplicate LiaHub company record' });
      }
    }

    if (type === 'my_student') {
      if (!isEducationManager && !isAdmin) {
        return res.status(403).json({ message: 'Only education managers can manage My Students' });
      }

      const getLeaderName = (u) => {
        if (!u) return '';
        const rawName = u.name;
        if (rawName && typeof rawName === 'object') {
          const composed = [rawName.first, rawName.last].filter(Boolean).join(' ');
          if (composed) return composed;
        }
        if (typeof rawName === 'string' && rawName.trim()) return rawName.trim();
        return toTrimmedString(u.fullName || u.username || '');
      };

      let userForStamping = req.user;
      if ((!req.user?.staffProfile || !getLeaderName(req.user)) && userId) {
        const dbUser = await User.findById(userId).select('name username fullName staffProfile').lean();
        if (dbUser) userForStamping = { ...req.user, ...dbUser };
      }

      const staffProfile = userForStamping?.staffProfile || {};
      const programmeFromUser = toTrimmedString(
        staffProfile.programme ||
          staffProfile.program ||
          (Array.isArray(staffProfile.programmes) ? staffProfile.programmes[0] : '')
      );

      const leaderName = getLeaderName(userForStamping);

      if (programmeFromUser) {
        sanitizedData.programme = programmeFromUser;
        sanitizedData.program = programmeFromUser;
      }
      if (leaderName) {
        sanitizedData.educationLeader = leaderName;
      }
      if (userId) {
        sanitizedData.educationManagerId = userId;
      }
    }

    if (type === 'student') {
      const programme = String(sanitizedData.programme || sanitizedData.program || '').trim();
      const hasLeader = String(sanitizedData.educationLeader || '').trim();
      if (programme && !hasLeader) {
        const manager = await User.findOne({
          organization,
          roles: { $in: ['education_manager'] },
          'staffProfile.programme': { $regex: new RegExp(`^\s*${escapeRegex(programme)}\s*$`, 'i') },
        }).select('name email contact').lean();
        if (manager) {
          const leaderName = [manager.name?.first, manager.name?.last].filter(Boolean).join(' ');
          if (leaderName) sanitizedData.educationLeader = leaderName;
        }
      }
    }

    const record = await SchoolRecord.create({ organization, type, status: sanitizeStatus(status), data: sanitizedData, quality: data?.quality || '' });

    if (type === 'student') {
      const recordData = mapToPlainObject(record.data);
      const actorName = req.user?.name
        ? [req.user.name.first, req.user.name.last].filter(Boolean).join(' ')
        : req.user?.fullName || '';
      const actorId = req.user?.id || req.user?._id;

      const assignedCompanyId = toTrimmedString(data?.assignedCompanyId || recordData.assignedCompanyId);
      if (assignedCompanyId) {
        recordData.assignedCompanyId = assignedCompanyId;
        // Also set the assignedCompanyId field directly on the record
        record.assignedCompanyId = assignedCompanyId;
      }
      const assignedCompanyName = toTrimmedString(data?.assignedCompanyName || recordData.assignedCompanyName || recordData.placement);
      if (assignedCompanyName) {
        recordData.assignedCompanyName = assignedCompanyName;
      }
  recordData.assignmentStatus = recordData.assignmentStatus || ASSIGNMENT_STATUS.PENDING;
      recordData.assignmentAssignedAt = new Date().toISOString();
      if (actorId) {
        recordData.assignedByUserId = String(actorId);
      }
      if (actorName) {
        recordData.assignedByName = actorName;
      }
      record.set('data', recordData);
      await record.save();
    }

    await ensureStudentPlacementNotification({ record, actor: req.user });
    
    const serialized = serializeRecordForResponse(record.toObject());
    if (!serialized) return res.status(500).json({ message: 'Unable to serialize record' });
    
    // If creating a company record, also create the organization and user
    let companyOrganizationId = null;
    if (type === 'company' || type === 'lead_company') {
      try {
        const sanitizedData = sanitizeDataPayload(type, data);
        companyOrganizationId = await createCompanyOrganizationAndUser(sanitizedData, organization);
      } catch (companyErr) {
        logger.error('Failed to create company organization:', companyErr);
        // Don't fail the entire request, just log the error
      }
    }
    
    // Add organization ID to response for contract creation
    res.status(201).json({
      ...serialized,
      companyOrganizationId,
    });
  } catch (error) {
    next(error);
  }
};

const updateSchoolRecord = async (req, res, next) => {
  try {
    const organization = req.user.organization;
    if (!organization) return res.status(400).json({ message: 'Organization context missing' });

    const roles = Array.isArray(req.user?.roles) ? req.user.roles : [];
    const userId = toTrimmedString(req.user?._id || req.user?.id);
    const isEducationManager = roles.includes('education_manager');

    const { id } = req.params;
    const { status, data, type: incomingType } = req.body || {};

    // Education manager edits are synced directly to the User profile (table rows are user-derived)
    if (incomingType === 'education_manager') {
      const isAdmin = Array.isArray(req.user.roles) && req.user.roles.some((role) => ['school_admin', 'platform_admin', 'university_admin'].includes(role));
      const isSelf = req.user?._id && String(req.user._id) === String(id);
      if (!isAdmin && !isSelf) {
        return res.status(403).json({ message: 'You can only edit your own profile' });
      }

      const user = await User.findOne({ _id: id, organization }).select('name username email contact staffProfile roles createdAt updatedAt');
      if (!user) return res.status(404).json({ message: 'Education manager not found' });

      const sanitizedData = sanitizeDataPayload('education_manager', data || {}, user.staffProfile || {});

      // Sync basic identity/contact
      if (sanitizedData.leader) {
        // store leader into name string for consistency
        user.name = sanitizedData.leader;
        user.username = user.username || sanitizedData.leader;
      }
      if (sanitizedData.contact) {
        user.email = sanitizedData.contact;
        user.contact = user.contact || {};
        user.contact.email = sanitizedData.contact;
      }
      if (sanitizedData.phone) {
        user.contact = user.contact || {};
        user.contact.phone = sanitizedData.phone;
      }
      if (sanitizedData.place) {
        user.contact = user.contact || {};
        user.contact.location = sanitizedData.place;
      }

      // Sync staff profile
      user.staffProfile = user.staffProfile || {};
      if (sanitizedData.programme) {
        user.staffProfile.programme = sanitizedData.programme;
      const programmes = Array.isArray(staffProfile.programmes) ? staffProfile.programmes : [];
      }
      if (sanitizedData.students !== undefined) {
        user.staffProfile.studentsHandled = parseStudents(sanitizedData.students);
      }

      await user.save();

      const row = mapRecordToRow({
        _id: user._id,
        type: 'education_manager',
        status: sanitizeStatus(status || 'Active'),
        data: {
          leader: sanitizedData.leader,
          contact: sanitizedData.contact,
        programmes,
          phone: sanitizedData.phone,
          place: sanitizedData.place,
          students: sanitizedData.students,
          programme: sanitizedData.programme,
        },
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });

      return res.json({ sectionKey: 'educationManagers', record: row });
    }

    const existing = await SchoolRecord.findOne({ _id: id, organization });
    if (!existing) return res.status(404).json({ message: 'Record not found' });

    const isSchoolAdmin = Array.isArray(req.user.roles) && req.user.roles.some((role) => ['school_admin', 'platform_admin', 'university_admin'].includes(role));
    if (existing.type === 'liahub_company' && !isSchoolAdmin) {
      return res.status(403).json({ message: 'Only school administrators can manage LiaHub companies' });
    }

    if (existing.type === 'my_student' && isEducationManager && !isSchoolAdmin) {
      const currentOwnerId = toTrimmedString(mapToPlainObject(existing.data).educationManagerId);
      if (!currentOwnerId || currentOwnerId !== userId) {
        return res.status(403).json({ message: 'You can only edit your own My Students records' });
      }
    }

    existing.status = sanitizeStatus(status || existing.status);
    const sanitizedData = sanitizeDataPayload(existing.type, data || {}, existing.data);
  existing.set('data', sanitizedData);
  
  // Store quality field for company-related records
  if (['company', 'lead_company', 'liahub_company'].includes(existing.type) && data?.quality !== undefined) {
    existing.quality = data.quality || '';
  }
  
  // Handle company assignment for students
  if (existing.type === 'student') {
    const assignedCompanyId = toTrimmedString(data?.assignedCompanyId || sanitizedData.assignedCompanyId);
    if (assignedCompanyId) {
      existing.assignedCompanyId = assignedCompanyId;
    } else {
      existing.assignedCompanyId = undefined;
    }
  }
  
  await existing.save();
  await ensureStudentPlacementNotification({ record: existing, actor: req.user });

    const serialized = serializeRecordForResponse(existing.toObject());
    if (!serialized) return res.status(500).json({ message: 'Unable to serialize record' });
    res.json(serialized);
  } catch (error) {
    next(error);
  }
};

const deleteSchoolRecord = async (req, res, next) => {
  try {
    const organization = req.user.organization;
    const roles = Array.isArray(req.user.roles) ? req.user.roles : [];
    const isAdmin = roles.some((role) => ['school_admin', 'platform_admin', 'university_admin'].includes(role));
    const isEducationManager = roles.includes('education_manager');
    const userId = (req.user._id || req.user.id || '').toString();

    const { id } = req.params;
    
    logger.info('DELETE request received:', { 
      recordId: id,
      recordIdType: typeof id,
      recordIdLength: id.length,
      userOrganization: organization,
      userId: req.user._id 
    });
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.error('Invalid ObjectId format:', { recordId: id });
      return res.status(400).json({ message: 'Invalid record ID format' });
    }
    
    // First, try to find the record without organization filter to see if it exists at all
    const recordWithoutOrgFilter = await SchoolRecord.findById(id);

    // Education managers are sourced from User documents; only admins may delete
    if (recordWithoutOrgFilter && recordWithoutOrgFilter.type === 'education_manager') {
      const isAdmin = Array.isArray(req.user.roles) && req.user.roles.some((role) => ['school_admin', 'platform_admin', 'university_admin'].includes(role));
      if (!isAdmin) {
        return res.status(403).json({ message: 'Only admins can delete education managers' });
      }
    }

    // My Students: only the owning education manager can delete (admins can delete all).
    if (recordWithoutOrgFilter && recordWithoutOrgFilter.type === 'my_student' && isEducationManager && !isAdmin) {
      const currentOwnerId = toTrimmedString(mapToPlainObject(recordWithoutOrgFilter.data).educationManagerId);
      if (!currentOwnerId || currentOwnerId !== toTrimmedString(userId)) {
        return res.status(403).json({ message: 'You can only delete your own My Students records' });
      }
    }
    
    if (!recordWithoutOrgFilter) {
      // Attempt fallback: treat supplied id as Organization id
      const organizationRecord = await Organization.findById(id);
      if (organizationRecord && organizationRecord.type === 'company') {
        logger.warn('Fallback: deleting company organization due to missing SchoolRecord', {
          organizationId: organizationRecord._id,
          organizationName: organizationRecord.name,
          userOrganization: organization,
        });

        // Delete users & contracts belonging to the organization
        const deletedUsers = await User.deleteMany({ organization: organizationRecord._id });
        const deletedContracts = await Contract.deleteMany({ organization: organizationRecord._id });
        await Organization.findByIdAndDelete(organizationRecord._id);

        // Remove any lingering school records matching the organization name
        const regex = new RegExp(`^\s*${escapeRegex(organizationRecord.name || '')}\s*$`, 'i');
        const lingeringRecords = await SchoolRecord.find({
          organization,
          type: { $in: ['company', 'lead_company'] },
          $or: [
            { 'data.business': { $regex: regex } },
            { 'data.name': { $regex: regex } },
          ],
        }).lean();

        const lingeringIds = lingeringRecords.map((rec) => rec._id);
        if (lingeringIds.length) {
          await SchoolRecord.deleteMany({ _id: { $in: lingeringIds } });
        }

        logger.info('Fallback deletion completed:', {
          organizationId: organizationRecord._id,
          removedSchoolRecordIds: lingeringIds,
          deletedUsers: deletedUsers.deletedCount,
          deletedContracts: deletedContracts.deletedCount,
        });

        return res.json({
          sectionKey: 'companies',
          id,
          removedSchoolRecordIds: lingeringIds.map(String),
        });
      }

      // Provide additional diagnostics before returning
      const sampleRecords = await SchoolRecord.find({ organization }).limit(3).lean();
      const companyRecords = await SchoolRecord.find({ organization, type: { $in: ['company', 'lead_company'] } }).limit(3).lean();
      logger.error('Record does not exist in database. Sample records:', { 
        recordId: id,
        sampleIds: sampleRecords.map(r => ({ _id: r._id, type: r.type })),
        companyIds: companyRecords.map(r => {
          const data = r.data || {};
          const business = data.business || data.name || 'Unknown';
          return { _id: r._id, type: r.type, business };
        })
      });
      return res.status(404).json({ message: 'Record not found in database' });
    }
    
    logger.info('Record found in database:', {
      recordId: id,
      recordType: recordWithoutOrgFilter.type,
      recordOrganization: recordWithoutOrgFilter.organization,
      userOrganization: organization
    });

    const isSchoolAdmin = isAdmin;
    if (recordWithoutOrgFilter.type === 'liahub_company' && !isSchoolAdmin) {
      return res.status(403).json({ message: 'Only school administrators can manage LiaHub companies' });
    }
    
    // Allow assigned education manager or admins to delete student even if org missing/mismatched
    const isAssignedStudentOwner =
      recordWithoutOrgFilter.type === 'student' &&
      recordWithoutOrgFilter.data &&
      recordWithoutOrgFilter.data.assignedByUserId &&
      userId &&
      recordWithoutOrgFilter.data.assignedByUserId.toString() === userId;
    const isStudentRecord = recordWithoutOrgFilter.type === 'student';
    const hasStudentDeleteBypass = isStudentRecord && (isAdmin || isEducationManager || isAssignedStudentOwner);

    // Check if record belongs to user's organization unless the user is allowed student bypass
    if (recordWithoutOrgFilter.organization && organization && recordWithoutOrgFilter.organization.toString() !== organization.toString() && !hasStudentDeleteBypass) {
      logger.error('Record belongs to different organization:', {
        recordOrganization: recordWithoutOrgFilter.organization,
        userOrganization: organization
      });
      return res.status(403).json({ message: 'Access denied: Record belongs to a different organization' });
    }
    
    if (!organization && !hasStudentDeleteBypass) {
      return res.status(400).json({ message: 'Organization context missing' });
    }
    
    const record = recordWithoutOrgFilter;
    
    logger.info('Proceeding with deletion:', { 
      recordId: id, 
      recordType: record.type,
      recordOrganization: record.organization 
    });
    
    // If deleting a company record, delete the associated Organization and User FIRST
    if (record.type === 'company' || record.type === 'lead_company') {
      try {
        const data = toDataObject(record.data);
        const companyName = data.business || data.name;
        
        if (companyName) {
          const regex = new RegExp(`^\\s*${escapeRegex(companyName)}\\s*$`, 'i');
          
          // Find the company organization
          const companyOrg = await Organization.findOne({
            name: regex,
            type: 'company'
          });
          
          if (companyOrg) {
            logger.info('Deleting company organization and associated data:', {
              companyName,
              organizationId: companyOrg._id,
              schoolRecordId: id
            });
            
            // Delete all users associated with this organization
            const deletedUsers = await User.deleteMany({ organization: companyOrg._id });
            logger.info(`Deleted ${deletedUsers.deletedCount} users for company: ${companyName}`);
            
            // Delete all contracts associated with this organization
            const deletedContracts = await Contract.deleteMany({ organization: companyOrg._id });
            logger.info(`Deleted ${deletedContracts.deletedCount} contracts for company: ${companyName}`);
            
            // Delete the organization
            await Organization.findByIdAndDelete(companyOrg._id);
            logger.info(`Deleted organization: ${companyName}`);
          } else {
            logger.warn(`No organization found for company: ${companyName}`);
          }
        }
      } catch (deleteError) {
        logger.error('Failed to delete company organization:', deleteError);
        // Continue with SchoolRecord deletion even if org deletion fails
      }
    }
    
    // Now delete the SchoolRecord
    await SchoolRecord.findByIdAndDelete(id);
    
    const sectionKey = RECORD_TYPE_TO_SECTION_KEY[record.type];
    res.json({ sectionKey, id: normalizeRecordId(record) });
  } catch (error) {
    next(error);
  }
};

const confirmStudentAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid record ID format' });
    }

    const record = await SchoolRecord.findById(id);
    if (!record || record.type !== 'student') {
      return res.status(404).json({ message: 'Student assignment not found' });
    }

    const companyOrgId = req.user.organization ? String(req.user.organization) : '';
    if (!companyOrgId) {
      return res.status(403).json({ message: 'Company organization missing' });
    }

    const data = mapToPlainObject(record.data);
    const assignedCompanyId = toTrimmedString(data.assignedCompanyId);
    if (!assignedCompanyId || assignedCompanyId !== companyOrgId) {
      return res.status(403).json({ message: 'Assignment does not belong to this company' });
    }

    const currentStatus = toTrimmedString(data.assignmentStatus).toLowerCase();
    if (currentStatus === ASSIGNMENT_STATUS.REJECTED) {
      return res.status(409).json({ message: 'Assignment already rejected' });
    }

    const decisionAt = new Date().toISOString();
    const actorName = req.user?.name
      ? [req.user.name.first, req.user.name.last].filter(Boolean).join(' ')
      : req.user?.fullName || '';

    const actorId = req.user?.id || req.user?._id;

    const updatedData = {
      ...data,
      assignmentStatus: ASSIGNMENT_STATUS.CONFIRMED,
      verifiedAt: decisionAt,
      verified: 'true',
      companyDecisionAt: decisionAt,
      companyDecisionBy: actorId ? String(actorId) : '',
      companyDecisionName: actorName,
      companyDecisionReason: '',
      companyDecisionStatus: ASSIGNMENT_STATUS.CONFIRMED,
    };

    if (!actorId) {
      delete updatedData.companyDecisionBy;
    }
    if (!actorName) {
      delete updatedData.companyDecisionName;
    }

    record.set('data', updatedData);
    await record.save();

    await notifySchoolTeamOfAssignmentDecision({
      record,
      actor: req.user,
      status: ASSIGNMENT_STATUS.CONFIRMED,
      reason: '',
    });

    const serialized = serializeRecordForResponse(record.toObject());
    if (!serialized) {
      return res.status(200).json({
        sectionKey: 'students',
        pendingAssignmentRemoved: String(record._id),
      });
    }

    return res.json({
      ...serialized,
      pendingAssignmentRemoved: String(record._id),
    });
  } catch (error) {
    next(error);
  }
};

const rejectStudentAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid record ID format' });
    }

    const trimmedReason = toTrimmedString(reason);
    if (!trimmedReason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const record = await SchoolRecord.findById(id);
    if (!record || record.type !== 'student') {
      return res.status(404).json({ message: 'Student assignment not found' });
    }

    const companyOrgId = req.user.organization ? String(req.user.organization) : '';
    if (!companyOrgId) {
      return res.status(403).json({ message: 'Company organization missing' });
    }

    const data = mapToPlainObject(record.data);
    const assignedCompanyId = toTrimmedString(data.assignedCompanyId);
    if (!assignedCompanyId || assignedCompanyId !== companyOrgId) {
      return res.status(403).json({ message: 'Assignment does not belong to this company' });
    }

    const currentStatus = toTrimmedString(data.assignmentStatus).toLowerCase();
    if (currentStatus === ASSIGNMENT_STATUS.CONFIRMED) {
      return res.status(409).json({ message: 'Assignment already confirmed' });
    }

    const decisionAt = new Date().toISOString();
    const actorName = req.user?.name
      ? [req.user.name.first, req.user.name.last].filter(Boolean).join(' ')
      : req.user?.fullName || '';

    const actorId = req.user?.id || req.user?._id;

    const updatedData = {
      ...data,
      assignmentStatus: ASSIGNMENT_STATUS.REJECTED,
      verified: '',
      companyDecisionAt: decisionAt,
      companyDecisionBy: actorId ? String(actorId) : '',
      companyDecisionName: actorName,
      companyDecisionReason: trimmedReason,
      companyDecisionStatus: ASSIGNMENT_STATUS.REJECTED,
    };

    if (!actorId) {
      delete updatedData.companyDecisionBy;
    }
    if (!actorName) {
      delete updatedData.companyDecisionName;
    }

    record.set('data', updatedData);
    await record.save();

    await notifySchoolTeamOfAssignmentDecision({
      record,
      actor: req.user,
      status: ASSIGNMENT_STATUS.REJECTED,
      reason: trimmedReason,
    });

    const serialized = serializeRecordForResponse(record.toObject());
    const responsePayload = {
      sectionKey: serialized?.sectionKey || 'students',
      pendingAssignmentRemoved: String(record._id),
    };

    if (serialized?.record) {
      responsePayload.record = serialized.record;
    }

    return res.json(responsePayload);
  } catch (error) {
    next(error);
  }
};

// Map Swedish column names to database field names
const SWEDISH_TO_FIELD_MAP = {
  Date: 'date',
  Företag: 'company',
  'Ort/land': 'location',
  Kontaktperson: 'contactPerson',
  Roll: 'role',
  Mejl: 'companyEmail',
  Telefon: 'companyPhone',
  'Ftg org/reg nr': 'orgNumber',
  Notera: 'notes',
  'Tilldela/urvalsprocess': 'assignmentProcess',
  'NBI/Handelsakadmin program': 'program',
  UL: 'educationLeader',
  'Studerande Namn': 'name',
  'Studerande mejladress (skola)': 'email',
  'Info från UL': 'infoFromLeader',
};

// Shared mapping for company / lead company Excel uploads
const COMPANY_SWEDISH_TO_FIELD_MAP = {
  Date: 'date',
  Datum: 'date',
  Företag: 'business',
  'Ort/land': 'location',
  'Ort/Land': 'location',
  Kontaktperson: 'contactPerson',
  Roll: 'role',
  Mejl: 'companyEmail',
  Telefon: 'phone',
  'Ftg org/reg nr': 'orgNumber',
  Notera: 'notes',
  'Notering': 'notes',
  'Tilldela/urvalsprocess': 'assignmentProcess',
  'NBI/Handelsakadmin program': 'programme',
  UL: 'educationLeader',
  'Studerande Namn': 'studentName',
  'Studerande mejladress (skola)': 'studentEmail',
  'Info från UL': 'infoFromLeader',
};

const LIAHUB_SWEDISH_TO_FIELD_MAP = {
  Datum: 'date',
  Företag: 'business',
  'Ort/Land': 'location',
  Kontaktperson: 'contactPerson',
  Roll: 'role',
  Mejl: 'contactEmail',
  Telefon: 'phone',
  'Ftg org/reg nr': 'orgNumber',
  Notering: 'note',
  'Nästa steg / PRIO': 'nextStepPriority',
  'Tilldela/urvalsprocess': 'assignmentProcess',
  'NBI/Handelsakadmin program': 'program',
  UL: 'educationLeader',
  Mejl_1: 'educationLeaderEmail',
  'Mejl__1': 'educationLeaderEmail',
  'Studerande Namn': 'studentName',
  'Studerande mejladress': 'studentEmail',
  'Info från UL': 'infoFromUL',
  'Nästa steg': 'nextStep',
  JA: 'jaFlag',
  NEJ: 'nejFlag',
};

const uploadStudentsExcel = async (req, res, next) => {
  try {
    const organization = req.user.organization;
    if (!organization) return res.status(400).json({ message: 'Organization context missing' });
    if (!req.file) return res.status(400).json({ message: 'No Excel file uploaded' });

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (!rawData || rawData.length === 0) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Excel file is empty' });
    }

    const successRecords = [];
    const failedRecords = [];

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      try {
        const mappedData = {};
        Object.keys(SWEDISH_TO_FIELD_MAP).forEach((swedishKey) => {
          const englishKey = SWEDISH_TO_FIELD_MAP[swedishKey];
          const value = row[swedishKey];
          mappedData[englishKey] = value ? String(value).trim() : '';
        });

        const studentData = {
          name: mappedData.name || '',
          email: mappedData.email || '',
          placement: mappedData.company || '',
          location: mappedData.location || '',
          contactPerson: mappedData.contactPerson || '',
          role: mappedData.role || '',
          companyEmail: mappedData.companyEmail || '',
          phone: mappedData.companyPhone || '',
          orgNumber: mappedData.orgNumber || '',
          programme: mappedData.program || '',
          cohort: normalizeCohortDate(mappedData.date || mappedData.cohort || ''),
          assignmentProcess: mappedData.assignmentProcess || '',
          educationLeader: mappedData.educationLeader || '',
          infoFromLeader: mappedData.infoFromLeader || '',
          notes: mappedData.notes || '',
        };

        if (!studentData.name && !studentData.email) {
          failedRecords.push({ rowNumber: i + 2, name: studentData.name || 'Unknown', email: studentData.email || 'Unknown', error: 'Missing name and email' });
          continue;
        }

        let isDuplicate = false;
        if (studentData.email) {
          const existingByEmail = await SchoolRecord.findOne({ organization, type: 'student', 'data.email': studentData.email }).lean();
          if (existingByEmail) isDuplicate = true;
        }

        if (!isDuplicate && studentData.name) {
          const existingByNameCompany = await SchoolRecord.findOne({ organization, type: 'student', 'data.name': studentData.name, 'data.placement': studentData.placement }).lean();
          if (existingByNameCompany) isDuplicate = true;
        }

        if (isDuplicate) {
          failedRecords.push({ rowNumber: i + 2, name: studentData.name || 'Unknown', email: studentData.email || 'Unknown', error: 'Duplicate record' });
          continue;
        }

  const record = await SchoolRecord.create({ organization, type: 'student', status: 'Active', data: studentData });
  await ensureStudentPlacementNotification({ record, actor: req.user });
        successRecords.push({ rowNumber: i + 2, name: studentData.name, email: studentData.email, id: record._id.toString() });
      } catch (error) {
        failedRecords.push({ rowNumber: i + 2, name: row['Studerande Namn'] || 'Unknown', email: row['Studerande mejladress (skola)'] || 'Unknown', error: error.message });
      }
    }

    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    const allStudents = await SchoolRecord.find({ organization, type: 'student' }).sort({ createdAt: -1 }).lean();

    const allCompanies = await Organization.find({ type: 'company', active: true }).select('name address contact metadata').lean();
    const companyDataMap2 = new Map();
    await Promise.all(allCompanies.map(async (org) => {
      const companyUser = await User.findOne({ organization: org._id, roles: { $in: ['company_employer', 'company_hiring_manager', 'company_founder', 'company_ceo'] }, companyProfile: { $exists: true } }).select('companyProfile').lean();
      const companyName = companyUser?.companyProfile?.companyName || org.name;
      companyDataMap2.set(String(companyName || '').trim().toLowerCase(), {
        name: companyName,
        location: companyUser?.companyProfile?.city && companyUser?.companyProfile?.country ? [companyUser.companyProfile.city, companyUser.companyProfile.country].filter(Boolean).join(', ') : (org.address ? [org.address.city, org.address.country].filter(Boolean).join(', ') : ''),
        contactPerson: companyUser?.companyProfile?.contactPerson || org.metadata?.contactPerson || '',
        role: companyUser?.companyProfile?.roles ? companyUser.companyProfile.roles[0] : (org.metadata?.roles ? org.metadata.roles[0] : ''),
        companyEmail: companyUser?.companyProfile?.companyEmail || org.contact?.email || '',
        phone: companyUser?.companyProfile?.companyPhone || org.contact?.phone || '',
        orgNumber: companyUser?.companyProfile?.companyRegNo || org.metadata?.companyRegNo || '',
      });
    }));

    const enrichedStudents2 = allStudents.map(student => {
      const data = toDataObject(student.data);
      const placement = data.placement || data.company;
      if (!placement) return student;
      const companyData = companyDataMap2.get(String(placement).trim().toLowerCase());
      if (!companyData) return student;
      return { ...student, data: { ...data, location: companyData.location || data.location, contactPerson: companyData.contactPerson || data.contactPerson, role: companyData.role || data.role, companyEmail: companyData.companyEmail || data.companyEmail, phone: companyData.phone || data.phone, orgNumber: companyData.orgNumber || data.orgNumber } };
    });

    const tables = buildTablesResponse(enrichedStudents2);

    res.json({ message: 'Excel upload processed', summary: { totalRows: rawData.length, successful: successRecords.length, failed: failedRecords.length }, successRecords, failedRecords, tables: tables.students });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(error);
  }
};

// Accept both Swedish and English headers for "My Students" uploads.
const MY_STUDENTS_EXCEL_MAP = {
  Date: 'date',
  Datum: 'date',
  Företag: 'company',
  Company: 'company',
  'Ort/land': 'location',
  'Ort/Land': 'location',
  'City/Country': 'location',
  'LIA type': 'liaType',
  'LIA Type': 'liaType',
  'LIA typ': 'liaType',
  Kontaktperson: 'contactPerson',
  'Contact person': 'contactPerson',
  Roll: 'role',
  Role: 'role',
  Mejl: 'email',
  Email: 'email',
  Telefon: 'phone',
  Phone: 'phone',
  'Ftg org/reg nr': 'orgNumber',
  'Company org/reg no.': 'orgNumber',
  Notera: 'notes',
  Note: 'notes',
  'Tilldela/urvalsprocess': 'assignmentProcess',
  'Award/selection process': 'assignmentProcess',
  'NBI/Handelsakadmin program': 'programme',
  'NBI/Handelsakademin program': 'programme',
  UL: 'educationLeader',
  'Education leader': 'educationLeader',
  'Studerande Namn': 'name',
  "Student's name": 'name',
  'Studerande mejladress (skola)': 'email',
  "Student's email (school)": 'email',
  "Student's phone": 'studentPhone',
  'Studerande telefon': 'studentPhone',
  'Info från UL': 'infoFromLeader',
  'Info from UL': 'infoFromLeader',
};

const uploadMyStudentsExcel = async (req, res, next) => {
  try {
    const organization = req.user.organization;
    if (!organization) return res.status(400).json({ message: 'Organization context missing' });
    if (!req.file) return res.status(400).json({ message: 'No Excel file uploaded' });

    const roles = Array.isArray(req.user.roles) ? req.user.roles : [];
    const isAdmin = roles.some((role) => ['school_admin', 'platform_admin', 'university_admin'].includes(role));
    const isEducationManager = roles.includes('education_manager');
    if (!isEducationManager && !isAdmin) {
      return res.status(403).json({ message: 'Only education managers can upload My Students' });
    }

    const getLeaderName = (u) => {
      if (!u) return '';
      const rawName = u.name;
      if (rawName && typeof rawName === 'object') {
        const composed = [rawName.first, rawName.last].filter(Boolean).join(' ');
        if (composed) return composed;
      }
      if (typeof rawName === 'string' && rawName.trim()) return rawName.trim();
      return toTrimmedString(u.fullName || u.username || '');
    };

    const userId = (req.user._id || req.user.id || '').toString();
    let userForStamping = req.user;
    if ((!req.user?.staffProfile || !getLeaderName(req.user)) && userId) {
      const dbUser = await User.findById(userId).select('name username fullName staffProfile').lean();
      if (dbUser) userForStamping = { ...req.user, ...dbUser };
    }

    const staffProfile = userForStamping?.staffProfile || {};
    const programmeFromUser = toTrimmedString(
      staffProfile.programme ||
        staffProfile.program ||
        (Array.isArray(staffProfile.programmes) ? staffProfile.programmes[0] : '')
    );

    const leaderName = getLeaderName(userForStamping);

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (!rawData || rawData.length === 0) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Excel file is empty' });
    }

    const successRecords = [];
    const failedRecords = [];

    const mapRow = (row) => {
      const mapped = {};
      Object.keys(MY_STUDENTS_EXCEL_MAP).forEach((header) => {
        const field = MY_STUDENTS_EXCEL_MAP[header];
        const value = row[header];
        if (value === undefined || value === null || String(value).trim() === '') return;
        mapped[field] = String(value).trim();
      });
      return mapped;
    };

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      try {
        const mapped = mapRow(row);

        const studentData = {
          name: mapped.name || '',
          email: mapped.email || '',
          studentPhone: mapped.studentPhone || '',
          cohort: normalizeCohortDate(mapped.date || mapped.cohort || ''),
          assignmentProcess: mapped.assignmentProcess || '',
          infoFromLeader: mapped.infoFromLeader || '',
          notes: mapped.notes || '',
          internshipAssigned: 'false',
          assignedStudentId: '',
        };

        // Always stamp programme + education leader from the logged-in education manager.
        if (programmeFromUser) {
          studentData.programme = programmeFromUser;
          studentData.program = programmeFromUser;
        }
        if (leaderName) {
          studentData.educationLeader = leaderName;
        }
        if (userId) {
          studentData.educationManagerId = userId;
        }

        if (!studentData.name && !studentData.email) {
          failedRecords.push({ rowNumber: i + 2, name: studentData.name || 'Unknown', email: studentData.email || 'Unknown', error: 'Missing name and email' });
          continue;
        }

        let isDuplicate = false;
        if (studentData.email) {
          const existingByEmail = await SchoolRecord.findOne({ organization, type: 'my_student', 'data.email': studentData.email, 'data.educationManagerId': userId }).lean();
          if (existingByEmail) isDuplicate = true;
        }

        if (!isDuplicate && studentData.name) {
          const existingByName = await SchoolRecord.findOne({ organization, type: 'my_student', 'data.name': studentData.name, 'data.educationManagerId': userId }).lean();
          if (existingByName) isDuplicate = true;
        }

        if (isDuplicate) {
          failedRecords.push({ rowNumber: i + 2, name: studentData.name || 'Unknown', email: studentData.email || 'Unknown', error: 'Duplicate record' });
          continue;
        }

        const sanitized = sanitizeDataPayload('my_student', studentData);
        if (programmeFromUser) {
          sanitized.programme = programmeFromUser;
          sanitized.program = programmeFromUser;
        }
        if (leaderName) {
          sanitized.educationLeader = leaderName;
        }
        if (userId) {
          sanitized.educationManagerId = userId;
        }

        const record = await SchoolRecord.create({ organization, type: 'my_student', status: 'Active', data: sanitized });
        successRecords.push({ rowNumber: i + 2, name: studentData.name, email: studentData.email, id: record._id.toString() });
      } catch (error) {
        failedRecords.push({ rowNumber: i + 2, error: error.message || 'Failed to import row' });
      }
    }

    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    return res.json({
      message: 'My Students upload processed',
      successCount: successRecords.length,
      failedCount: failedRecords.length,
      successes: successRecords,
      failures: failedRecords,
    });
  } catch (error) {
    next(error);
  }
};

// Accept both Swedish and English headers for "All Students" uploads.
const ALL_STUDENTS_EXCEL_MAP = {
  Date: 'date',
  Datum: 'date',
  Notera: 'notes',
  Note: 'notes',
  'Tilldela/urvalsprocess': 'assignmentProcess',
  'Award/selection process': 'assignmentProcess',
  'NBI/Handelsakadmin program': 'programme',
  'NBI/Handelsakademin program': 'programme',
  Program: 'programme',
  Programme: 'programme',
  UL: 'educationLeader',
  'Education leader': 'educationLeader',
  'Studerande Namn': 'name',
  "Student's name": 'name',
  'Studerande mejladress (skola)': 'email',
  "Student's email (school)": 'email',
  'Info från UL': 'infoFromLeader',
  'Info from UL': 'infoFromLeader',
  Telefon: 'phone',
  Phone: 'phone',
  Status: 'status',
};

const uploadAllStudentsExcel = async (req, res, next) => {
  try {
    const organization = req.user.organization;
    if (!organization) return res.status(400).json({ message: 'Organization context missing' });
    if (!req.file) return res.status(400).json({ message: 'No Excel file uploaded' });

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (!rawData || rawData.length === 0) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Excel file is empty' });
    }

    const successRecords = [];
    const failedRecords = [];

    const mapRow = (row) => {
      const mapped = {};
      Object.keys(ALL_STUDENTS_EXCEL_MAP).forEach((header) => {
        const field = ALL_STUDENTS_EXCEL_MAP[header];
        const value = row[header];
        if (value === undefined || value === null || String(value).trim() === '') return;
        mapped[field] = String(value).trim();
      });
      return mapped;
    };

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      try {
        const mapped = mapRow(row);

        const studentData = {
          name: mapped.name || '',
          email: mapped.email || '',
          phone: mapped.phone || '',
          cohort: normalizeCohortDate(mapped.date || mapped.cohort || ''),
          assignmentProcess: mapped.assignmentProcess || '',
          programme: mapped.programme || '',
          program: mapped.programme || '',
          educationLeader: mapped.educationLeader || '',
          infoFromLeader: mapped.infoFromLeader || '',
          notes: mapped.notes || '',
        };

        if (!studentData.name && !studentData.email) {
          failedRecords.push({ rowNumber: i + 2, name: 'Unknown', email: 'Unknown', error: 'Missing name and email' });
          continue;
        }

        let isDuplicate = false;
        if (studentData.email) {
          const existingByEmail = await SchoolRecord.findOne({ organization, type: 'all_student', 'data.email': studentData.email }).lean();
          if (existingByEmail) isDuplicate = true;
        }

        if (!isDuplicate && studentData.name) {
          const existingByName = await SchoolRecord.findOne({ organization, type: 'all_student', 'data.name': studentData.name }).lean();
          if (existingByName) isDuplicate = true;
        }

        if (isDuplicate) {
          failedRecords.push({ rowNumber: i + 2, name: studentData.name || 'Unknown', email: studentData.email || 'Unknown', error: 'Duplicate record' });
          continue;
        }

        const sanitized = sanitizeDataPayload('all_student', studentData);
        const record = await SchoolRecord.create({ organization, type: 'all_student', status: 'Active', data: sanitized });
        successRecords.push({ rowNumber: i + 2, name: studentData.name, email: studentData.email, id: record._id.toString() });
      } catch (error) {
        failedRecords.push({ rowNumber: i + 2, error: error.message || 'Failed to import row' });
      }
    }

    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    const allRecords = await SchoolRecord.find({ organization, type: 'all_student' }).sort({ createdAt: -1 }).lean();
    const tables = buildTablesResponse(allRecords);

    return res.json({
      message: 'All Students upload processed',
      successCount: successRecords.length,
      failedCount: failedRecords.length,
      successes: successRecords,
      failures: failedRecords,
      tables: tables.allStudents,
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(error);
  }
};

const uploadLiahubCompaniesExcel = async (req, res, next) => {
  try {
    const organization = req.user.organization;
    if (!organization) return res.status(400).json({ message: 'Organization context missing' });
    const isSchoolAdmin = Array.isArray(req.user.roles) && req.user.roles.some((role) => ['school_admin', 'platform_admin', 'university_admin'].includes(role));
    if (!isSchoolAdmin) {
      return res.status(403).json({ message: 'Only school administrators can upload LiaHub companies' });
    }
    if (!req.file) return res.status(400).json({ message: 'No Excel file uploaded' });

    const forcedProgramme = req.body?.programme || req.body?.program || '';
    if (!forcedProgramme) {
      return res.status(400).json({ message: 'Programme is required for LiaHub companies upload' });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (!rawData || rawData.length === 0) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Excel file is empty' });
    }

    const existingRecords = await SchoolRecord.find({ organization, type: 'liahub_company' }).lean();
    const dedupeSet = new Set(
      existingRecords.map((rec) => {
        const data = toDataObject(rec.data);
        const keyParts = [asComparable(data.business), asComparable(data.orgNumber), asComparable(data.studentEmail || data.contactEmail)];
        return keyParts.filter(Boolean).join('|');
      })
    );

    const successRecords = [];
    const failedRecords = [];

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      try {
        const mappedData = {};
        Object.keys(LIAHUB_SWEDISH_TO_FIELD_MAP).forEach((swedishKey) => {
          if (!(swedishKey in row)) return;
          const englishKey = LIAHUB_SWEDISH_TO_FIELD_MAP[swedishKey];
          const value = row[swedishKey];
          mappedData[englishKey] = value ? String(value).trim() : '';
        });

        // If duplicate "Mejl" column exists without suffix, map the value to education leader email if not set
        if (row['Mejl'] && !mappedData.educationLeaderEmail && mappedData.contactEmail && row['Mejl'] !== mappedData.contactEmail) {
          mappedData.educationLeaderEmail = String(row['Mejl']).trim();
        }

        const sanitized = sanitizeDataPayload('liahub_company', mappedData);
        sanitized.program = forcedProgramme;

        if (!sanitized.business) {
          failedRecords.push({ rowNumber: i + 2, business: sanitized.business || 'Unknown', error: 'Missing company name' });
          continue;
        }

        const dedupeKeyParts = [asComparable(sanitized.business), asComparable(sanitized.orgNumber), asComparable(sanitized.studentEmail || sanitized.contactEmail)];
        const dedupeKey = dedupeKeyParts.filter(Boolean).join('|') || asComparable(sanitized.business);

        if (dedupeSet.has(dedupeKey)) {
          failedRecords.push({ rowNumber: i + 2, business: sanitized.business, error: 'Duplicate record' });
          continue;
        }

        const record = await SchoolRecord.create({
          organization,
          type: 'liahub_company',
          status: 'Active',
          data: sanitized,
        });

        dedupeSet.add(dedupeKey);
        successRecords.push({ rowNumber: i + 2, business: sanitized.business, id: record._id.toString() });
      } catch (error) {
        failedRecords.push({ rowNumber: i + 2, business: row['Företag'] || 'Unknown', error: error.message });
      }
    }

    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    const allRecords = await SchoolRecord.find({ organization, type: 'liahub_company' }).sort({ createdAt: -1 }).lean();
    const tables = buildTablesResponse(allRecords);

    res.json({
      message: 'LiaHub companies upload processed',
      summary: { totalRows: rawData.length, successful: successRecords.length, failed: failedRecords.length },
      successRecords,
      failedRecords,
      tables: tables.liahubCompanies,
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(error);
  }
};

// Generic uploader for company/lead company excel
const uploadCompanyLikeExcel = async (req, res, next, { recordType }) => {
  try {
    const organization = req.user.organization;
    if (!organization) return res.status(400).json({ message: 'Organization context missing' });
    const isSchoolAdmin = Array.isArray(req.user.roles) && req.user.roles.some((role) => ['school_admin', 'platform_admin', 'university_admin'].includes(role));
    if (!isSchoolAdmin) {
      return res.status(403).json({ message: 'Only school administrators can upload companies' });
    }
    if (!req.file) return res.status(400).json({ message: 'No Excel file uploaded' });

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (!rawData || rawData.length === 0) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Excel file is empty' });
    }

    const successRecords = [];
    const failedRecords = [];

    // Preload existing records to help with duplicate detection
    const existing = await SchoolRecord.find({ organization, type: recordType }).lean();
    const dedupeSet = new Set(
      existing.map((rec) => {
        const data = toDataObject(rec.data);
        const keyParts = [asComparable(data.business), asComparable(data.orgNumber), asComparable(data.contactPerson), asComparable(data.companyEmail || data.email)];
        return keyParts.filter(Boolean).join('|');
      })
    );

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      try {
        const mapped = {};
        Object.keys(COMPANY_SWEDISH_TO_FIELD_MAP).forEach((swKey) => {
          if (row[swKey] === undefined) return;
          const targetKey = COMPANY_SWEDISH_TO_FIELD_MAP[swKey];
          mapped[targetKey] = row[swKey] ? String(row[swKey]).trim() : '';
        });

        const sanitized = sanitizeDataPayload(recordType, mapped);
        if (!sanitized.business) {
          failedRecords.push({ rowNumber: i + 2, business: sanitized.business || 'Unknown', error: 'Missing company name' });
          continue;
        }

        const dedupeKey = [asComparable(sanitized.business), asComparable(sanitized.orgNumber), asComparable(sanitized.companyEmail || sanitized.email)].filter(Boolean).join('|') || asComparable(sanitized.business);
        if (dedupeSet.has(dedupeKey)) {
          failedRecords.push({ rowNumber: i + 2, business: sanitized.business, error: 'Duplicate record' });
          continue;
        }

        const record = await SchoolRecord.create({
          organization,
          type: recordType,
          status: 'Active',
          data: sanitized,
        });

        dedupeSet.add(dedupeKey);
        successRecords.push({ rowNumber: i + 2, business: sanitized.business, id: record._id.toString() });
      } catch (error) {
        failedRecords.push({ rowNumber: i + 2, business: row['Företag'] || 'Unknown', error: error.message });
      }
    }

    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    const allRecords = await SchoolRecord.find({ organization, type: recordType }).sort({ createdAt: -1 }).lean();
    const tables = buildTablesResponse(allRecords);
    const sectionKey = recordType === 'lead_company' ? 'leadingCompanies' : 'companies';

    res.json({
      message: `${recordType === 'lead_company' ? 'Lead companies' : 'Companies'} upload processed`,
      summary: { totalRows: rawData.length, successful: successRecords.length, failed: failedRecords.length },
      successRecords,
      failedRecords,
      tables: tables[sectionKey],
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(error);
  }
};

const uploadCompaniesExcel = (req, res, next) => uploadCompanyLikeExcel(req, res, next, { recordType: 'company' });
const uploadLeadCompaniesExcel = (req, res, next) => uploadCompanyLikeExcel(req, res, next, { recordType: 'lead_company' });

const deleteLiahubCompaniesByProgramme = async (req, res, next) => {
  try {
    const organization = req.user.organization;
    if (!organization) return res.status(400).json({ message: 'Organization context missing' });

    const isSchoolAdmin = Array.isArray(req.user.roles) && req.user.roles.some((role) => ['school_admin', 'platform_admin', 'university_admin'].includes(role));
    if (!isSchoolAdmin) {
      return res.status(403).json({ message: 'Only school administrators can manage LiaHub companies' });
    }

    const programme = req.query?.programme || req.body?.programme || '';
    if (!programme) {
      return res.status(400).json({ message: 'Programme is required' });
    }

    const regex = new RegExp(`^\\s*${escapeRegex(programme)}\\s*$`, 'i');
    const result = await SchoolRecord.deleteMany({
      organization,
      type: 'liahub_company',
      $or: [
        { 'data.program': { $regex: regex } },
        { 'data.programme': { $regex: regex } },
      ],
    });

    res.json({ message: 'LiaHub companies deleted', deleted: result.deletedCount || 0 });
  } catch (error) {
    next(error);
  }
};

const deleteCompaniesByType = async (req, res, next) => {
  try {
    const { type = 'company' } = req.query;
    const allowed = ['company', 'lead_company'];
    if (!allowed.includes(type)) {
      return res.status(400).json({ message: 'Invalid company type' });
    }

    const organization = req.user.organization;
    const filter = { type };
    if (organization) {
      filter.organization = organization;
    }

    const result = await SchoolRecord.deleteMany(filter);
    res.json({ message: 'Companies deleted', deleted: result.deletedCount || 0 });
  } catch (error) {
    next(error);
  }
};

// Get LIA Essentials for the user's organization
const getLiaEssentials = async (req, res, next) => {
  try {
    let targetOrganization = req.user.organization;
    
    // If user is a company, fetch their school's organization LIA Essentials
    // Companies are managed by schools, so we need to find which school added them
    const userRoles = req.user.roles || [];
    const isCompanyUser = userRoles.some(role => 
      role === 'company_employer' || 
      role === 'company_ceo' || 
      role === 'company_founder' || 
      role === 'company_hiring_manager'
    );
    
    if (isCompanyUser) {
      // Find the school record that contains this company
      const schoolRecord = await SchoolRecord.findOne({ 
        companyName: req.user.companyProfile?.companyName,
        recordType: { $in: ['company', 'lead_company'] }
      }).populate('organization');
      
      if (schoolRecord && schoolRecord.organization) {
        // Use the school's organization to fetch LIA Essentials
        targetOrganization = schoolRecord.organization._id || schoolRecord.organization;
        logger.info("Company fetching school's LIA Essentials", {
          companyName: req.user.companyProfile?.companyName,
          schoolOrganization: targetOrganization,
          userId: req.user.id
        });
      } else {
        // If no school record found, return null (company not linked to any school)
        logger.warn("Company has no associated school record", {
          userId: req.user.id,
          companyName: req.user.companyProfile?.companyName
        });
        return res.json(null);
      }
    }
    
    if (!targetOrganization) {
      return res.status(400).json({ message: "Organization not found for user" });
    }

    const liaEssentials = await LiaEssential.findOne({ 
      organization: targetOrganization, 
      active: true 
    });
    
    // If no custom essentials exist, return null so frontend can use defaults
    if (!liaEssentials) {
      return res.json(null);
    }

    res.json(liaEssentials);
  } catch (error) {
    logger.error("Error fetching LIA essentials:", { error: error.message, userId: req.user?.id });
    next(error);
  }
};

// Update or create LIA Essentials for the organization
const updateLiaEssential = async (req, res, next) => {
  try {
    const organization = req.user.organization;
    const userId = req.user.id;
    
    if (!organization) {
      return res.status(400).json({ message: "Organization not found for user" });
    }

    const {
      title,
      description,
      lastUpdated,
      requirementSections,
      pdfResources,
      visibility
    } = req.body;

    // Validate that requirementSections is an array if provided
    if (requirementSections && !Array.isArray(requirementSections)) {
      return res.status(400).json({ message: "requirementSections must be an array" });
    }

    // Validate that pdfResources is an array if provided
    if (pdfResources && !Array.isArray(pdfResources)) {
      return res.status(400).json({ message: "pdfResources must be an array" });
    }

    const existing = await LiaEssential.findOne({ organization });
    
    if (existing) {
      // Update existing record
      if (title !== undefined) existing.title = title;
      if (description !== undefined) existing.description = description;
      if (lastUpdated !== undefined) existing.lastUpdated = lastUpdated;
      if (requirementSections !== undefined) existing.requirementSections = requirementSections;
      if (pdfResources !== undefined) existing.pdfResources = pdfResources;
      if (visibility !== undefined) existing.visibility = visibility;
      existing.updatedBy = userId;
      
      await existing.save();
      
      logger.info("LIA Essentials updated", {
        organizationId: organization,
        userId,
        essentialsId: existing.id
      });
      
      return res.json(existing);
    }
    
    // Create new record
    const created = await LiaEssential.create({
      organization,
      title: title || "Internship Collaboration Requirements",
      description: description || "A shared framework to guarantee meaningful placements.",
      lastUpdated: lastUpdated || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      requirementSections: requirementSections || [],
      pdfResources: pdfResources || [],
      visibility: visibility || "company",
      createdBy: userId,
      updatedBy: userId,
      active: true
    });
    
    logger.info("LIA Essentials created", {
      organizationId: organization,
      userId,
      essentialsId: created.id
    });
    
    res.status(201).json(created);
  } catch (error) {
    logger.error("Error updating LIA essentials:", {
      error: error.message,
      userId: req.user?.id,
      organization: req.user?.organization
    });
    next(error);
  }
};

const getCompaniesForDropdown = async (req, res, next) => {
  try {
    const organization = req.user.organization;
    if (!organization) {
      return res.status(400).json({ message: 'Organization context missing' });
    }

    // Fetch all companies from SchoolRecord with type 'company' or 'liahub_company'
    const companies = await SchoolRecord.find({
      organization,
      $or: [
        { type: 'company' },
        { type: 'liahub_company' },
        { type: 'lead_company' }
      ],
      status: { $in: ['active', 'Active'] }
    })
    .select('_id type data status')
    .lean()
    .sort({ createdAt: -1 });

    // Transform the data for dropdown
    const transformedCompanies = companies
      .map(company => {
        try {
          // Convert Map to plain object
          const companyDataObj = company.data instanceof Map 
            ? Object.fromEntries(company.data) 
            : (typeof company.data === 'object' ? company.data : {});
          
          const name = 
            companyDataObj.business || 
            companyDataObj.name || 
            companyDataObj.placement ||
            '';
          
          const location = companyDataObj.location || '';

          if (!name || name.trim() === '') {
            return null;
          }

          return {
            id: String(company._id),
            name: String(name).trim(),
            location: String(location).trim(),
            type: company.type,
            data: companyDataObj
          };
        } catch (e) {
          console.error('Error transforming company:', e);
          return null;
        }
      })
      .filter(c => c !== null);

    // Remove duplicates by name
    const seenNames = new Set();
    const uniqueCompanies = [];
    for (const company of transformedCompanies) {
      const nameKey = company.name.toLowerCase();
      if (!seenNames.has(nameKey)) {
        seenNames.add(nameKey);
        uniqueCompanies.push(company);
      }
    }

    res.json({
      companies: uniqueCompanies,
      total: uniqueCompanies.length
    });
  } catch (error) {
    logger.error('Failed to fetch companies for dropdown:', {
      error: error.message,
      userId: req.user?.id,
      organization: req.user?.organization
    });
    next(error);
  }
};

module.exports = {
  getStudentDashboard,
  getSchoolDashboard,
  getLiaEssentials,
  updateLiaEssential,
  createSchoolRecord,
  updateSchoolRecord,
  deleteSchoolRecord,
  confirmStudentAssignment,
  rejectStudentAssignment,
  uploadStudentsExcel,
  uploadAllStudentsExcel,
  uploadMyStudentsExcel,
  uploadLiahubCompaniesExcel,
  uploadCompaniesExcel,
  uploadLeadCompaniesExcel,
  deleteCompaniesByType,
  deleteLiahubCompaniesByProgramme,
  getCompaniesForDropdown,
};

