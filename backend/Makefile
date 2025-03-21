
build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

logsApp:
	docker compose logs -f app

logsDb:
	docker compose logs -f mongodb

restart: down up

clean:
	docker compose down --volumes --rmi all

cleanImgDb:
	docker rmi -f mongo:latest

.PHONY: up down restart build clean