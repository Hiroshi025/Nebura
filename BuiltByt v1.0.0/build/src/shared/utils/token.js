"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="e7844f8e-98b8-511b-8c96-c11516cbb6e4")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.verified = exports.signToken = exports.getToken = exports.encrypt = void 0;
const bcryptjs_1 = require("bcryptjs");
const jsonwebtoken_1 = require("jsonwebtoken");
const error_extend_1 = require("../../shared/adapters/extends/error.extend");
/**
 * Generates a JSON Web Token (JWT) for the given user ID (email).
 *
 * @param {string} id - The user ID (must be a valid email).
 * @returns {string} The signed JWT.
 * @throws {ServerError} If the provided ID is not a valid email.
 *
 * @example
 * const token = signToken("user@example.com");
 * console.log(token);
 */
const signToken = (id) => {
    if (!process.env.JWT_SECRET)
        throw new error_extend_1.DomainError("No JWT secret provided");
    const jwt = (0, jsonwebtoken_1.sign)({ id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
    });
    return jwt;
};
exports.signToken = signToken;
/**
 * Validates a given JSON Web Token (JWT).
 *
 * @param {string} jwt - The JWT to validate.
 * @returns {string | object} Returns the decoded token if valid, or "not_auth" if invalid.
 *
 * @example
 * const tokenData = await getToken("your.jwt.token");
 * if (tokenData === "not_auth") {
 *   console.log("Token is invalid or expired");
 * } else {
 *   console.log("Token is valid:", tokenData);
 * }
 */
const getToken = async (jwt) => {
    if (!process.env.JWT_SECRET)
        throw new error_extend_1.DomainError("No JWT secret provided");
    if (!jwt)
        return "not_auth";
    const isOK = (0, jsonwebtoken_1.verify)(jwt, process.env.JWT_SECRET);
    if (!isOK)
        return "not_auth";
    return isOK;
};
exports.getToken = getToken;
/**
 * Encrypts a password using bcrypt with a salt round of 8.
 *
 * @param {string} pass - The plain text password to encrypt.
 * @returns {Promise<string>} The hashed password.
 *
 * @example
 * const hashedPassword = await encrypt("my_secure_password");
 * console.log(hashedPassword);
 */
const encrypt = async (pass) => {
    const passwordHash = await (0, bcryptjs_1.hash)(pass, 8);
    return passwordHash;
};
exports.encrypt = encrypt;
/**
 * Verifies a plain text password against a hashed password.
 *
 * @param {string} pass - The plain text password.
 * @param {string} passHash - The hashed password to compare against.
 * @returns {Promise<boolean>} Returns `true` if the password matches, otherwise `false`.
 *
 * @example
 * const isValid = await verified("my_secure_password", hashedPassword);
 * console.log(isValid); // true or false
 */
const verified = async (pass, passHash) => {
    const isCorrect = await (0, bcryptjs_1.compare)(pass, passHash);
    return isCorrect;
};
exports.verified = verified;
//# sourceMappingURL=token.js.map
//# debugId=e7844f8e-98b8-511b-8c96-c11516cbb6e4
