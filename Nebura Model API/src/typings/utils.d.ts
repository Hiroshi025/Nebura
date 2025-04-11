/**
 * Extends the Express Request interface to include additional properties.
 */
declare global {
  namespace Express {
    interface Request {
      /**
       * The authenticated user object, if available.
       */
      user?: any;

      /**
       * The license information associated with the request.
       */
      license?: {
        /**
         * The type of license. Can be "FREE", "BASIC", or "PREMIUM".
         */
        type: "FREE" | "BASIC" | "PREMIUM";
      };

      /**
       * The IP address of the client making the request.
       */
      clientIp?: string;
    }
  }
}

/**
 * Represents the input required to initialize application routes.
 */
export interface TRoutesInput {
  /**
   * The Express application instance.
   */
  app: Application;
}

/**
 * Represents a user in the system.
 */
export interface User {
  /**
   * The unique identifier of the user.
   */
  id: string;

  /**
   * The email address of the user.
   */
  email: string;

  /**
   * The name of the user.
   */
  name: string;

  /**
   * The Discord username of the user.
   */
  discord: string;

  /**
   * The hashed password of the user.
   */
  password: string;

  /**
   * The role of the user in the system.
   */
  rol: string;

  /**
   * The date and time when the user was created.
   */
  createdAt: Date;
}

/**
 * Represents the input required for a login operation.
 */
interface LoginInput {
  /**
   * The email address of the user attempting to log in.
   */
  email: string;

  /**
   * The password of the user attempting to log in.
   */
  password: string;
}

/**
 * Represents the input required for a registration operation.
 * Extends the LoginInput interface.
 */
interface RegisterInput extends LoginInput {
  /**
   * The name of the user registering.
   */
  name: string;

  /**
   * Additional fields required for registration.
   */
  // otros campos necesarios
}

/**
 * Represents the input required to update a user's information.
 * Extends a partial version of the RegisterInput interface.
 */
interface UpdateInput extends Partial<RegisterInput> {
  /**
   * The unique identifier of the user to be updated.
   */
  id: string;
}

/**
 * Represents a field used in various contexts, such as forms or UI components.
 */
export interface Fields {
  /**
   * The name of the field.
   */
  name: string;

  /**
   * The value of the field.
   */
  value: string;

  /**
   * Whether the field should be displayed inline.
   */
  inline?: boolean;
}
