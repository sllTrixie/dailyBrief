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

  const bodyText = `
今日简报已生成：${report.hero_headline}

【今日概览】
${report.daily_overview}

【人生建议】
${report.career_advice || "暂无建议"}

请在附件中查看完整的图文排版简报（下载后用浏览器打开即可体验完美排版）。
`;

  console.log(`[email] Sending email to ${EMAIL_TO}...`);
  try {
    const info = await transporter.sendMail({
      from: `"Daily Brief" <${SMTP_USER}>`,
      to: EMAIL_TO,
      subject: `[Daily Brief] ${report.hero_headline}`,
      text: bodyText,
      attachments: [
        {
          filename: `daily-brief-${dateStr}.html`,
          path: htmlPath,
        },
      ],
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
