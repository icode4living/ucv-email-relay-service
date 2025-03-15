import express, { Request, Response } from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const API_KEY = process.env.VERCEL_API_KEY || "";

// Logger function
const log = (type: string, message: string, data: object = {}) => {
  console.log(`[${new Date().toISOString()}] [${type}] ${message}`, data);
};

// Email Options Type
interface EmailOptions {
  to: string | string[];
  subject: string;
  message: string;
}

app.post("/send-email", async (req: Request, res: Response) => {
  log("INFO", "Incoming email request", { headers: req.headers, body: req.body });

  if (req.headers["x-api-key"] !== API_KEY) {
    log("ERROR", "Unauthorized API request");
     res.status(401).json({ error: "Unauthorized" });
     return
  }

  const { to, subject, message }: EmailOptions = req.body;

  if (!to || !subject || !message) {
    log("ERROR", "Invalid request parameters", { to, subject, message });
     res.status(400).json({ error: "Missing required fields" });
     return
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    log("INFO", "Sending email", { to, subject });

    const info = await transporter.sendMail({
      from: `"BidNG" <${process.env.SMTP_FROM_EMAIL}>`,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html: message,
    });

    log("SUCCESS", "Email sent successfully", { messageId: info.messageId });

    res.status(200).json({ message: "Email sent", messageId: info.messageId });
  } catch (error) {
    log("ERROR", "Failed to send email", { error: (error as Error).message });
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => log("INFO", `Server running on port ${PORT}`));

export default app;
