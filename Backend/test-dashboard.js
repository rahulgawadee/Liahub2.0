
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "rahulgawade360@gmail.com",
    pass: "nsok gpan utbm bfny",
  },
});

async function sendTest() {
  try {
    await transporter.verify();
    console.log("✅ SMTP Connected Successfully");
    const info = await transporter.sendMail({
      from: '"Stilify" <rahulgawade360@gmail.com>',
      to: "rahulgawade360@gmail.com",
      subject: "Test Email",
      text: "This is a test email from your local backend",
    });
    console.log("📩 Sent:", info.messageId);
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

sendTest();
