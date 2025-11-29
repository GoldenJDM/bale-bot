// server.js
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN || '2022856274:GtytWOVBXhHbB5uphyyFlCIvh5ZVuxwAsnY';
const API_URL = `https://messengerg.api.bale.ai/bot${BOT_TOKEN}`;

// دریافت بدنه‌ی JSON از درخواست‌ها
app.use(express.json());

// ذخیره‌سازی ساده در حافظه (برای تست)
// در استفادهٔ واقعی، بهتره از Redis یا دیتابیس استفاده کنی
const linkMap = new Map(); // { 'ABC123' => 123456789 }

// endpoint webhook
app.post(`/webhook/${BOT_TOKEN}`, async (req, res) => {
  const message = req.body?.message;
  if (!message || !message.text || !message.chat?.id) {
    return res.sendStatus(200);
  }

  const chatId = message.chat.id;
  const text = message.text.trim();
  const parts = text.split(' ');

  // حالت ۱: کاربر از لینک وارد شده — مثلاً /start ABC123
  if (parts[0] === '/start' && parts[1]) {
    const code = parts[1];
    const ownerId = linkMap.get(code);

    if (ownerId) {
      // ذخیره اینکه این کاربر، فرستندهٔ ناشناس برای ownerId هست
      linkMap.set(`anon_${chatId}`, ownerId);
      await send(chatId, "پیام ناشناس خود را ارسال کنید:");
    } else {
      await send(chatId, "❌ لینک نامعتبر است.");
    }
  }
  // حالت ۲: کاربر اولیه — لینک شخصی بده
  else if (parts[0] === '/start') {
    const code = generateCode(6);
    linkMap.set(code, chatId);
    const link = `https://ble.ir/gdvfd1bot?start=${code}`;
    await send(chatId, `📬 جعبهٔ پیام ناشناس شما:\n\n${link}\n\nهر کسی این لینک را باز کند، می‌تواند به صورت ناشناس برای شما پیام بفرستد.`);
  }
  // حالت ۳: ارسال پیام ناشناس
  else {
    const targetId = linkMap.get(`anon_${chatId}`);
    if (targetId) {
      await send(targetId, `📩 پیام ناشناس:\n\n${text}`);
      await send(chatId, "✅ پیام شما ارسال شد!");
      linkMap.delete(`anon_${chatId}`); // یک‌بار مصرف
    } else {
      // اولین بار — لینک بده
      const code = generateCode(6);
      linkMap.set(code, chatId);
      const link = `https://ble.ir/gdvfd1bot?start=${code}`;
      await send(chatId, `📬 جعبهٔ پیام ناشناس شما:\n\n${link}`);
    }
  }

  res.sendStatus(200);
});

// تابع ارسال پیام
async function send(chatId, text) {
  try {
    await axios.post(`${API_URL}/sendMessage`, {
      chat_id: chatId,
      text: text
    });
  } catch (err) {
    console.error("خطا در ارسال به بله:", err.message);
  }
}

// تولید کد تصادفی (مثلاً: Xk9M2p)
function generateCode(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// راه‌اندازی سرور
app.listen(PORT, () => {
  console.log(`✅ ربات "تست 1" در حال اجراست روی پورت ${PORT}`);
  console.log(`🔗 webhook URL: https://your-domain.com/webhook/${BOT_TOKEN}`);
});