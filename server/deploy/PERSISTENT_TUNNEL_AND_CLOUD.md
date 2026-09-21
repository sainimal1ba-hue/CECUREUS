# CECUREUS — Persistent Tunnel & Cloud Production Deployment

This guide solves the root cause of ephemeral Quick Tunnel drops (`*.trycloudflare.com` random subdomains dying on sleep/restart) and explains how to test physical phones on external networks and deploy permanently.

---

## 1. Quick Test: Verify Physical Phone on Cellular Data (4G/5G) Right Now

To verify that your mobile phone on a different network (cellular data, non-laptop Wi-Fi) can reach the backend:

1. **On your phone**: Turn OFF Wi-Fi and turn ON Cellular Mobile Data (4G/5G).
2. **Open Safari / Chrome** on the phone and navigate to:
   ```
   https://faced-finishing-safe-macintosh.trycloudflare.com/health
   ```
3. **Expected result**:
   ```json
   {"status":"ok","timestamp":"...","uptime":...}
   ```
   - If this succeeds, your cellular carrier can successfully route through the tunnel to your backend.
   - If this times out or shows a Cloudflare 502/530, your carrier or local firewall is filtering Quick Tunnels, which is why a **Named Tunnel** or **Cloud Deployment** is necessary.
4. **In the CecureUs App**: Look at the top `DevApiBanner`:
   - 🟢 `Connected (XXXms)` = Server verified and responsive.
   - 🔴 `Unreachable` = Tunnel down or blocked.

---

## 2. Option A: Cloudflare Named Tunnel (Persistent URL, Zero Re-rolls)

A Cloudflare **Named Tunnel** is bound to a real domain you control in Cloudflare. The URL **never** changes across machine restarts, Wi-Fi changes, or terminal closures.

### Step 1: Authenticate Cloudflare CLI
```bash
cloudflared tunnel login
```
*A browser window opens to select your Cloudflare domain (e.g. `cecureus.com` or your personal domain). This saves `~/.cloudflared/cert.pem`.*

### Step 2: Create a Named Tunnel
```bash
cloudflared tunnel create cecureus-dev
```
*This outputs a Tunnel ID and creates `~/.cloudflared/<tunnel-id>.json`.*

### Step 3: Route a DNS Subdomain
```bash
cloudflared tunnel route dns cecureus-dev api-dev.yourdomain.com
```

### Step 4: Run Permanently under PM2
Create a config file at `~/.cloudflared/config.yml`:
```yaml
tunnel: cecureus-dev
credentials-file: /Users/sainimal/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: api-dev.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
```

Add to PM2 so it survives reboots and terminal exits:
```bash
pm2 start cloudflared --name cecureus-tunnel -- tunnel run cecureus-dev
pm2 save
```

In `.env`:
```bash
EXPO_PUBLIC_API_URL=https://api-dev.yourdomain.com
```
*This URL is permanent. It never changes again.*

---

## 3. Option B: Ngrok with Free Static Domain (Zero Domain Purchase)

Ngrok's free tier provides **1 permanent static domain** that never changes:

1. Log into your free ngrok account at [dashboard.ngrok.com](https://dashboard.ngrok.com/endpoints).
2. Go to **Domains** -> Click **Claim your free static domain** (e.g. `cecureus-dev.ngrok-free.app`).
3. Start the tunnel via PM2:
   ```bash
   pm2 start /opt/homebrew/lib/node_modules/@expo/ngrok/node_modules/@expo/ngrok-bin-darwin-arm64/ngrok \
     --name cecureus-tunnel \
     -- http 3000 --domain=cecureus-dev.ngrok-free.app
   pm2 save
   ```
4. In `.env`:
   ```bash
   EXPO_PUBLIC_API_URL=https://cecureus-dev.ngrok-free.app
   ```

---

## 4. Option C: Deploy Node Server to Cloud (The Permanent Architectural Fix)

Deploying `server/` to the cloud eliminates the need for laptops, tunnels, sleep mode issues, or terminal sessions.

### Ready-Made Production Docker Setup
The repository now includes:
- [server/Dockerfile](file:///Users/sainimal/CECUREUS/server/Dockerfile): Production Node 20 container with automated database migrations (`npm run migrate && npm start`).
- [server/docker-compose.yml](file:///Users/sainimal/CECUREUS/server/docker-compose.yml): Production-ready stack with MySQL 8.

### Deploy to Railway (Fastest — 5 minutes)
1. Go to [railway.app](https://railway.app) and create a New Project.
2. Click **Add MySQL Database** (Railway provisions managed MySQL instantly).
3. Click **GitHub Repo** -> select `CECUREUS`, set root directory to `/server`.
4. Add environment variables:
   - `DB_HOST`: `${{MySQL.MYSQLHOST}}`
   - `DB_PORT`: `${{MySQL.MYSQLPORT}}`
   - `DB_NAME`: `${{MySQL.MYSQLDATABASE}}`
   - `DB_USER`: `${{MySQL.MYSQLUSER}}`
   - `DB_PASSWORD`: `${{MySQL.MYSQLPASSWORD}}`
   - `AUTH_TOKEN_SECRET`: your secret key
   - `GMAIL_USER` / `GMAIL_APP_PASSWORD`
   - `SMSINTEGRA_UID` / `SMSINTEGRA_PASSWORD`
5. Railway provides a permanent HTTPS domain: `https://cecureus-production.up.railway.app`.
6. Update `.env`:
   ```bash
   EXPO_PUBLIC_API_URL=https://cecureus-production.up.railway.app
   ```

### Deploy to Render
1. Connect repo to [render.com](https://render.com).
2. Add a Web Service pointing to `/server` using Docker or Node runtime.
3. Attach MySQL database (e.g. Aiven free MySQL or Render PostgreSQL).
4. Permanent URL generated: `https://cecureus-api.onrender.com`.
