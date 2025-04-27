"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthLogin = exports.AuthRegister = void 0;
const zod_1 = require("zod");
/**
 * Schema for validating the data required for user registration.
 *
 * Fields:
 * - `email`: A valid email address.
 * - `password`: A password with a minimum length of 6 characters.
 * - `name`: A name with a minimum length of 3 characters.
 */
exports.AuthRegister = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    name: zod_1.z.string().min(3),
});
/**
 * Schema for validating the data required for user login.
 *
 * Fields:
 * - `email`: A valid email address.
 * - `password`: A password with a minimum length of 6 characters.
 */
exports.AuthLogin = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
