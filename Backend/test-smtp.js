// test-smtp.js
// Local SMTP connectivity check (does not send an email).
// Usage (PowerShell):
//   node Backend/test-smtp.js
//
// Optional: In production, you can also enable the internal probe endpoint by setting
// SMTP_TEST_TOKEN (random string) and calling:
//   GET /api/v1/internal/test-smtp with header: x-smtp-test-token: <your-token>
// For Vercel serverless wrapper, the full path is /api/api/v1/internal/test-smtp.

const nodemailer = require("nodemailer");

(async () => {
  try {
    const useUrl = process.env.SMTP_URL;
    const transport = useUrl
      ? nodemailer.createTransport(useUrl)
      : nodemailer.createTransport({
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: Number(process.env.SMTP_PORT || 587),
          secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
          auth:
            process.env.SMTP_USER && process.env.SMTP_PASS
              ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
              : undefined,
          connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 10000),
          greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 5000),
        });

    await transport.verify();
    console.log("SMTP verify OK");
    process.exit(0);
  } catch (err) {
    console.error("SMTP verify failed:", err && err.message ? err.message : err);
    process.exit(2);
  }
})();