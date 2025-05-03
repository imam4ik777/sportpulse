const mongoose = require('mongoose');

// Схема для счета матча
const ScoreSchema = new mongoose.Schema({
  home: { type: Number, default: null },
  away: { type: Number, default: null }
});

// Схема для матча
const MatchSchema = new mongoose.Schema({
  // Уникальный идентификатор матча в SportMonks
  sportmonksId: { type: String, unique: true, sparse: true },
  
  // Команды
  home: { type: String, required: true },
  away: { type: String, required: true },
  
  // Ссылки на модель Team
  homeTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  awayTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  
  // Время и дата
  date: { type: Date, required: true },
  time: { type: String },
  
  // Статус матча: LIVE, UPCOMING, FINISHED
  status: { 
    type: String, 
    enum: ['LIVE', 'UPCOMING', 'FINISHED'],
    required: true,
    default: 'UPCOMING'
  },
  
  // Счет матча
  score: { type: ScoreSchema, default: () => ({}) },
  
  // Дополнительная информация
  tournament: { type: String },
  venue: { type: String },
  
  // Метаданные
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Индексы для ускорения запросов
MatchSchema.index({ status: 1, date: 1 });
MatchSchema.index({ tournament: 1 });
MatchSchema.index({ homeTeam: 1 });
MatchSchema.index({ awayTeam: 1 });

// Pre-save middleware для обновления updatedAt
MatchSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Match = mongoose.model('Match', MatchSchema);

module.exports = Match;