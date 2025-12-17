# استفاده از Node.js رسمی
FROM node:20

# ایجاد دایرکتوری کاری
WORKDIR /usr/src/app

# کپی package.json و نصب وابستگی‌ها
COPY package*.json ./
RUN npm install

# کپی همه فایل‌ها
COPY . .

# پورت پیش‌فرض
EXPOSE 3000

# دستور اجرای سرور
CMD ["node", "index.js"]
