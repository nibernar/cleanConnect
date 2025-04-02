
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

# Cible pour créer un utilisateur admin
admin:
	@echo "Exécution du script de création d'admin..."
	@# Lire MONGO_URI depuis .env (suppose un format simple MONGO_URI=...)
	$(eval MONGO_URI_VALUE := $(shell grep ^MONGO_URI= .env | cut -d '=' -f2-))
	@# Vérifier si MONGO_URI a été trouvé
	$(if $(MONGO_URI_VALUE),,	@echo "Erreur: MONGO_URI non trouvé ou vide dans .env"; exit 1)
	@echo "Utilisation de MONGO_URI: $(MONGO_URI_VALUE)"
	@# Exécute le script Node dans un conteneur app temporaire et interactif
	@# Passe la variable MONGO_URI avec l'option -e
	docker compose run --rm -e MONGO_URI="$(MONGO_URI_VALUE)" app npm run create-admin

restart: down up

clean:
	docker compose down --volumes --rmi all

cleanImgDb:
	docker rmi -f mongo:latest

# Ajouter la nouvelle cible à .PHONY
.PHONY: up down restart build clean admin
