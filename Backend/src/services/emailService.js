
const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

let transporter;

const resolveTransporter = () => {
  if (transporter) return transporter;

  if (process.env.SMTP_URL) {
    transporter = nodemailer.createTransport(process.env.SMTP_URL);
    return transporter;
  }

  let host = process.env.SMTP_HOST;
  const explicitUser = process.env.SMTP_USER;
  const explicitPass = process.env.SMTP_PASS;
  const fallbackUser = process.env.EMAIL_USER;
  const fallbackPass = process.env.EMAIL_PASS;

  if (!host && fallbackUser) {
    host = "smtp.gmail.com";
    if (!process.env.SMTP_PORT) process.env.SMTP_PORT = "587";
    if (!process.env.SMTP_SECURE) process.env.SMTP_SECURE = "false";
  }

  if (!host) {
    if (String(process.env.MAIL_MOCK || "false").toLowerCase() === "true") {
      transporter = {
        sendMail: async (mailOptions) => {
          logger.warn("MAIL_MOCK=true, email will be logged instead of sent.");
          logger.info(`[mail:mock] to=${mailOptions.to} subject=${mailOptions.subject} text=${mailOptions.text}`);
          return {
            rejected: [],
            pending: [],
            accepted: Array.isArray(mailOptions.to) ? mailOptions.to : [mailOptions.to],
            messageId: `mock-${Date.now()}`,
          };
        },
      };
      return transporter;
    }

    throw new Error("SMTP configuration missing. Set SMTP_HOST or SMTP_URL to enable email delivery.");
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
  const user = explicitUser || fallbackUser;
  const pass = explicitPass || fallbackPass;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
    // Add sensible timeouts to fail fast when SMTP is unreachable
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 10000),
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 5000),
  });

  // Verify transporter immediately to provide clearer diagnostics when SMTP is unreachable
  transporter.verify().then(() => {
    // verification succeeded
    // keep transporter as-is
  }).catch((err) => {
    // Log a helpful message but do not throw here; sendMail will still fail and be reported to caller
    // Use require inside to avoid circular issues with logger mock during tests
    const _logger = require("../utils/logger");
    _logger.error("Email transporter verification failed:", err && err.message ? err.message : err);
    _logger.debug && _logger.debug(err);
  });

  return transporter;
};

const sendEmail = async ({ to, subject, text, html, from }) => {
  if (!to) throw new Error("Recipient email address is required");
  if (!subject) throw new Error("Email subject is required");
  if (!text && !html) throw new Error("Email body is required");

  const activeTransporter = resolveTransporter();
  const mailOptions = {
    to,
    subject,
    text,
    html,
    from: from || process.env.MAIL_FROM || process.env.EMAIL_USER || "no-reply@liahub.app",
  };

  const result = await activeTransporter.sendMail(mailOptions);
  return result;
};

const sendOtpEmail = async ({ to, code, name, expiresInMinutes }) => {
  const safeName = name || "there";
  const expiry = expiresInMinutes || 10;
  const subject = "Your LiaHub verification code";
  const text = `Hello ${safeName},\n\nYour verification code is ${code}. It will expire in ${expiry} minutes.\n\nIf you did not request this code, you can ignore this email.\n\nThanks,\nThe LiaHub Team`;
  const html = `<!doctype html><html><body style="font-family: Arial, Helvetica, sans-serif; color: #111;">` +
    `<p>Hello ${safeName},</p>` +
    `<p>Your verification code is <strong>${code}</strong>. It will expire in ${expiry} minutes.</p>` +
    `<p>If you did not request this code, you can safely ignore this email.</p>` +
    `<p style="margin-top: 24px;">Thanks,<br/>The LiaHub Team</p>` +
    `</body></html>`;

  await sendEmail({ to, subject, text, html });
};

module.exports = {
  sendEmail,
  sendOtpEmail,
};

// Helper for diagnostics: return the active transporter (creates it if needed)
module.exports.getTransporter = () => resolveTransporter();
