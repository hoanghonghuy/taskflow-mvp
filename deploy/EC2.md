# Taskflow EC2 deployment

This runbook deploys the customer-test stack on a single EC2 instance:

- Caddy: public ports 80/443 + automatic HTTPS
- Next.js frontend: private Docker network only
- Express backend: private Docker network only
- PostgreSQL 16: private Docker network + persistent Docker volume

## 1. Recommended EC2 instance

For a temporary customer-test environment:

- Ubuntu Server 24.04 LTS
- `t4g.small` (2 vCPU, 2 GiB RAM) is a practical starting point
- 20 GiB gp3 root volume
- Add 2 GiB swap before building images
- Security group:
  - TCP 22: your IP only
  - TCP 80: 0.0.0.0/0 and ::/0
  - TCP 443: 0.0.0.0/0 and ::/0

If image builds run out of memory, temporarily resize to `t4g.medium` or build elsewhere and use a registry.

## 2. Point a hostname at EC2

Create an A record (or a temporary DuckDNS hostname) pointing to the EC2 public IPv4 address.

Example:

```text
taskflow-huy.duckdns.org -> <EC2_PUBLIC_IP>
```

Caddy needs a public hostname resolving to the instance to obtain HTTPS automatically.

## 3. Install Docker

```bash
sudo apt update
sudo apt install -y ca-certificates curl git
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"
newgrp docker

docker --version
docker compose version
```

## 4. Add 2 GiB swap

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
```

## 5. Clone the repository

Use an authenticated GitHub SSH key for a private repository, then:

```bash
git clone -b develop git@github.com:hoanghonghuy/taskflow-mvp.git
cd taskflow-mvp
```

## 6. Configure production environment

```bash
cp deploy/ec2.env.example .env.production
nano .env.production
```

At minimum, set:

- `APP_DOMAIN`
- `POSTGRES_PASSWORD`
- `JWT_KEY`
- the API key for the selected AI provider if AI features are being tested

Generate strong values, for example:

```bash
openssl rand -hex 32
```

Do not use the sample development admin/demo passwords in a public environment.

## 7. Build and start

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.prod.yml \
  up -d --build
```

Check status:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

Follow logs:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f --tail=200
```

Once Caddy has obtained the certificate, open:

```text
https://<APP_DOMAIN>
```

## 8. Update the deployment

```bash
cd taskflow-mvp
git checkout develop
git pull --ff-only origin develop

docker compose \
  --env-file .env.production \
  -f docker-compose.prod.yml \
  up -d --build
```

Remove unused build layers occasionally:

```bash
docker image prune -f
```

## 9. Database backup

Create a logical backup before risky changes:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml \
  exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' \
  > taskflow-$(date +%F-%H%M).sql
```

The PostgreSQL data directory is also stored in the persistent `taskflow_pg_data` Docker volume.
