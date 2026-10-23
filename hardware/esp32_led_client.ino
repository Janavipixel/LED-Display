/**
 * ============================================================================
 * SIES GRADUATE SCHOOL OF TECHNOLOGY - NAVI MUMBAI
 * DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING (IoT)
 * ============================================================================
 * Project: Smart Digital Notice Board - ESP32 & MAX7219 LED Matrix Client
 * Author:  SIES GST CSE-IoT Department
 * Target:  ESP32 DevKit V1 (ESP-WROOM-32)
 * Matrix:  MAX7219 4-in-1 Dot Matrix Display (FC16_HW)
 * ============================================================================
 *
 * Pin Connections:
 *   ESP32 GPIO 23 (MOSI)  -->  MAX7219 DIN
 *   ESP32 GPIO 18 (SCK)   -->  MAX7219 CLK
 *   ESP32 GPIO 15 (SS)    -->  MAX7219 CS
 *   ESP32 GND             -->  MAX7219 GND (Common Ground)
 *   External +5V DC       -->  MAX7219 VCC
 *
 * Required Libraries (Install via Arduino Library Manager):
 *   1. MD_Parola    by majicDesigns
 *   2. MD_MAX72xx   by majicDesigns
 *   3. ArduinoJson  by Benoit Blanchon (v6 or v7)
 * ============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <MD_Parola.h>
#include <MD_MAX72xx.h>
#include <SPI.h>

// ==========================================
// 1. Wi-Fi & Backend Configuration
// ==========================================
const char* WIFI_SSID     = "SIES_CAMPUS_WIFI";       // Replace with Campus/Lab Wi-Fi SSID
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD_HERE"; // Replace with Wi-Fi Password

// Backend API Base URL (Change to your PC's LAN IP or Cloud URL)
// e.g., "http://192.168.1.100:5000" or "https://your-backend.onrender.com"
const char* API_HOST      = "http://192.168.1.100:5000";

// Hardware Security Token (Must match HARDWARE_API_KEY in BACKEND/.env)
const char* HARDWARE_KEY  = "YOUR_HARDWARE_API_KEY_HERE";
const char* DEVICE_ID     = "ESP32_SIES_LAB_01";
const char* FIRMWARE_VER  = "v1.0.0-sies-gst";

// ==========================================
// 2. LED Matrix Hardware Configuration
// ==========================================
#define HARDWARE_TYPE MD_MAX72XX::FC16_HW
#define MAX_DEVICES   4       // Number of 8x8 matrix units (4-in-1 module = 4)
#define CLK_PIN       18      // VSPI SCK
#define DATA_PIN      23      // VSPI MOSI
#define CS_PIN        15      // VSPI CS / LOAD

MD_Parola display = MD_Parola(HARDWARE_TYPE, CS_PIN, MAX_DEVICES);

// ==========================================
// 3. Message Buffer Data Structures
// ==========================================
#define MAX_STORED_MESSAGES 10
#define MAX_TEXT_LEN        105

struct Announcement {
  char id[30];
  char text[MAX_TEXT_LEN];
  char effect[20];
  int  duration;
};

Announcement messageQueue[MAX_STORED_MESSAGES];
int messageCount = 0;
int currentMessageIndex = 0;

// Timing Control
unsigned long lastFetchTime    = 0;
unsigned long lastPingTime     = 0;
const unsigned long FETCH_INTERVAL = 30000; // Poll display messages every 30 seconds
const unsigned long PING_INTERVAL  = 60000; // Heartbeat telemetry every 60 seconds

// ==========================================
// 4. Helper Functions
// ==========================================

void connectToWiFi() {
  Serial.printf("\n[Wi-Fi] Connecting to %s ", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[Wi-Fi] Connected successfully!");
    Serial.printf("[Wi-Fi] IP Address: %s | RSSI: %d dBm\n", WiFi.localIP().toString().c_str(), WiFi.RSSI());
  } else {
    Serial.println("\n[Wi-Fi] Connection failed. Operating in offline display mode.");
  }
}

textEffect_t getParolaEffect(const char* effectStr) {
  if (strcmp(effectStr, "scroll-left") == 0)  return PA_SCROLL_LEFT;
  if (strcmp(effectStr, "scroll-right") == 0) return PA_SCROLL_RIGHT;
  if (strcmp(effectStr, "blink") == 0)        return PA_BLINKS;
  return PA_PRINT; // Default static print
}

void sendHeartbeatTelemetry() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(API_HOST) + "/api/hardware/ping";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-hardware-token", HARDWARE_KEY);

  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["ip"]       = WiFi.localIP().toString();
  doc["rssi"]     = WiFi.RSSI();
  doc["uptime"]   = millis() / 1000;
  doc["firmware"] = FIRMWARE_VER;

  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);
  if (httpCode == 200) {
    Serial.println("[Telemetry] Heartbeat acknowledged by server (Status: ONLINE)");
  } else {
    Serial.printf("[Telemetry] Heartbeat error HTTP: %d\n", httpCode);
  }
  http.end();
}

void fetchAnnouncementsFromBackend() {
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
    if (WiFi.status() != WL_CONNECTED) return;
  }

  HTTPClient http;
  String url = String(API_HOST) + "/api/hardware/display";
  http.begin(url);
  http.addHeader("x-hardware-token", HARDWARE_KEY);

  int httpCode = http.GET();
  if (httpCode == 200) {
    String payload = http.getString();
    DynamicJsonDocument doc(4096);
    DeserializationError error = deserializeJson(doc, payload);

    if (!error && doc["success"] == true) {
      JsonArray array = doc["messages"].as<JsonArray>();
      int count = 0;

      for (JsonObject msg : array) {
        if (count >= MAX_STORED_MESSAGES) break;

        const char* msgId   = msg["id"] | "";
        const char* text    = msg["text"] | "";
        const char* effect  = msg["effect"] | "scroll-left";
        int duration        = msg["duration"] | 10;

        strncpy(messageQueue[count].id, msgId, sizeof(messageQueue[count].id) - 1);
        strncpy(messageQueue[count].text, text, sizeof(messageQueue[count].text) - 1);
        strncpy(messageQueue[count].effect, effect, sizeof(messageQueue[count].effect) - 1);
        messageQueue[count].duration = duration;

        count++;
      }

      messageCount = count;
      Serial.printf("[API] Successfully loaded %d announcements\n", messageCount);
    } else {
      Serial.println("[API] JSON parsing error from backend response");
    }
  } else {
    Serial.printf("[API] HTTP GET failed. Code: %d\n", httpCode);
  }
  http.end();
}

void displayNextMessage() {
  if (messageCount == 0) {
    // Default fallback screen when no messages are active in database
    display.displayText("SIES GST CSE-IoT Notice Board", PA_CENTER, 40, 2000, PA_SCROLL_LEFT, PA_SCROLL_LEFT);
    return;
  }

  Announcement& current = messageQueue[currentMessageIndex];
  textEffect_t effect = getParolaEffect(current.effect);

  // Speed and pause calculation based on effect & duration
  uint16_t scrollSpeed = 40; // milliseconds per pixel step
  uint16_t holdPause   = current.duration * 1000;

  if (effect == PA_SCROLL_LEFT || effect == PA_SCROLL_RIGHT) {
    display.displayText(current.text, PA_LEFT, scrollSpeed, 1000, effect, effect);
  } else if (effect == PA_BLINKS) {
    display.displayText(current.text, PA_CENTER, 250, holdPause, PA_BLINKS, PA_BLINKS);
  } else {
    // Static text display
    display.displayText(current.text, PA_CENTER, 0, holdPause, PA_PRINT, PA_NO_EFFECT);
  }

  Serial.printf("[Display] Showing [%d/%d]: \"%s\" (Effect: %s)\n",
                currentMessageIndex + 1, messageCount, current.text, current.effect);

  currentMessageIndex = (currentMessageIndex + 1) % messageCount;
}

// ==========================================
// 5. Main Setup & Loop
// ==========================================

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n=======================================================");
  Serial.println("  SIES GST - CSE IoT Smart Digital Notice Board");
  Serial.println("=======================================================");

  // Initialize LED Matrix Display
  display.begin();
  display.setIntensity(7); // Brightness level (0 - 15)
  display.displayClear();

  // Startup banner on matrix
  display.displayText("SIES GST IoT", PA_CENTER, 50, 1500, PA_SCROLL_LEFT, PA_SCROLL_LEFT);
  while (!display.displayAnimate()) {
    delay(10);
  }

  // Connect Wi-Fi and fetch initial messages
  connectToWiFi();
  fetchAnnouncementsFromBackend();
  sendHeartbeatTelemetry();

  displayNextMessage();
}

void loop() {
  // Parola non-blocking animation tick
  if (display.displayAnimate()) {
    // Current animation completed -> advance to next announcement
    displayNextMessage();
  }

  // Periodic API poll for new messages
  if (millis() - lastFetchTime > FETCH_INTERVAL) {
    lastFetchTime = millis();
    fetchAnnouncementsFromBackend();
  }

  // Periodic heartbeat telemetry ping
  if (millis() - lastPingTime > PING_INTERVAL) {
    lastPingTime = millis();
    sendHeartbeatTelemetry();
  }
}
