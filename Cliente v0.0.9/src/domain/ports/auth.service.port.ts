import { AuthRegisterType } from "@/interfaces/http/middlewares/validators/user";

/**
 * Interface for the authentication service port.
 *
 * @remarks
 * This interface defines the contract for authentication-related operations,
 * such as creating a new authentication record and retrieving authentication data
 * by email or ID. Implementations should handle user registration and lookup logic.
 *
 * @see {@link https://en.wikipedia.org/wiki/Authentication Authentication - Wikipedia}
 */
export interface IAuthPort {
  /**
   * Creates a new authentication record.
   *
   * @param data - The registration data required to create the authentication record.
   * @param discord - Optional Discord user information to associate with the authentication.
   * @returns A promise that resolves to the created authentication object, or `false` if creation fails.
   *
   * @example
   * ```ts
   * const auth = await authService.createAuth(userData, { id: "123", avatar: "url", username: "user", global_name: "User" });
   * ```
   */
  createAuth(
    data: AuthRegisterType,
    discord?: { id: string; avatar: string; username: string; global_name: string },
  ): Promise<any | false>;

  /**
   * Finds an authentication record by email address.
   *
   * @param email - The email address to search for.
   * @returns A promise that resolves to the authentication object if found, or `false` if not found.
   *
   * @example
   * ```ts
   * const auth = await authService.findAuthByEmail("user@example.com");
   * ```
   */
  findAuthByEmail(email: string): Promise<any | false>;

  /**
   * Finds an authentication record by its unique identifier.
   *
   * @param id - The unique identifier of the authentication record.
   * @returns A promise that resolves to the authentication object if found, or `false` if not found.
   *
   * @example
   * ```ts
   * const auth = await authService.findAuthById("userId123");
   * ```
   */
  findAuthById(id: string): Promise<any | false>;
}
