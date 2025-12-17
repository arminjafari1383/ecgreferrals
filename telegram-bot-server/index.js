const express = require("express");
const bodyParser = require("body-parser");
const TelegramBot = require("node-telegram-bot-api");

const BOT_TOKEN = "8492644202:AAFpgf8wZZpPMXFNK1bRSJ-WFWx4u-DhHOE";
const BOT_USERNAME = "pooooooooooobot"; // همان یوزرنیم بات
const PORT = process.env.PORT || 3000;

const app = express();
app.use(bodyParser.json());

// دیتابیس ساده به صورت حافظه (برای شروع)
const referrals = {}; // {referral_code: [user_ids]}

// ساخت بات با polling (ساده‌ترین روش)
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// مدیریت start command
bot.onText(/\/start(?:\s(.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const referralCode = match[1]; // کدی که از WebApp آمده

  if (referralCode) {
    if (!referrals[referralCode]) referrals[referralCode] = [];
    if (!referrals[referralCode].includes(chatId)) {
      referrals[referralCode].push(chatId);
    }
  }

  const referralLink = `https://t.me/${BOT_USERNAME}?start=${referralCode || ""}`;
  bot.sendMessage(
    chatId,
    `🚀 این لینک من برای ثبت نام در اپ است! برای دوستانت بفرست:\n${referralLink}`
  );
});

// تست ساده HTTP endpoint
app.get("/", (req, res) => res.send("Telegram Bot Server is running"));

// سرور Express را اجرا کن
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
