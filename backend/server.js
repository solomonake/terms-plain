"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
const rateLimit_1 = require("./middleware/rateLimit");
const app = (0, express_1.default)();
const PORT = 4000;
app.use((0, cors_1.default)({
    origin: "http://localhost:3000",
}));
app.use(express_1.default.json({ limit: "2mb" }));
app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});
const limiter = (0, rateLimit_1.createRateLimiter)();
app.post(["/analyze", "/explain", "/qa"], limiter);
app.use(routes_1.default);
app.use((err, _req, res, _next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
});
app.listen(PORT, () => {
    console.log(`Termsplain API running on http://localhost:${PORT}`);
});
