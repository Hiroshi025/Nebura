"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="3ffaa37b-4352-5f9d-9327-552311228ba5")}catch(e){}}();

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTokenAI = void 0;
const crypto = __importStar(require("crypto"));
const validateTokenAI = (req, res, next) => {
    const apiKey = req.headers["x-gemini-api-key"];
    const model = req.headers["x-gemini-model"];
    if (!apiKey || !model) {
        return res.status(400).json({
            data: null,
            error: "Missing required headers: x-gemini-api-key and x-gemini-model",
        });
    }
    const apiKeyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
    req.geminiConfig = {
        apiKey,
        model,
        apiKeyHash,
    };
    next();
    return;
};
exports.validateTokenAI = validateTokenAI;
//# sourceMappingURL=google.middleware.js.map
//# debugId=3ffaa37b-4352-5f9d-9327-552311228ba5
