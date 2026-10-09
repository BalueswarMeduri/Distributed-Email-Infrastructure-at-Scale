import nodemailer from "nodemailer";

let transporter = null;

export const initEmailTransporter = async () => {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.ethereal.email",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      pool: true, // Reuse persistent SMTP socket connections!
      maxConnections: 10,
      maxMessages: 100,
      connectionTimeout: 5000,
      socketTimeout: 5000,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    console.log(`✉️ Pooled SMTP Transport initialized for: ${process.env.SMTP_USER}`);
  } else {
    transporter = nodemailer.createTransport({
      jsonTransport: true
    });
    console.log("✉️ Nodemailer initialized with fallback JSON transport.");
  }
};

export const sendEmail = async ({ to, from, subject, body }) => {
  if (!transporter) {
    await initEmailTransporter();
  }

  const mailOptions = {
    from: from || process.env.SMTP_USER || "jamel27@ethereal.email",
    to,
    subject,
    text: body,
    html: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #081e19;">${subject}</h2>
      <p style="font-size: 14px; line-height: 1.6;">${body}</p>
      <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;" />
      <p style="font-size: 11px; color: #888;">Dispatched via Scalable Notification Platform</p>
    </div>`
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`⚡ [Instant Dispatch] Email Delivered to ${to} | Subject: ${subject}`);
  
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`🔗 Ethereal Live Inbox Preview: ${previewUrl}`);
  }

  return info;
};
