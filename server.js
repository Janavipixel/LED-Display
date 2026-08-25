const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const mqtt = require("mqtt");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const mqttClient = mqtt.connect(`mqtts://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD
});

mqttClient.on("connect", () => {
    console.log("Connected to MQTT Broker");
});

mqttClient.on("error", (error) => {
    console.log("MQTT Error:", error.message);
});

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
    res.json({
        message: "SIES GST LED Display Backend is running"
    });
});

app.post("/api/messages", (req, res) => {

    const message = req.body.message;

    if (!message) {
        return res.status(400).json({
            success: false,
            message: "LED message is required."
        });
    }

    console.log("Message received:", message);

    const topic = "siesgst/led/message";

mqttClient.publish(topic, message, (error) => {
    if (error) {
        console.log("MQTT Publish Error:", error.message);
    } else {
        console.log("Message published to MQTT:", message);
    }
});

    res.json({
        success: true,
        message: "LED message received successfully.",
        data: {
            ledMessage: message
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});