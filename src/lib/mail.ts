// src/lib/mail.ts
// Server-only helper for sending password reset emails

import type SMTPTransport from "nodemailer/lib/smtp-transport";

let cachedTransporter: import("nodemailer").Transporter<SMTPTransport.SentMessageInfo> | null = null;

async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const nodemailer = await import("nodemailer");

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error(
      "SMTP configuration missing. Check SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS env vars."
    );
  }

  cachedTransporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // 465 = SSL, 587 = STARTTLS
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  return cachedTransporter;
}

export async function sendPasswordResetEmail(opts: {
  to: string;
  code: string;
}) {
  const { to, code } = opts;
  const transporter = await getTransporter();

  const html = `
    <p>Hi,</p>
    <p>You requested to reset your Veilscope password.</p>
    <p>Your password reset code is:</p>
    <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">
      ${code}
    </p>
    <p>This code will expire in ${
      process.env.PASSWORD_RESET_EXPIRY_MINUTES || 15
    } minutes.</p>
    <p>If you didn't request this, you can safely ignore this email.</p>
    <p>– Veilscope Support</p>
  `;

  await transporter.sendMail({
    from:
      process.env.SMTP_FROM || "Veilscope Support <support@veilscope.com>",
    to,
    subject: "Veilscope password reset code",
    html,
  });
}
