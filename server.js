import dns from 'node:dns/promises';
dns.setServers(["1.1.1.1", "8.8.8.8"]); 
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();


const app = express();
,.
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("RoadGuard AI Backend is Running!");
});

app.get("/api/health", (req, res) => {
    res.json({
        status: "success",
        message: "RoadGuard AI API is working"
    });
});

async function startServer() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB Connected Successfully!");

        const PORT = process.env.PORT || 5000;

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Database connection failed:", error.message);
    }
}

startServer();
