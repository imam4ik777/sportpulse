FROM node:18

WORKDIR /app

# Копируем package.json и lock-файл
COPY package*.json ./

# Устанавливаем зависимости (включая craco)
RUN npm install

# Копируем всё приложение
COPY . .

# Включаем поддержку автообновления
ENV CHOKIDAR_USEPOLLING=true

# Открываем порт, используемый CRA (через craco)
EXPOSE 3000

# Запускаем через craco
CMD ["npm", "start"]