"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verified = exports.signToken = exports.getToken = exports.encrypt = void 0;
const bcryptjs_1 = require("bcryptjs");
const jsonwebtoken_1 = require("jsonwebtoken");
const config_1 = require("../../../shared/utils/config");
const sessions = config_1.config.environments.default.api.sessions;
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
    if (!sessions.jwtsecret)
        throw new Error("No JWT secret provided");
    const jwt = (0, jsonwebtoken_1.sign)({ id }, sessions.jwtsecret, {
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
    if (!sessions.jwtsecret)
        throw new Error("No JWT secret provided");
    if (!jwt)
        return "not_auth";
    const isOK = (0, jsonwebtoken_1.verify)(jwt, sessions.jwtsecret);
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
