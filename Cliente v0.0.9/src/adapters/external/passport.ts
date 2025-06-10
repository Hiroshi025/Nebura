/**
 * Passport configuration for Discord authentication strategy.
 *
 * This module sets up Passport.js to use the Discord OAuth2 strategy,
 * including serialization and deserialization of user sessions.
 *
 * @module adapters/external/passport
 */

import passport from "passport";
import { Strategy } from "passport-discord";

import { hostURL } from "@/shared/functions";
import { config } from "@utils/config";

//TODO Considerar agregar nuevos metodos de auth como google y la creacion de la cuenta con email y contraseña

/**
 * Serializes the user object into the session.
 *
 * @param user - The user object to serialize.
 * @param done - Callback to signal completion.
 */
passport.serializeUser((user: any, done: any) => {
  done(null, user);
});

/**
 * Deserializes the user object from the session.
 *
 * @param obj - The serialized user object.
 * @param done - Callback to signal completion.
 */
passport.deserializeUser((obj: any, done: any) => {
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
passport.use(
  new Strategy(
    {
      /**
       * The Discord application's client ID.
       */
      clientID: config.modules.discord.clientId,
      /**
       * The Discord application's client secret.
       */
      clientSecret: config.modules.discord.clientSecret,
      /**
       * The callback URL to which Discord will redirect after authentication.
       */
      callbackURL: `${hostURL()}/${config.modules.discord.callback}`,
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
    (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
      //console.log(profile);
      process.nextTick(async () => {
        return done(null, profile);
      });
    },
  ),
);

/**
 * Exports the configured Passport instance.
 */
export { passport };
