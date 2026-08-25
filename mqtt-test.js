require("dotenv").config();
const mqtt = require("mqtt");

const client = mqtt.connect(
    `mqtts://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`,
    {
        username: process.env.MQTT_USERNAME,
        password: process.env.MQTT_PASSWORD
    }
);

const topic = "siesgst/led/message";

client.on("connect", () => {
    console.log("Connected to MQTT Broker");

    client.subscribe(topic, (error) => {
        if (error) {
            console.log("Subscribe Error:", error.message);
        } else {
            console.log("Subscribed to:", topic);
        }
    });
});

client.on("message", (receivedTopic, message) => {
    console.log("Message received from MQTT:");
    console.log(message.toString());
});

client.on("error", (error) => {
    console.log("MQTT Error:", error.message);
});