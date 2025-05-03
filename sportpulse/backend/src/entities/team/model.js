const mongoose = require('mongoose');

// Схема для команды
const TeamSchema = new mongoose.Schema({
  // Уникальный идентификатор команды в SportMonks
  sportmonksId: { type: String, unique: true, sparse: true },
  
  // Основная информация
  name: { type: String, required: true },
  logo: { type: String },
  country: { type: String, required: true },
  
  // Дополнительная информация
  league: { type: String },
  founded: { type: Number },
  venue: { type: String },
  coach: { type: String },
  
  // Рейтинг для определения популярных команд
  rating: { type: Number, default: 0 },
  
  // Метаданные
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Индексы для ускорения запросов
TeamSchema.index({ name: 'text' });
TeamSchema.index({ country: 1 });
TeamSchema.index({ league: 1 });
TeamSchema.index({ rating: -1 });

// Pre-save middleware для обновления updatedAt
TeamSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Team = mongoose.model('Team', TeamSchema);

module.exports = Team; 