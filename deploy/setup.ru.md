# Настройка VPS с нуля (практический гайд)

Пошаговая инструкция для запуска PLECTIX на одном VPS (Ubuntu 24.04, Docker).
Всё, что ниже — команды и решения, которые мы уже прошли вживую.

> Сокращения: `<IP>` — IP сервера (у нас `82.146.46.237`), `~` = `/root` для root-пользователя.

## 0. Получили VPS

- **VPS:** 2 vCPU / 4 GB RAM / 40 GB SSD (без авто-бэкапов у провайдера — поэтому свои бэкапы обязательны).
- **Data:** доступ `root` + IP + пароль (или ключ).

---

## 1. Подключение по SSH (PowerShell)

```powershell
ssh root@<IP>
```
- На первый вопрос про host key — `yes`.
- Введи пароль root (символы не видны — это норм).

### Чтобы сессия не отваливалась по простою (idle)
На сервере один раз:
```bash
printf "ClientAliveInterval 60\nClientAliveCountMax 3\n" >> /etc/ssh/sshd_config.d/keepalive.conf
systemctl restart ssh
```
(или `ServerAliveInterval 60` в локальном `~/.ssh/config`).

---

## 2. Базовая настройка системы

```bash
apt update && apt upgrade -y
```

### SWAP (бесплатно, из диска; защита от OOM при байте Piston/нагрузке)
```bash
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
free -h
```
> Свап — это файл на SSD (не доплата за ОЗУ). Можно 2–4 ГБ.

### Docker + Compose v2
```bash
curl -fsSL https://get.docker.com | sh
```

### Firewall (срочно открой 22/80/443, чтобы не отрезать себе SSH)
```bash
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable -y
ufw status
```

### Каталог приложения
```bash
mkdir -p ~/lms && cd ~/lms
```

---

## 3. Залить файлы проекта на сервер (scp, с локальной машины)

Из PowerShell (из папки репо):
```powershell
scp docker-compose.prod.yml deploy/roll.sh deploy/backup.sh root@<IP>:~/lms/deploy/
scp .env.prod root@<IP>:~/lms/.env.prod
```
> `deploy/nginx.conf` **не нужен** — он уже вшит в образ фронта.

⚠️ **CRLF (Windows-переносы строк):** если файлы создавались/редактировались в Windows, у них будет `\r`, из-за чего `bash`-скрипты падают (`set: pipefail: invalid option name`), а `.env.prod` получает «хвосты». Проверка и фикс:
```bash
cat -A ~/lms/deploy/backup.sh | sed -n '7p'          # если видишь ^M$ — есть CRLF
sed -i 's/\r$//' ~/lms/deploy/backup.sh
sed -i 's/\r$//' ~/lms/deploy/roll.sh
sed -i 's/\r$//' ~/lms/.env.prod
```
(в репо скрипты уже в LF и с шебангом `#!/bin/bash`).

---

## 4. `.env.prod` — заполнить

Файл `~/lms/.env.prod` (создай из `.env.prod.example`, отредактируй `nano`).

**Ключевое (без этого не поднимется):**
```ini
PUBLIC_URL=http://<IP>                 # без домена пока
CORS_ORIGINS=http://<IP>
FRONTEND_HOST=http://<IP>
STORAGE_PUBLIC_BASE_URL=http://<IP>/media

POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASS=<сильный пароль>
POSTGRES_DB=lms

REDIS_USER=default
REDIS_PASSWORD=<пароль>

MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=<пароль>
STORAGE_BUCKET=lms-media

STORAGE_BACKEND=s3
STORAGE_ENDPOINT_URL=http://minio:9000
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=<пароль MINIO>        # = MINIO_ROOT_PASSWORD
STORAGE_REGION=us-east-1

JWT_SECRET_KEY=<64 hex>
APP_ENV=production

# Оплата — пока тест
PAYMENT_PROVIDER_MODE=mock
PAYMENT_PLATFORM_FEE_PERCENT=0
# Почта — пока без домена
MAIL_ENABLED=false
# Реестр образов — СТРОЧНЫМИ!
REGISTRY_NS=alexgdevs/lms
IMAGE_TAG=latest
```

> ⚠️ `REGISTRY_NS` — **строчными** (`alexgdevs/lms`, а не `AlexgDevs/lms`), иначе `docker pull` не найдёт образ.

### Генерация секретов (без openssl)
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"    # JWT_SECRET_KEY
python3 -c "import secrets; print(secrets.token_hex(20))"    # пароли (postgres/redis/minio)
```
Запасной: `od -An -N32 -tx1 /dev/urandom | tr -d '  \n'`.

---

## 5. Собрать образы в ghcr (нужно один раз и при релизах)

Образы `backend`/`frontend` собираются **только CI по тегу `v*`** — локально на сервере собирать нечем (compose тянет готовые образа).

Локально (с фронтовой машины):
```bash
git checkout main && git merge dev      # релиз из main (правильно по структуре)
git tag v0.1.0                          # имя точно `vX.Y.Z` (с префиксом v)
git push origin main --tags
```
В GitHub Actions → job **`build-and-push`** должен стать зелёным (собирает и пушит `backend:latest`, `frontend:latest`).
> Job **`deploy`** упадёт, пока не настроены секреты SSH — **игнорируй**, для ручного запуска он не нужен. Минуты — это просто лимит пакета, не «платно сгорает».

---

## 6. Логин в ghcr и первый запуск

На сервере создай **PAT** (GitHub → Settings → Developer settings → Tokens) с правом `read:packages`:

```bash
cd ~/lms
echo "$GHCR_TOKEN" | docker login ghcr.io -u alexgdevs --password-stdin   # юзер СТРОЧНЫМИ
```
(`GHCR_TOKEN` — твой PAT; `ghcr` требует lowercase-логин.)

Затем:
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod pull backend backend-1 worker nginx migrate
docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm migrate
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

---

## 7. Проверка (и почему `ps`/`logs` должны быть с `-f`)

⚠️ `docker compose ps` / `logs` **без** `-f docker-compose.prod.yml --env-file .env.prod` выдаст
`no configuration file provided` — потому что у тебя файл называется `docker-compose.prod.yml`, а не дефолтный `docker-compose.yml`.

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
docker compose -f docker-compose.prod.yml --env-file .env.prod logs backend | tail -n 30
curl -s http://localhost
```
Открыть в браузере: `http://<IP>`.

Ожидание: `postgres`, `redis`, `minio`, `minio-init`, `backend`, `backend-1`, `worker`, `nginx` — `Up`/`healthy`; `migrate` — `Exited (0)` (это нормально — одноразовый).

---

## 8. Логи и БД (DBeaver)

### Логи
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f backend
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f nginx
# или напрямую:
docker logs plm-backend-1 -f
```

### Подключение к Postgres через DBeaver (БД в контейнере, наружу порт не открыт)
Два способа:

**А) Через IP контейнера (быстро, без правок compose):**
```bash
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' plm-postgres-1   # → 172.x.x.x
```
В DBeaver:
- Проба: Host = `172.x.x.x`, Port = `5432`
- Вкладка **SSH**: Host `82.146.46.237`, Port `22`, User `root`, пароль.
- Database `lms`, User `postgres`, Password = `POSTGRES_PASS`.
(IP контейнера меняется после пересоздания — на будущее способ Б.)

**Б) Опубликовать БД на loopback сервера (стабильно, но правится compose):**
В `docker-compose.prod.yml` у сервиса `postgres` добавить:
```yaml
    ports:
      - "127.0.0.1:5433:5432"
```
→ `docker compose -f docker-compose.prod.yml --env-file .env.prod up -d postgres`
В DBeaver:
- Host = `127.0.0.1`, Port = `5433`, вкладка SSH = сервер (`82.146.46.237` / `root`).
(`127.0.0.1:` — порт виден только на сервере, в интернет не торчит — безопасно.)

> `EOFException` в DBeaver обычно = туннель есть, а цель (порт БД) на сервере не слушает: значит Main-Port не совпадает (должен быть проброшенный/контейнерный), либо SSH-авторизация. Проверь сначала `ssh root@<IP>` без туннеля.

---

## 9. Бэкапы (провайдер без авто-бэкапов — обязательно)

`~/lms/deploy/backup.sh` уже залит. Сделать исполняемым + cron:
```bash
chmod +x ~/lms/deploy/backup.sh
crontab -e
```
строка:
```
0 3 * * * /bin/bash /root/lms/deploy/backup.sh
```
Проверить разово:
```bash
bash ~/lms/deploy/backup.sh
ls -lh /var/backups && ls /var/backups/media
```
Бэкап = логический дамп БД (`/var/backups/lms_<дата>.dump`) + mirror MinIO-бакета (`/var/backups/media`).
> Восстановление см. в `deploy/deploy.ru.md`. Команды MinIO должны быть с `--entrypoint sh` (иначе `mc: 'sh' is not a recognized command`).

---

## 10. Как менять настройки (важно: пересборка НЕ всегда нужна)

| Что меняешь | Что делать |
| --- | --- |
| **`.env.prod`** (любые значения: SMTP, AI, YooKassa, настройки) | `docker compose -f docker-compose.prod.yml --env-file .env.prod up -d` — контейнеры пересоздадутся, **без `--build`/`pull`** |
| **Пароли БД/Redis/MinIO** | те же команды, но с `down -v` и перезапуском (см. ниже) |
| **Код/фронт** | CI по тегу `v*` (пересборка образа) → `docker compose ... pull` → `up -d` |
| **Piston** (опц.) | `docker compose -f docker-compose.prod.yml --env-file .env.prod --profile codeexec up -d piston` |

### Смена паролей БД/Redis/MinIO (только если уже раньше поднимал)
Пароли env применяются **только при инициализации volume**. Менять их без сброса volume НЕльзя (старая БД уже со старым паролем). Поэтому, пока нет ценных данных:
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod down -v
docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm migrate
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```
> `down -v` **удаляет данные** БД + MinIO-бакет. На будущее (с данными) — смени пароль через `ALTER USER`/`mc`, иначе бекап+restore.

---

## 11. Rolling-обновление (без простоя, когда уже запущено)

```bash
bash ~/lms/deploy/roll.sh
```
Делает: `pull` → `migrate` → пересоздаёт `backend-1` (новая) → ждёт healthy → пересоздаёт `backend`. За nginx `upstream` из двух реплик — простоя нет.

---

## 12. Дальше по роад-мапу

- **Домен + HTTPS** (после идентификации): `PUBLIC_URL=https://<домен>`, Let’s Encrypt (certbot, серты — в nginx 443), пересборка фронта CI по тегу `v*`.
- **Реальные ключи YooKassa**: `PAYMENT_PROVIDER_MODE=yookassa` + `YOOKASSA_SHOP_ID`/`SECRET_KEY`, `PAYMENTS_SANDBOX=false` → `bash deploy/roll.sh`.
- **Piston** — включить profile `codeexec` (нужна cgroup v2, на Ubuntu 24.04 уже есть).

---

## 13. Типовые ошибки

| Ошибка | Причина | Решение |
| --- | --- | --- |
| `set: pipefail: invalid option name` | файл с CRLF или запуск через `sh` | `sed -i 's/\r$//'` + `bash <file>` |
| `invalid tag ... must be lowercase` | `${{ github.repository }}` с большими буквами | фикс уже в `deploy.yml` (нижний регистр) |
| `docker compose ps: no configuration file` | забыл `-f docker-compose.prod.yml --env-file .env.prod` | добавляй флаги |
| `pull` не находит `backend` | `REGISTRY_NS` не строчными / нет логина ghcr / образ ещё не докачан | `alexgdevs/lms` + `docker login` + подожди |
| `mc: 'sh' is not a recognized command` | у `minio/mc` entrypoint = mc | добавить `--entrypoint sh` и `-c` |
| `EOFException` в DBeaver | цель туннеля не слушает / авторизация SSH | Main-Port = проброшенный (5433) или IP контейнера; проверь `ssh root@<IP>` |
| сайт не открывается по IP | firewall закрыл 80 | `ufw allow 80` |
| backend рестартится | env/пароли | `docker compose ... logs backend` |
