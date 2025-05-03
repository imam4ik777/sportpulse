# Собираем и поднимаем все сервисы
up:
	docker-compose up -d

# Только backend (и зависимости)
backend:
	docker-compose up -d backend mongo redis

# Только frontend (например, если backend уже работает)
frontend:
	docker-compose up -d frontend

# Останавливаем все сервисы
down:
	docker-compose down

# Логирование всех сервисов
logs:
	docker-compose logs -f

# Перезапуск всех сервисов
restart:
	docker-compose down && docker-compose up -d