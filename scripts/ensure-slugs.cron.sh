#!/usr/bin/env bash
set -Eeuo pipefail

cd /var/www/vhosts/igoshev.de/blow.igoshev.de

# переменные окружения
export REBUILD_AUTO_SLUGS=1
export MONGODB_URI='mongodb://gen_user:%7C1q%3Aam%26%25T7JZiD@109.73.205.45:27017/blow?authSource=admin&directConnection=true'

# запуск (любой из двух вариантов ниже):

# Вариант A: через npx (если в проекте установлен ts-node)
# удобен и простой
/opt/plesk/node/18/bin/npx ts-node ./scripts/ensure-slugs.ts >> ./ensure-slugs.log 2>&1

# Вариант B: без npx, если он шалит — через node + ts-node/register
# /opt/plesk/node/18/bin/node -r ts-node/register ./scripts/ensure-slugs.ts >> ./ensure-slugs.log 2>&1
