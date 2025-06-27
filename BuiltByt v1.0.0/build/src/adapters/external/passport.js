"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="f5bbf058-0c57-5f5c-908c-a63a96a65d60")}catch(e){}}();

/**
 * Passport configuration for Discord authentication strategy.
 *
 * This module sets up Passport.js to use the Discord OAuth2 strategy,
 * including serialization and deserialization of user sessions.
 *
 * @module adapters/external/passport
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.passport = void 0;
const passport_1 = __importDefault(require("passport"));
exports.passport = passport_1.default;
const passport_discord_1 = require("passport-discord");
const functions_1 = require("../../shared/functions");
const config_1 = require("../../shared/utils/config");
//TODO Considerar agregar nuevos metodos de auth como google y la creacion de la cuenta con email y contraseña
/**
 * Serializes the user object into the session.
 *
 * @param user - The user object to serialize.
 * @param done - Callback to signal completion.
 */
passport_1.default.serializeUser((user, done) => {
    done(null, user);
});
/**
 * Deserializes the user object from the session.
 *
 * @param obj - The serialized user object.
 * @param done - Callback to signal completion.
 */
passport_1.default.deserializeUser((obj, done) => {
    done(null, obj);
});
/**
 * Configures the Discord authentication strategy for Passport.
 *
 * Uses the Discord OAuth2 strategy to authenticate users via Discord.
 * The strategy is configured with client credentials and callback URL
 * from the application's configuration. The scope includes "identify"
 * and "guilds" to access basic user information and the user's guilds.
 *
 * The verification callback simply returns the Discord profile.
 */
passport_1.default.use(new passport_discord_1.Strategy({
    /**
     * The Discord application's client ID.
     */
    clientID: config_1.config.modules.discord.id,
    /**
     * The Discord application's client secret.
     */
    clientSecret: config_1.config.modules.discord.secret,
    /**
     * The callback URL to which Discord will redirect after authentication.
     */
    callbackURL: `${(0, functions_1.hostURL)()}/${config_1.config.modules.discord.callback}`,
    /**
     * The OAuth2 scopes requested from Discord.
     */
    scope: ["identify", "guilds"],
}, 
/**
 * Verification callback for the Discord strategy.
 *
 * @param _accessToken - The OAuth2 access token (unused).
 * @param _refreshToken - The OAuth2 refresh token (unused).
 * @param profile - The authenticated user's Discord profile.
 * @param done - Callback to signal completion.
 */
(_accessToken, _refreshToken, profile, done) => {
    //console.log(profile);
    process.nextTick(async () => {
        return done(null, profile);
    });
}));
//# sourceMappingURL=passport.js.map
//# debugId=f5bbf058-0c57-5f5c-908c-a63a96a65d60
