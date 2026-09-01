# VPS setup from scratch (hands-on guide)

Step-by-step instructions to run PLECTIX on a single VPS (Ubuntu 24.04, Docker).
Everything below is the practical path we actually walked.

> Shortcuts: `<IP>` — server IP, `~` = `/root` for the root user.

## 0. What you got

- **VPS:** 2 vCPU / 4 GB RAM / 40 GB SSD (no provider auto-backups — so our own backups are a must).
- **Access:** `root` + IP + password (or key).

---

## 1. SSH (PowerShell)

```powershell
ssh root@<IP>
```
- Answer `yes` to the host-key prompt.
- Type the root password (characters are hidden — normal).

### Keep the session alive (idle timeouts)
On the server, once:
```bash
printf "ClientAliveInterval 60\nClientAliveCountMax 3\n" >> /etc/ssh/sshd_config.d/keepalive.conf
systemctl restart ssh
```

---

## 2. Basic setup

```bash
apt update && apt upgrade -y
```

### SWAP (free, from disk; protects against OOM under Piston / load)
```bash
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
free -h
```

### Docker + Compose v2
```bash
curl -fsSL https://get.docker.com | sh
```

### Firewall (open 22/80/443 right away, don't cut your own SSH)
```bash
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable -y
ufw status
```

### App directory
```bash
mkdir -p ~/lms && cd ~/lms
```

---

## 3. Upload project files (scp from your machine)

From PowerShell (in the repo folder):
```powershell
scp docker-compose.prod.yml deploy/roll.sh deploy/backup.sh root@<IP>:~/lms/deploy/
scp .env.prod root@<IP>:~/lms/.env.prod
```
> `deploy/nginx.conf` is **not** needed — it is baked into the frontend image.

⚠️ **CRLF:** files edited on Windows carry `\r`, which breaks `bash` scripts (`set: pipefail: invalid option name`) and appends trailing chars to `.env.prod`. Check & fix:
```bash
cat -A ~/lms/deploy/backup.sh | sed -n '7p'      # ^M$ means CRLF present
sed -i 's/\r$//' ~/lms/deploy/backup.sh
sed -i 's/\r$//' ~/lms/deploy/roll.sh
sed -i 's/\r$//' ~/lms/.env.prod
```

---

## 4. Fill `.env.prod`

`~/lms/.env.prod` (copy from `.env.prod.example`, edit with `nano`).

**Key values:**
```ini
PUBLIC_URL=http://<IP>
CORS_ORIGINS=http://<IP>
FRONTEND_HOST=http://<IP>
STORAGE_PUBLIC_BASE_URL=http://<IP>/media

POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASS=<strong password>
POSTGRES_DB=lms

REDIS_USER=default
REDIS_PASSWORD=<password>

MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=<password>
STORAGE_BUCKET=lms-media

STORAGE_BACKEND=s3
STORAGE_ENDPOINT_URL=http://minio:9000
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=<same as MINIO password>
STORAGE_REGION=us-east-1

JWT_SECRET_KEY=<64 hex>
APP_ENV=production

PAYMENT_PROVIDER_MODE=mock
PAYMENT_PLATFORM_FEE_PERCENT=0
MAIL_ENABLED=false
REGISTRY_NS=alexgdevs/lms
IMAGE_TAG=latest
```

> ⚠️ `REGISTRY_NS` **lowercase** (`alexgdevs/lms`), otherwise `docker pull` fails.

### Generate secrets (no openssl needed)
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"    # JWT_SECRET_KEY
python3 -c "import secrets; print(secrets.token_hex(20))"    # passwords
```

---

## 5. Build images into ghcr (once + on every release)

`backend`/`frontend` images are built **only by CI on a `v*` tag** — the server cannot build them (compose pulls prebuilt images).

Locally:
```bash
git checkout main && git merge dev
git tag v0.1.0              # name must be `vX.Y.Z` (with the v prefix)
git push origin main --tags
```
In Actions the **`build-and-push`** job must turn green (builds & pushes `backend:latest`, `frontend:latest`).
> The **`deploy`** job will fail until SSH/ENV secrets are set — **ignore it**, you don't need it for the manual path. ("Minutes" is just the plan limit, not a paid burn.)

---

## 6. Login to ghcr and first launch

Create a **PAT** (`read:packages`) on GitHub, then on the server:
```bash
cd ~/lms
echo "$GHCR_TOKEN" | docker login ghcr.io -u <YOUR_LOWERCASE_USER> --password-stdin
```
Then:
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod pull backend backend-1 worker nginx migrate
docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm migrate
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

---

## 7. Verify (and why `ps`/`logs` need `-f`)

⚠️ `docker compose ps`/`logs` **without** `-f docker-compose.prod.yml --env-file .env.prod` → `no configuration file provided`.

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
docker compose -f docker-compose.prod.yml --env-file .env.prod logs backend | tail -n 30
curl -s http://localhost
```
Open `http://<IP>` in the browser. Expect `Up`/`healthy` everywhere; `migrate` = `Exited (0)` (fine, one-shot).

---

## 8. Logs & the DB (DBeaver)

### Logs
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f backend
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f nginx
# or: docker logs plm-backend-1 -f
```

### Connect to Postgres with DBeaver (DB is inside a container, port not exposed)

**A) Via container IP (fast, no compose edit):**
```bash
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' plm-postgres-1   # → 172.x.x.x
```
In DBeaver:
- Main: Host `172.x.x.x`, Port `5432`
- SSH tab: Host `82.146.46.237`, Port `22`, User `root`
- Database `lms`, User `postgres`, Password = `POSTGRES_PASS`.

**B) Publish the DB on loopback (stable, but edit compose):**
Add to `postgres` service in `docker-compose.prod.yml`:
```yaml
    ports:
      - "127.0.0.1:5433:5432"
```
→ `docker compose -f docker-compose.prod.yml --env-file .env.prod up -d postgres`
In DBeaver: Main Host `127.0.0.1`, Port `5433`, SSH tab = server (`82.146.46.237` / `root`).
(`127.0.0.1:` keeps the port private to the server.)

> `EOFException` in DBeaver usually = tunnel is up but the target DB port isn't listening on the server (wrong Main Port), or SSH auth. First check plain `ssh root@<IP>`.

---

## 9. Backups (provider has none — a must)

`~/lms/deploy/backup.sh` is uploaded. Make executable + cron:
```bash
chmod +x ~/lms/deploy/backup.sh
crontab -e
```
add:
```
0 3 * * * /bin/bash /root/lms/deploy/backup.sh
```
Test once:
```bash
bash ~/lms/deploy/backup.sh
ls -lh /var/backups && ls /var/backups/media
```
Backup = logical DB dump (`/var/backups/lms_<date>.dump`) + MinIO mirror (`/var/backups/media`).
> Restore commands live in `deploy/deploy.en.md`; MinIO commands must use `--entrypoint sh` (else `mc: 'sh' is not a recognized command`).

---

## 10. Changing settings (important: rebuild is NOT always needed)

| What you change | What to run |
| --- | --- |
| **`.env.prod`** (any value: SMTP, AI, YooKassa, settings) | `docker compose -f docker-compose.prod.yml --env-file .env.prod up -d` — recreate containers, **no `--build`/`pull`** |
| **DB/Redis/MinIO passwords** | same commands but with `down -v` first (see below) |
| **Code/frontend** | CI on tag `v*` (image rebuild) → `docker compose ... pull` → `up -d` |
| **Piston** (optional) | `docker compose -f docker-compose.prod.yml --env-file .env.prod --profile codeexec up -d piston` |

### Rotating DB/Redis/MinIO passwords (only if already initialized)
Env passwords are applied **only at volume init**. Changing them without recreating the volume won't work. While there is no valuable data:
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod down -v
docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm migrate
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```
> `down -v` **wipes** the DB + MinIO bucket. Later (with data) use `ALTER USER`/`mc`, or backup+restore.

---

## 11. Rolling update (zero-downtime, once running)

```bash
bash ~/lms/deploy/roll.sh
```
Does: `pull` → `migrate` → recreate `backend-1` (new) → wait healthy → recreate `backend`. Two replicas behind an nginx upstream → no downtime.

---

## 12. Roadmap

- **Domain + HTTPS** (after ID): `PUBLIC_URL=https://<domain>`, Let’s Encrypt (certs → nginx 443), rebuild frontend via CI tag.
- **Real YooKassa keys**: `PAYMENT_PROVIDER_MODE=yookassa` + keys, `PAYMENTS_SANDBOX=false` → `bash deploy/roll.sh`.
- **Piston**: enable `codeexec` profile (cgroup v2 is default on Ubuntu 24.04).

---

## 13. Common errors

| Error | Cause | Fix |
| --- | --- | --- |
| `set: pipefail: invalid option name` | CRLF or run via `sh` | `sed -i 's/\r$//'` + `bash <file>` |
| `invalid tag ... must be lowercase` | `${{ github.repository }}` mixed case | fixed in `deploy.yml` |
| `docker compose ps: no configuration file` | forgot `-f docker-compose.prod.yml --env-file .env.prod` | add the flags |
| `pull` can't find `backend` | `REGISTRY_NS` not lowercase / no ghcr login / image not built yet | `alexgdevs/lms` + `docker login` + wait |
| `mc: 'sh' is not a recognized command` | `minio/mc` entrypoint is `mc` | add `--entrypoint sh` and `-c` |
| `EOFException` in DBeaver | tunnel target not listening / SSH auth | Main-Port = forwarded (5433) or container IP; check `ssh root@<IP>` |
| site won't open by IP | firewall blocked 80 | `ufw allow 80` |
| backend restarting | env/passwords | `docker compose ... logs backend` |
