# SIES GST Smart LED Display Management System

A web-based LED display management system for SIES GST that allows authorized users to create and manage notices remotely. The system uses a web interface, a Node.js backend, MQTT communication, and an ESP32-based LED display.

## Features

* Web-based notice management
* Add, edit and delete messages
* Message preview with LED-style effects
* Message history
* MQTT-based message communication
* ESP32 integration for the LED display
* Secure server-side MQTT credentials using environment variables

## Technologies Used

### Frontend

* HTML
* CSS
* JavaScript

### Backend

* Node.js
* Express.js
* MQTT
* HiveMQ Cloud
* dotenv
* CORS

### Hardware

* ESP32
* LED Matrix

## System Architecture

User → Web Interface → Node.js/Express Backend → MQTT → HiveMQ Cloud → ESP32 → LED Matrix

## Project Structure

```text
SIES-GST-LED-Display/
│
├── FRONTEND/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
└── BACKEND/
    ├── server.js
    ├── package.json
    ├── package-lock.json
    ├── test.js
    ├── mqtt-test.js
    └── .gitignore
```

## Setup

1. Install Node.js.
2. Open the `BACKEND` folder in a terminal.
3. Install the required dependencies:

```bash
npm install
```

4. Create a `.env` file inside the `BACKEND` folder.
5. Add the required MQTT credentials to the `.env` file.
6. Start the backend:

```bash
node server.js
```

The backend runs on:

```text
http://localhost:5000
```

## MQTT Testing

The `mqtt-test.js` file is used to test MQTT message reception before connecting the ESP32.

The MQTT topic used by the project is:

```text
siesgst/led/message
```

## Security

MQTT credentials are stored in the `.env` file and are excluded from GitHub using `.gitignore`. The `.env` file should never be uploaded to a public repository.

## Current Status

The web interface, Node.js backend, MQTT communication, and HiveMQ Cloud connection have been tested successfully. ESP32 and LED Matrix hardware integration is the next stage of the project.
