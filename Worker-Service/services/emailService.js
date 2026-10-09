import nodemailer from "nodemailer";

let transporter = null;

export const initEmailTransporter = async () => {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.ethereal.email",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    console.log("✉️ SMTP Transport initialized with configured credentials.");
  } else {
    // Generate test account on Ethereal or use JSON transport fallback
    transporter = nodemailer.createTransport({
      jsonTransport: true
    });
    console.log("✉️ Nodemailer initialized with mock JSON transport for development.");
  }
};

export const sendEmail = async ({ to, from, subject, body }) => {
  if (!transporter) {
    await initEmailTransporter();
  }

  const mailOptions = {
    from: from || "noreply@notification.com",
    to,
    subject,
    text: body,
    html: `<p>${body}</p>`
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`📧 Email sent to ${to} | Subject: ${subject}`);
  return info;
};
