// backend/src/shared/config/mongo.js
const mongoose = require('mongoose');
const { MONGO_URI } = process.env;

async function connectMongo() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB подключена');
  } catch (err) {
    console.error('❌ Ошибка при подключении к MongoDB:', err.message);
  }
}

module.exports = { connectMongo };