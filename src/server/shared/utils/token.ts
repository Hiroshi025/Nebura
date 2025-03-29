import { compare, hash } from "bcryptjs";
import { sign, verify } from "jsonwebtoken";
import { z } from "zod";

import { config } from "@/shared/utils/config";

const sessions = config.environments.default.api.sessions;

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
const signToken = (id: string): string => {
  const validate = z.string().email().safeParse(id);
  if (!validate.success) throw new Error(validate.error.errors[0].message);
  if (!sessions.jwtsecret) throw new Error("No JWT secret provided");

  const jwt = sign({ id }, sessions.jwtsecret, {
    expiresIn: "1d",
  });

  return jwt;
};

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
const getToken = async (jwt: string): Promise<string | object> => {
  if (!sessions.jwtsecret) throw new Error("No JWT secret provided");
  if (!jwt) return "not_auth";

  const isOK = verify(jwt, sessions.jwtsecret);
  if (!isOK) return "not_auth";

  return isOK;
};

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
const encrypt = async (pass: string): Promise<string> => {
  const passwordHash = await hash(pass, 8);
  return passwordHash;
};

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
const verified = async (pass: string, passHash: string): Promise<boolean> => {
  const isCorrect = await compare(pass, passHash);
  return isCorrect;
};

export { encrypt, getToken, signToken, verified };
