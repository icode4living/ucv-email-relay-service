"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
const API_KEY = process.env.VERCEL_API_KEY || "";
// Logger function
const log = (type, message, data = {}) => {
    console.log(`[${new Date().toISOString()}] [${type}] ${message}`, data);
};
app.post("/send-email", async (req, res) => {
    log("INFO", "Incoming email request", { headers: req.headers, body: req.body });
    if (req.headers["x-api-key"] !== API_KEY) {
        log("ERROR", "Unauthorized API request");
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const { to, subject, message } = req.body;
    if (!to || !subject || !message) {
        log("ERROR", "Invalid request parameters", { to, subject, message });
        res.status(400).json({ error: "Missing required fields" });
        return;
    }
    try {
        const transporter = nodemailer_1.default.createTransport({
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
    }
    catch (error) {
        log("ERROR", "Failed to send email", { error: error.message });
        res.status(500).json({ error: "Internal Server Error" });
    }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => log("INFO", `Server running on port ${PORT}`));
exports.default = app;
