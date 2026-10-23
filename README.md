# SIES GST - CSE IoT Department
# Smart Digital Notice Board & LED Matrix Display Management System

A production-grade, full-stack administrative control panel and hardware integration pipeline built for the **Department of Computer Science & Engineering (IoT) at SIES Graduate School of Technology (SIES GST), Navi Mumbai**.

This system allows department administrators to draft, sequence, and manage campus announcements, preview their physical display characteristics via an authentic browser-based LED simulation, and distribute them to an ESP32-driven MAX7219 dot matrix display over Wi-Fi.

---

## 1. System Architecture

```
                                  CAMPUS NETWORK (Wi-Fi)
                                             │
┌───────────────────────────────┐            │            ┌───────────────────────────────┐
│     Administrative Website    │            │            │   ESP32 Microcontroller Unit  │
│  - Modern Turquoise/White UI  │            │            │   - ESP-WROOM-32              │
│  - Character Counter (100 ch) │            │            │   - Wi-Fi HTTP Client         │
│  - Sequential LED Simulation  │            │            │   - Telemetry Heartbeat Ping  │
│  - Real-time Audit Trail      │            │            │   - MD_Parola / MD_MAX72xx    │
└──────────────┬────────────────┘            │            └──────────────┬────────────────┘
               │ HTTPS (JWT Auth)            │                           │ SPI Bus (MOSI, SCK, CS)
               ▼                             │                           ▼
┌─────────────────────────────────────────┐  │            ┌───────────────────────────────┐
│       Node.js / Express Backend         │◄─┘            │   MAX7219 4-in-1 Dot Matrix   │
│  - RESTful API Architecture             │               │   - Red / Amber LED Grid      │
│  - Input Sanitization & Validation      │               │   - Scroll / Blink / Static   │
│  - Centralized Error Handling           │               └───────────────────────────────┘
│  - Microcontroller JSON Feed            │
└────────────────────┬────────────────────┘
                     │ Mongoose
                     ▼
┌─────────────────────────────────────────┐
│      Persistent MongoDB Database        │
│  - Announcements Collection             │
│  - Activity Log / Audit Collection      │
│  - Admin Users Collection (Bcrypt/JWT)  │
└─────────────────────────────────────────┘
```

---

## 2. Technology Stack

- **Frontend:**
  - Semantic HTML5, CSS3 Custom Properties (Design Tokens), Vanilla JavaScript (ES6+).
  - Typography: `Inter` (UI) and `Share Tech Mono` / `Fira Code` (LED Matrix Simulation).
  - Design Identity: Professional blue engineering palette — Deep Navy (`#101B33`), Primary Blue (`#2457A7`), Bright Blue (`#3B82F6`), Pale Blue (`#EAF1FB`), and authentic high-intensity Blue LED matrix display glow (`#38BDF8`).
  - Coordinated two-section login screen with real-time electronic LED message board marquee preview.
  - Side-by-side dashboard layout positioning the working LED matrix display directly beside announcement controls without requiring scrolling.
  - Zero external heavyweight dependencies; lightweight, responsive, and deployable to GitHub Pages.
- **Backend:**
  - **Node.js** (v20+) & **Express.js**.
  - **Mongoose / MongoDB** (Object modeling, persistence, schema validation, indexing).
  - **Security:** `helmet` (security headers), `cors` (origin control), `bcryptjs` (salted password hashing), `jsonwebtoken` (JWT bearer authentication).
  - **Telemetry & Logging:** `morgan` request logger and custom audit history subsystem.
- **Testing:**
  - Built-in Node.js Test Runner (`node:test`, `node:assert`).
  - `supertest` for end-to-end HTTP integration tests.
  - `mongodb-memory-server` for zero-configuration, isolated in-memory test databases.
- **Hardware Integration:**
  - C++ Arduino Sketch (`hardware/esp32_led_client.ino`) targeting **ESP32 DevKit V1**.
  - **MAX7219 4-in-1 8x32** FC-16 cascaded matrix modules.
  - Libraries: `MD_Parola`, `MD_MAX72xx`, `ArduinoJson`.
  - Node.js Hardware Simulation Client (`hardware/esp32_sim_client.js`).

---

## 3. Directory Structure

```
LED DISPLAY/
├── BACKEND/
│   ├── src/
│   │   ├── config/
│   │   │   ├── constants.js          # Effects, status enums, validation limits
│   │   │   ├── db.js                 # Mongoose connection & lifecycle handlers
│   │   │   └── env.js                # Environment configuration loader
│   │   ├── controllers/
│   │   │   ├── activityController.js # Audit trail retrieval
│   │   │   ├── authController.js     # Admin sign-in & JWT generation
│   │   │   ├── hardwareController.js # ESP32 microcontroller feed & heartbeat
│   │   │   ├── messageController.js  # Announcement CRUD operations
│   │   │   └── statsController.js    # Database-backed dashboard metrics
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT bearer token verification
│   │   │   ├── errorHandler.js       # Centralized error handler
│   │   │   ├── notFound.js           # 404 handler
│   │   │   └── validation.js         # Input sanitization & boundary checks
│   │   ├── models/
│   │   │   ├── ActivityLog.js        # Persistent audit trail schema
│   │   │   ├── AdminUser.js          # Admin account schema with bcrypt
│   │   │   └── Announcement.js       # Announcement schema (text, effect, duration)
│   │   ├── routes/
│   │   │   ├── activityRoutes.js     # /api/activity
│   │   │   ├── authRoutes.js         # /api/auth
│   │   │   ├── hardwareRoutes.js     # /api/hardware
│   │   │   ├── healthRoutes.js       # /api/health
│   │   │   ├── messageRoutes.js      # /api/messages
│   │   │   └── statsRoutes.js        # /api/stats
│   │   ├── utils/
│   │   │   └── seedAdmin.js          # Automatic initial admin bootstrapper
│   │   ├── app.js                    # Express app configuration & static hosting
│   │   └── server.js                 # Server entrypoint with DB fallback
│   ├── tests/
│   │   ├── helpers/testDb.js         # In-memory test DB helper
│   │   └── system.test.js            # 27 comprehensive automated tests
│   ├── .env.example                  # Documented environment template
│   ├── .gitignore                    # Ignore node_modules, logs, .env
│   ├── package.json                  # Dependencies & npm scripts
│   └── server.js                     # Root forwarder to src/server.js
├── FRONTEND/
│   ├── index.html                    # Dashboard UI & login screen
│   ├── style.css                     # Turquoise & white design system + LED styling
│   ├── script.js                     # Dashboard controller, API consumer, preview simulation
│   ├── config.js                     # Dynamic runtime API endpoint configuration
│   ├── logo.png                      # SIES GST official insignia
│   └── FRONTEND/                     # Synchronized directory for legacy GitHub Pages paths
├── hardware/
│   ├── HARDWARE_SPEC.md              # Wiring pinout, circuit specs, and API contracts
│   ├── esp32_led_client.ino          # Complete production C++ ESP32 Arduino sketch
│   └── esp32_sim_client.js           # Terminal hardware telemetry simulator
├── docs/
│   ├── API_SPECIFICATION.md          # Comprehensive REST API documentation
│   └── DEPLOYMENT_GUIDE.md           # Step-by-step production deployment guide
├── .gitignore
└── README.md
```

---

## 4. Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) v20 or newer
- [npm](https://www.npmjs.com/) v10 or newer
- (Optional) Local MongoDB or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cloud cluster

### Step 1: Install Backend Dependencies
```bash
cd BACKEND
npm install
```

### Step 2: Configure Environment Variables
Copy the template to `.env`:
```bash
cp .env.example .env
```
Default configuration in `.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/sies_gst_led
JWT_SECRET=sies_gst_dev_secret_key_2026
ADMIN_EMAIL=admin@sies.edu.in
ADMIN_PASSWORD=Admin@123
ADMIN_NAME=SIES GST IoT Admin
CORS_ORIGIN=*
HARDWARE_API_KEY=sies_esp32_matrix_secret_key_2026
```

> **Note on Database Connection:**
> If a local MongoDB instance is not detected, the development server automatically initializes an in-memory MongoDB fallback instance so that local evaluation, testing, and UI preview work out-of-the-box without manual database installation.

### Step 3: Run Automated Tests
Execute the automated test suite verifying all 27 unit, integration, validation, and telemetry tests:
```bash
npm test
```

### Step 4: Start the Server
```bash
npm start
```
The server will boot on `http://localhost:5000`:
- **Admin Dashboard & Website:** [http://localhost:5000/](http://localhost:5000/)
- **Health Endpoint:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Hardware Display Feed:** [http://localhost:5000/api/hardware/display](http://localhost:5000/api/hardware/display)

### Step 5: Log in to Admin Console
Open `http://localhost:5000/` in your browser:
- **Email:** `admin@sies.edu.in`
- **Password:** `Admin@123`

---

## 5. Features

### A. Administrator Authentication & Security
- Secure credentials verification backed by salted `bcryptjs` hashing.
- 24-hour expiration JSON Web Tokens (JWT) protecting administrative mutation endpoints (`POST`, `PUT`, `DELETE`).
- Automatic session restoration with `GET /api/auth/me`.

### B. Announcement Management
- **Character Count Enforcement:** Strict 100-character limit with real-time UI character counter (`X / 100`) and server-side validation.
- **Display Effects:**
  - `scroll-left`: Continuous right-to-left marquee scroll.
  - `scroll-right`: Continuous left-to-right marquee scroll.
  - `static`: Centered hold for the designated duration.
  - `blink`: Flashes on/off at rhythmic intervals.
- **Duration Control:** 5s, 10s, 15s, 20s, or 30s display intervals.
- **Status Filtering:** `Active` (included in hardware and simulation rotation) vs `Queued` / `Standby`.
- **Atomic Updates:** Editing updates existing MongoDB documents by `_id`, preventing unintended duplicates.
- **Deletion:** Deletes permanently from database with administrator confirmation dialog.

- Positioned prominently side-by-side beside the announcement management controls on desktop without requiring scrolling.
- Styled to simulate physical MAX7219 FC-16 cascaded LED modules with heavy-duty navy bezel and hardware rivets.
- Authentic 8x8 dot-matrix texture overlay, scanlines, and bright Blue LED glow (`#38BDF8`).
- Sequential train/station rotation looping across active announcements respecting individual effects and durations.
- Administrator simulation controls: Play / Pause, Next, Previous.
- Real hardware status tag: Discloses whether physical ESP32 hardware is connected (`ONLINE`) or in `STANDBY (Simulation Mode)`.

### D. Persistent Audit History
- Real database records for every administrative modification (`CREATED`, `UPDATED`, `DELETED`, `ADMIN_LOGIN`).
- Timestamps, affected announcement snippets, effect names, and administrative actors.

### E. ESP32 Hardware Integration & Telemetry
- Stable microcontroller endpoint: `GET /api/hardware/display`.
- Lightweight JSON payload optimized for microcontrollers with minimal RAM overhead.
- Telemetry heartbeat ping: `POST /api/hardware/ping` recording device IP, Wi-Fi RSSI, uptime, and firmware version.
- Hardware status tracking: `GET /api/hardware/status` declaring hardware online status based on 60-second ping thresholds.
- Ready-to-flash C++ sketch: `hardware/esp32_led_client.ino`.
- Terminal hardware simulator: `hardware/esp32_sim_client.js`.

---

## 6. Testing the Hardware Telemetry Simulator
To test the ESP32 connection pipeline without physical hardware, launch the simulator script:
```bash
node hardware/esp32_sim_client.js
```
The simulator will ping `POST /api/hardware/ping` and fetch active announcements from `GET /api/hardware/display`. The dashboard will immediately transition from `STANDBY` to `ONLINE (ESP32 Connected)` and display the simulated device's signal strength and IP address.

---

## 7. Deployment Instructions

Complete instructions for deploying the frontend to GitHub Pages and the backend to Render or Railway with MongoDB Atlas are available in:
- [`docs/DEPLOYMENT_GUIDE.md`](docs/DEPLOYMENT_GUIDE.md)
- [`docs/API_SPECIFICATION.md`](docs/API_SPECIFICATION.md)
- [`hardware/HARDWARE_SPEC.md`](hardware/HARDWARE_SPEC.md)

---

## 8. License & Department Attribution
Built for the **Department of Computer Science & Engineering (IoT)** at **SIES Graduate School of Technology, Nerul, Navi Mumbai**.
Licensed under ISC License.
