import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import { todayKey } from "../lib/utils";

// Preload env vars like daily.ts does
import "./_env";

async function main() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_TO } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !EMAIL_TO) {
    console.log("[email] SMTP configuration missing in .env.local. Skipping email delivery.");
    return;
  }

  const dateStr = todayKey();
  const reportDir = path.join(process.cwd(), "daily_reports", dateStr);
  const htmlPath = path.join(reportDir, `${dateStr}.html`);
  const jsonPath = path.join(reportDir, `${dateStr}.json`);

  if (!fs.existsSync(htmlPath) || !fs.existsSync(jsonPath)) {
    console.error(`[email] Report files for ${dateStr} not found. Did the generation fail?`);
    process.exit(1);
  }

  const jsonStr = fs.readFileSync(jsonPath, "utf-8");
  const report = JSON.parse(jsonStr);

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 465,
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  const repoUrl = `https://sllTrixie.github.io/dailyBrief/`;

  const htmlBody = `
  <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #2c3e50;">今日简报已生成：${report.hero_headline}</h2>
    
    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="margin-top: 0; color: #1a73e8;">【今日概览】</h3>
      <p style="white-space: pre-wrap;">${report.daily_overview}</p>
    </div>

    <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
      <h3 style="margin-top: 0; color: #856404;">【人生建议】</h3>
      <p style="white-space: pre-wrap; color: #856404;">${report.career_advice || "暂无建议"}</p>
    </div>

    <div style="text-align: center; margin-top: 30px;">
      <a href="${repoUrl}" style="background-color: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        👉 猛戳这里在手机上阅读今日完整简报
      </a>
      <p style="font-size: 12px; color: #999; margin-top: 15px;">直接点击即可在手机浏览器中获得最佳的无缝阅读体验</p>
    </div>
  </div>
  `;

  console.log(`[email] Sending email to ${EMAIL_TO}...`);
  try {
    const info = await transporter.sendMail({
      from: `"Daily Brief" <${SMTP_USER}>`,
      to: EMAIL_TO,
      subject: `[Daily Brief] ${report.hero_headline}`,
      html: htmlBody,
    });
    console.log(`[email] Email sent successfully: ${info.messageId}`);
  } catch (err) {
    console.error(`[email] Failed to send email:`, err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[email] Unhandled error:", err);
  process.exit(1);
});
