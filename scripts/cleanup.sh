#!/bin/bash

# Очистка системы Docker
docker system prune -a -f
docker volume prune -f

# Удаление истории сборки
docker buildx history rm --all

# Удаление конфига Docker
rm -f ~/.docker/config.json
