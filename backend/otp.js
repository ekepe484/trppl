// backend/otp.js
const nodemailer = require('nodemailer');
const config     = require('./config');
let emailTransporter = null;

async function getEmailTransporter() {
  if (emailTransporter) return emailTransporter;
  if (config.isDev && (!config.email.user || !config.email.pass)) {
    const testAccount = await nodemailer.createTestAccount();
    emailTransporter  = nodemailer.createTransport({ host:'smtp.ethereal.email', port:587, secure:false, auth:{user:testAccount.user,pass:testAccount.pass} });
    console.log(`[OTP] Ethereal: ${testAccount.user}`);
  } else {
    emailTransporter = nodemailer.createTransport({ host:config.email.host, port:config.email.port, secure:config.email.secure, auth:{user:config.email.user,pass:config.email.pass} });
  }
  return emailTransporter;
}

async function sendOtpEmail({ to, name, code, purpose }) {
  const label = purpose==='register' ? 'verify your account' : 'sign in';
  const t = await getEmailTransporter();
  const info = await t.sendMail({
    from: config.email.from, to,
    subject: `${code} — Your Trppl verification code`,
    text: `Hi ${name},\n\nYour Trppl code to ${label} is: ${code}\n\nExpires in 10 minutes. Do not share.\n\n— Trppl`,
    html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f4f8;font-family:-apple-system,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;"><tr><td align="center"><table width="100%" style="max-width:480px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08);"><tr><td style="background:#1a1a2e;padding:28px 32px;text-align:center;"><div style="color:#fff;font-size:26px;font-weight:700;letter-spacing:4px;">TRPPL</div></td></tr><tr><td style="padding:32px;"><h1 style="margin:0 0 8px;font-size:20px;color:#111;">Your verification code</h1><p style="font-size:14px;color:#555;margin:0 0 24px;">Hi <strong>${name}</strong>, use this code to ${label}.</p><div style="text-align:center;background:#f4f4f8;border-radius:12px;padding:24px;margin-bottom:24px;"><div style="font-size:42px;font-weight:700;letter-spacing:12px;color:#7c3aed;">${code}</div></div><p style="font-size:13px;color:#888;margin:0;">Expires in <strong>10 minutes</strong>. Never share this code.</p></td></tr><tr><td style="background:#f9f9f9;padding:16px 32px;text-align:center;"><p style="margin:0;font-size:12px;color:#bbb;">© ${new Date().getFullYear()} Trppl</p></td></tr></table></td></tr></table></body></html>`,
  });
  if (config.isDev) { const p=nodemailer.getTestMessageUrl(info); if(p) console.log('[OTP] Preview:', p); }
}

async function sendOtpSms({ to, code, purpose }) {
  const label = purpose==='register' ? 'verify your Trppl account' : 'sign in to Trppl';
  if (config.twilio.devMode || !config.twilio.accountSid) {
    console.log(`[OTP] SMS to ${to}: ${code}  (dev mode — not sent)`); return;
  }
  const twilio = require('twilio')(config.twilio.accountSid, config.twilio.authToken);
  await twilio.messages.create({ body:`Your Trppl code to ${label} is: ${code}. Expires in 10 minutes.`, from:config.twilio.fromNumber, to });
}

async function sendOtp({ method, to, name, code, purpose }) {
  if (method==='phone') await sendOtpSms({to,code,purpose});
  else await sendOtpEmail({to,name,code,purpose});
}

module.exports = { sendOtp };
