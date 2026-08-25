const http = require("http");

const data = JSON.stringify({
    message: "Tomorrow is a holiday"
});

const options = {
    hostname: "localhost",
    port: 5000,
    path: "/api/messages",
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data)
    }
};

const request = http.request(options, (response) => {

    let result = "";

    response.on("data", (chunk) => {
        result += chunk;
    });

    response.on("end", () => {
        console.log("Backend Response:");
        console.log(result);
    });

});

request.on("error", (error) => {
    console.log("Error:", error.message);
});

request.write(data);
request.end();