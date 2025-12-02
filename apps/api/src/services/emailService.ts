import nodemailer from "nodemailer";
import { AlertRule, AlertTriggerEvent } from "@nova/core";
import { env } from "../config/env";

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  auth: env.smtp.user
    ? {
        user: env.smtp.user,
        pass: env.smtp.pass,
      }
    : undefined,
});

function buildAlertBody(event: AlertTriggerEvent, rule: AlertRule) {
  const lines = [
    `Alert triggered: ${rule.description ?? rule.conditionType}`,
    `Rule ID: ${rule.id}`,
    `Symbol: ${rule.symbolId}`,
    `Timeframe: ${rule.timeframe}`,
    `Condition: ${rule.conditionType}`,
    `Left value: ${event.leftValue}`,
    `Right value: ${event.rightValue}`,
    `Triggered at: ${new Date(event.triggeredAt).toISOString()}`,
  ];
  return lines.join("\n");
}

export async function sendAlertEmail(event: AlertTriggerEvent, rule: AlertRule) {
  if (!env.smtp.to || !env.smtp.from) {
    // eslint-disable-next-line no-console
    console.warn("SMTP config missing destination or from address; skipping email send.");
    return;
  }

  await transporter.sendMail({
    from: env.smtp.from,
    to: env.smtp.to,
    subject: `[NovaCharts] Alert for ${rule.symbolId} ${rule.timeframe} ${rule.conditionType}`,
    text: buildAlertBody(event, rule),
  });
}

export async function sendTestEmail(to?: string) {
  const destination = to ?? env.smtp.to;
  if (!env.smtp.from || !destination) {
    throw new Error("SMTP_FROM and ALERT_EMAIL_TO must be set to send test email.");
  }

  await transporter.sendMail({
    from: env.smtp.from,
    to: destination,
    subject: "[NovaCharts] Test Email",
    text: "NovaCharts email configuration is working.",
  });
}
