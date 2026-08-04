import nodemailer from "nodemailer";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ success: false, error: "Method not allowed" });
    return;
  }

  const { name, email, message } = req.body || {};
  if (!name || !email || !message || !EMAIL_RE.test(email)) {
    res.status(400).json({ success: false, error: "Missing or invalid fields" });
    return;
  }

  try {
    // Google displays App Passwords as four space-separated groups
    // ("abcd efgh ijkl mnop"), and pasting it verbatim — or picking up a stray
    // trailing newline when setting the env var — makes Gmail reject the login
    // with "535-5.7.8 Username and Password not accepted". Strip whitespace so
    // the value works whether or not it was pasted in Google's display format.
    const gmailUser = process.env.GMAIL_USER?.trim();
    const gmailPass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");

    if (!gmailUser || !gmailPass) {
      res.status(500).json({
        success: false,
        error: "Email is not configured on the server (GMAIL_USER / GMAIL_APP_PASSWORD).",
      });
      return;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailPass },
    });

    await transporter.sendMail({
      from: `"Portfolio Contact" <${gmailUser}>`,
      to: gmailUser,
      replyTo: email,
      subject: `New message from ${name} — via portfolio`,
      text: `${message}\n\n— ${name} (${email})`,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
