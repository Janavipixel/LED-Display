# SIES GST - CSE IoT Department
## Smart Digital Notice Board: ESP32 & LED Matrix Hardware Specification

### 1. System Overview
The physical notice board displays department announcements on a high-brightness LED matrix display driven by an ESP32 microcontroller over Wi-Fi.

```
+--------------------------+        HTTP / Wi-Fi       +---------------------+        SPI Bus        +---------------------+
| SIES GST Backend API     | <=======================> | ESP32 Microcontroller| ===================> | MAX7219 LED Matrix  |
| (Node.js/Express/MongoDB)|    GET /api/hardware/     | (ESP-WROOM-32 / C++)|   (DIN, CLK, CS)    | (4-in-1 8x32 Modules)
+--------------------------+         display           +---------------------+                       +---------------------+
```

---

### 2. Hardware Bill of Materials (BOM)
| Component | Specification | Quantity | Purpose |
| :--- | :--- | :--- | :--- |
| **Microcontroller** | ESP32-WROOM-32 (NodeMCU-32S) | 1 | Wi-Fi connectivity, HTTP client, LED frame buffering |
| **LED Matrix Display** | MAX7219 4-in-1 8x32 Dot Matrix (FC-16) | 1 or 2 | Cascaded dot-matrix monochrome red/amber display |
| **Power Supply** | 5V DC 2A Regulated Adapter | 1 | Clean 5V power for LED matrix LEDs |
| **Connecting Wires** | Female-to-Female DuPont Jumpers | 5 | SPI bus & power interconnects |

---

### 3. Pinout & Wiring Table (ESP32 to MAX7219)

| MAX7219 Pin | ESP32 Pin | Function | Notes |
| :--- | :--- | :--- | :--- |
| **VCC** | **VIN / 5V** (External 5V) | Power (+5V DC) | Matrix draws up to 1A with all LEDs on. Use 5V line. |
| **GND** | **GND** | Common Ground | Must share common ground with ESP32 and external PSU. |
| **DIN** | **GPIO 23** | SPI MOSI (Data In) | Hardware SPI Data Line |
| **CS / LOAD** | **GPIO 15** | SPI Chip Select | Hardware SPI Slave Select |
| **CLK** | **GPIO 18** | SPI SCK (Clock) | Hardware SPI Serial Clock |

---

### 4. Hardware API Contract

#### A. Fetch Display Messages
- **Endpoint:** `GET /api/hardware/display`
- **Optional Header:** `x-hardware-token: <HARDWARE_API_KEY>`
- **Response Format (JSON):**
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
    },
    {
      "id": "6718cf2a129d4c188b0a9902",
      "text": "Internal Assessment starts from Monday",
      "effect": "blink",
      "duration": 5,
      "order": 2,
      "updatedAt": 1729683921000
    }
  ]
}
```

#### B. Send Hardware Heartbeat (Telemetry)
- **Endpoint:** `POST /api/hardware/ping`
- **Request Body (JSON):**
```json
{
  "deviceId": "ESP32_SIES_LAB_01",
  "ip": "192.168.1.105",
  "rssi": -62,
  "uptime": 3600,
  "firmware": "v1.0.0-sies"
}
```
- **Response Format (JSON):**
```json
{
  "success": true,
  "message": "Hardware heartbeat acknowledged",
  "serverTime": 1729683925000,
  "status": "ONLINE"
}
```

---

### 5. Display Effects Mapping (Software to Hardware)

| Website Effect | MAX7219 (MD_Parola) Effect | Description |
| :--- | :--- | :--- |
| `scroll-left` | `PA_SCROLL_LEFT` | Smooth linear right-to-left marquee scroll |
| `scroll-right` | `PA_SCROLL_RIGHT` | Smooth linear left-to-right marquee scroll |
| `static` | `PA_PRINT` | Centered steady message held for `duration` seconds |
| `blink` | `PA_BLINKS` | Flashes the text on and off for `duration` seconds |

---

### 6. Required Arduino Libraries
1. `WiFi.h` (Built into ESP32 Arduino Core)
2. `HTTPClient.h` (Built into ESP32 Arduino Core)
3. `ArduinoJson` (v6.x or v7.x by Benoit Blanchon)
4. `MD_Parola` (by majicDesigns)
5. `MD_MAX72xx` (by majicDesigns)
