# SIES GST - CSE IoT Department
## Smart Digital Notice Board: REST API Specification

### 1. Base URL
- **Local Development:** `http://localhost:5000`
- **Default Production / Cloud:** Configurable via `PORT` and `CORS_ORIGIN`

---

### 2. Authentication
Administrative endpoints require a JSON Web Token (JWT) passed in the `Authorization` HTTP header:
```http
Authorization: Bearer <JWT_TOKEN>
```
To obtain a token, call `POST /api/auth/login`.

---

### 3. Endpoints Overview

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/health` | Public | Service health & database connection status |
| **POST** | `/api/auth/login` | Public | Authenticate administrator & retrieve JWT |
| **GET** | `/api/auth/me` | Admin | Get authenticated administrator profile |
| **GET** | `/api/messages` | Public | Retrieve all announcements (supports `?status=active`) |
| **GET** | `/api/messages/:id` | Public | Retrieve single announcement by 24-hex ObjectId |
| **POST** | `/api/messages` | Admin | Create new announcement & record audit log |
| **PUT** | `/api/messages/:id` | Admin | Update existing announcement & record audit log |
| **DELETE** | `/api/messages/:id` | Admin | Delete announcement permanently & record audit log |
| **GET** | `/api/hardware/display` | Public / Hardware | Fetch active messages formatted for microcontroller (ESP32) |
| **POST** | `/api/hardware/ping` | Hardware | Record ESP32 telemetry heartbeat (IP, RSSI, uptime) |
| **GET** | `/api/hardware/status` | Public | Get real hardware online / standby connectivity status |
| **GET** | `/api/activity` | Public | Retrieve audit history logs |
| **GET** | `/api/stats` | Public | Retrieve live dashboard metrics |

---

### 4. Detailed Endpoint Specifications

#### A. Health Check
- **Endpoint:** `GET /api/health`
- **Response `200 OK`:**
```json
{
  "success": true,
  "status": "healthy",
  "service": "SIES GST CSE-IoT LED Display Management API",
  "version": "1.0.0",
  "timestamp": "2026-10-23T12:38:09.457Z",
  "uptimeSeconds": 120,
  "database": {
    "connected": true,
    "status": "CONNECTED"
  }
}
```

---

#### B. Admin Sign In
- **Endpoint:** `POST /api/auth/login`
- **Request Body:**
```json
{
  "email": "admin@sies.edu.in",
  "password": "Admin@123"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Authentication successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "6718cf2a129d4c188b0a9900",
    "email": "admin@sies.edu.in",
    "name": "SIES GST IoT Admin",
    "role": "admin",
    "lastLogin": "2026-10-23T12:38:10.000Z"
  }
}
```
- **Response `401 Unauthorized`:**
```json
{
  "success": false,
  "error": "Invalid credentials. Administrator email or password incorrect."
}
```

---

#### C. Create Announcement
- **Endpoint:** `POST /api/messages`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Request Body:**
```json
{
  "text": "SIES GST Smart India Hackathon Winners Announced",
  "effect": "scroll-left",
  "duration": 15,
  "status": "active",
  "displayOrder": 1
}
```
- **Allowed Effects:** `scroll-left`, `scroll-right`, `static`, `blink`
- **Duration Range:** 3 to 120 seconds
- **Character Limit:** 1 to 100 characters
- **Response `201 Created`:**
```json
{
  "success": true,
  "message": "Announcement created successfully",
  "data": {
    "id": "6718cf2a129d4c188b0a9905",
    "text": "SIES GST Smart India Hackathon Winners Announced",
    "effect": "scroll-left",
    "duration": 15,
    "status": "active",
    "displayOrder": 1,
    "createdAt": "2026-10-23T12:40:00.000Z",
    "updatedAt": "2026-10-23T12:40:00.000Z"
  }
}
```

---

#### D. Update Announcement
- **Endpoint:** `PUT /api/messages/:id`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Request Body:**
```json
{
  "text": "SIES GST SIH Winners Felicitation at 2 PM",
  "effect": "blink",
  "duration": 10,
  "status": "active",
  "displayOrder": 1
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Announcement updated successfully",
  "data": {
    "id": "6718cf2a129d4c188b0a9905",
    "text": "SIES GST SIH Winners Felicitation at 2 PM",
    "effect": "blink",
    "duration": 10,
    "status": "active",
    "displayOrder": 1,
    "updatedAt": "2026-10-23T12:42:00.000Z"
  }
}
```

---

#### E. Delete Announcement
- **Endpoint:** `DELETE /api/messages/:id`
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Announcement deleted successfully",
  "data": {
    "id": "6718cf2a129d4c188b0a9905",
    "text": "SIES GST SIH Winners Felicitation at 2 PM"
  }
}
```

---

#### F. Hardware Microcontroller Feed (ESP32)
- **Endpoint:** `GET /api/hardware/display`
- **Optional Header:** `x-hardware-token: <HARDWARE_API_KEY>`
- **Response `200 OK`:**
```json
{
  "success": true,
  "count": 2,
  "timestamp": 1729683921000,
  "refreshInterval": 30,
  "messages": [
    {
      "id": "6718cf2a129d4c188b0a9901",
      "text": "Welcome to SIES GST - CSE IoT Department",
      "effect": "scroll-left",
      "duration": 10,
      "order": 1,
      "updatedAt": 1729683921000
    }
  ]
}
```

---

#### G. Hardware Heartbeat (Telemetry)
- **Endpoint:** `POST /api/hardware/ping`
- **Request Body:**
```json
{
  "deviceId": "ESP32_SIES_LAB_01",
  "ip": "192.168.1.105",
  "rssi": -58,
  "uptime": 3600,
  "firmware": "v1.0.0-sies"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Hardware heartbeat acknowledged",
  "serverTime": 1729683925000,
  "status": "ONLINE"
}
```

---

#### H. Dashboard Statistics
- **Endpoint:** `GET /api/stats`
- **Response `200 OK`:**
```json
{
  "success": true,
  "stats": {
    "totalMessages": 5,
    "activeMessages": 3,
    "queuedMessages": 2,
    "recordedChanges": 14,
    "hardware": {
      "isConnected": true,
      "statusText": "ONLINE (ESP32 Connected)",
      "lastSeen": "2026-10-23T12:38:34.863Z",
      "deviceId": "ESP32_SIES_LAB_01",
      "ip": "192.168.1.105",
      "rssi": -58,
      "uptime": 3600,
      "firmware": "v1.0.0-sies"
    }
  }
}
```
