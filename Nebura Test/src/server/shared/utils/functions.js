"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeCompare = safeCompare;
const crypto_1 = require("crypto");
function safeCompare(a, b) {
    try {
        return (0, crypto_1.timingSafeEqual)(Buffer.from(a), Buffer.from(b));
    }
    catch {
        return false;
    }
}
