# SIES GST - CSE IoT Department
## Smart Digital Notice Board: Production Deployment Guide

### 1. Architectural Strategy
Because **GitHub Pages serves only static client files** (HTML, CSS, JS), the architecture separates frontend hosting from backend compute and database persistence:

```
[ Frontend: GitHub Pages / Vercel ]
              │ (HTTPS API Calls)
              ▼
[ Backend: Node.js Express on Render / Railway / Fly.io ]
              │ (Mongoose connection)
              ▼
[ Database: MongoDB Atlas (Cloud Cluster) ]
              ▲
              │ (Wi-Fi HTTP Polling)
[ Hardware: ESP32 with MAX7219 Matrix ]
```

---

### 2. Database Setup: MongoDB Atlas (Free Cloud Database)
1. Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free shared cluster (M0 sandbox).
3. Under **Security → Database Access**, create an admin database user (e.g., `sies_admin`).
4. Under **Security → Network Access**, add IP `0.0.0.0/0` (allow connections from anywhere so cloud backend providers can connect).
5. Click **Connect → Drivers → Node.js** to copy your connection string:
   ```env
   mongodb+srv://sies_admin:<password>@cluster0.abcde.mongodb.net/sies_gst_led?retryWrites=true&w=majority
   ```

---

### 3. Backend Deployment (Render / Railway)

#### Deploying on Render (Recommended Free Tier):
1. Create a repository on GitHub containing this project.
2. Sign in to [render.com](https://render.com) and click **New → Web Service**.
3. Connect your repository.
4. Set the following build and run settings:
   - **Root Directory:** `BACKEND`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node src/server.js`
5. Under **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `MONGODB_URI`: `<Your MongoDB Atlas Connection String>`
   - `JWT_SECRET`: `<Generate a strong 64-character random string>`
   - `ADMIN_EMAIL`: `admin@sies.edu.in`
   - `ADMIN_PASSWORD`: `<Your secure department admin password>`
   - `CORS_ORIGIN`: `*` (or your GitHub Pages domain `https://<username>.github.io`)
   - `HARDWARE_API_KEY`: `sies_esp32_matrix_secret_key_2026`
6. Click **Deploy**. Note your service URL (e.g. `https://sies-led-backend.onrender.com`).

---

### 4. Frontend Deployment (GitHub Pages)
1. In `FRONTEND/config.js`, update the fallback URL or configure it dynamically:
   ```javascript
   window.APP_CONFIG = {
     API_BASE_URL: 'https://sies-led-backend.onrender.com'
   };
   ```
2. In your GitHub repository settings:
   - Go to **Settings → Pages**.
   - Under **Build and deployment**, select **Source:** `Deploy from a branch`.
   - Select Branch: `master` (or `main`) and Folder: `/FRONTEND` (or root if configured).
3. Click **Save**.
4. Alternatively, use the in-app **"API Endpoint Settings"** modal on the website at any time to point to your cloud backend without modifying code!

---

### 5. Physical ESP32 Hardware Deployment
1. Open `hardware/esp32_led_client.ino` in Arduino IDE.
2. Configure:
   ```cpp
   const char* WIFI_SSID     = "SIES_COLLEGE_WIFI";
   const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
   const char* API_HOST      = "https://sies-led-backend.onrender.com"; // Cloud or LAN IP
   ```
3. Connect ESP32 via micro-USB and select the port in Arduino IDE.
4. Upload the sketch. Open Serial Monitor at `115200` baud.
5. The ESP32 will connect to Wi-Fi, fetch announcements from `/api/hardware/display`, send periodic heartbeats to `/api/hardware/ping`, and cycle through messages on the MAX7219 display!
