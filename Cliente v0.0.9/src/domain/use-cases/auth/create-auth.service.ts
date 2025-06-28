import axios from "axios";

import { AuthLogin } from "@/interfaces/http/middlewares/validators/user";
import { Notification } from "@/interfaces/messaging/broker/notification"; // Importa Notification
import { User } from "@/typings/utils";
import { AuthRepository } from "@domain/gateaway/shared/auth.repository";
import { Prisma } from "@prisma/client";
import { logWithLabel } from "@utils/functions/console";
import { encrypt, signToken, verified } from "@utils/token";

/**
 * Service for handling authentication and user management operations.
 *
 * This service provides methods for retrieving users, creating new users, and authenticating users.
 *
 * @see [Prisma Documentation](https://www.prisma.io/docs/)
 * @see [Discord API Reference](https://discord.com/developers/docs/reference)
 */
export class AuthService {
  private notifier = new Notification(); // Instancia de Notification
  private authRepository = new AuthRepository(); // Instancia del repositorio de autenticación
  /**
   * Retrieves a user by their unique ID.
   *
   * @param id - The unique identifier of the user.
   * @returns A promise that resolves to the user data if found, or an error response if not found or on failure.
   *
   * @example
   * ```typescript
   * const user = await authService.getAuth("userId123");
   * ```
   */
  async getAuth(id: string) {
    try {
      const user = await this.authRepository.findAuthById(id);
      if (!user) {
        return { error: "USER_NOT_FOUND", message: "User not found" };
      }

      return user;
    } catch (error) {
      logWithLabel("error", "The user not found");
      return { error: "INTERNAL_SERVER_ERROR", message: "An error occurred while fetching user" };
    }
  }

  /**
   * Creates a new user in the system.
   *
   * This method validates the required fields, checks for existing users, encrypts the password,
   * and optionally fetches Discord user data if a Discord ID is provided.
   *
   * @param body - Partial user data including email, password, name, and optionally discordId.
   * @returns A promise that resolves to the created user data or an error response.
   *
   * @remarks
   * - The password is encrypted before storage.
   * - If `discordId` is provided, the method fetches user data from the Discord API.
   *
   * @see [Discord API - Get User](https://discord.com/developers/docs/resources/user#get-user)
   *
   * @example
   * ```typescript
   * const result = await authService.createAuth({ email: "test@example.com", password: "pass", name: "Test" });
   * ```
   */
  async createAuth(body: Partial<User>) {
    try {
      const { email, password, name, discordId } = body;

      // Validar campos requeridos
      if (!email || !password || !name || !discordId) {
        return { error: "MISSING_DATA", message: "Required fields are missing" };
      }

      // Validar estructura de datos
      /*const validation = AuthRegister.safeParse(body);
      if (!validation.success) {
        return {
          error: "VALIDATION_ERROR",
          message: "Invalid data format",
          details: validation.error.errors,
        };
      }*/

      // Verificar si el usuario ya existe
      const existingUser = await this.authRepository.findAuthByEmail(email);
      if (existingUser) {
        // Notificación de intento fallido
        await this.notifier.sendWebhookNotification(
          "User Registration Attempt Failed",
          `A registration attempt failed because the email \`${email}\` is already in use.`,
          "#F44336",
          [
            { name: "Email", value: email, inline: true },
            { name: "Name", value: name, inline: true },
          ],
          { content: "🔴 Registration failed (user exists)", username: "Auth Service" },
        );
        return { error: "USER_EXISTS", message: "User with this email already exists" };
      }

      // Encriptar contraseña
      const passwordHash = await encrypt(password);
      if (!passwordHash) {
        // Notificación de error de encriptación
        await this.notifier.sendWebhookNotification(
          "User Registration Failed",
          `Password encryption failed for email: \`${email}\`.`,
          "#F44336",
          [{ name: "Email", value: email, inline: true }],
          { content: "🔴 Registration failed (encryption)", username: "Auth Service" },
        );
        return { error: "ENCRYPTION_ERROR", message: "Failed to encrypt password" };
      }

      const response = await axios.get(`https://discord.com/api/v10/users/${discordId}`, {
        headers: {
          Authorization: `Bot ${process.env.TOKEN_DISCORD}`,
        },
      });

      const data = response.data;
      // Crear usuario
      const newUser = await this.authRepository.createAuth(
        {
          email: email as string,
          name: name as string,
          password: passwordHash,
        },
        {
          id: data.id,
          avatar: data.avatar,
          username: data.username ? data.username : data.global_name,
          global_name: data.global_name,
        },
      );

      if (!newUser) {
        await this.notifier.sendWebhookNotification(
          "User Registration Failed",
          `User registration failed for email: \`${email}\`.`,
          "#F44336",
          [{ name: "Email", value: email, inline: true }],
          { content: "🔴 Registration failed", username: "Auth Service" },
        );
      }

      await this.notifier.sendWebhookNotification(
        "User Registration Successful",
        `A new user has been successfully registered with email: \`${email}\`.`,
        "#4CAF50",
        [
          { name: "Email", value: email, inline: true },
          { name: "Name", value: name, inline: true },
          { name: "Discord ID", value: data.id || "N/A", inline: true },
        ],
        { content: "🟢 New user registered", username: "Auth Service" },
      );

      return { user: newUser };
    } catch (error) {
      logWithLabel("error", "Failed to create user");

      // Notificación de error general
      await this.notifier.sendWebhookNotification(
        "User Registration Error",
        `An error occurred during user registration.`,
        "#F44336",
        [
          { name: "Email", value: body.email || "N/A", inline: true },
          { name: "Name", value: body.name || "N/A", inline: true },
          {
            name: "Error",
            value: error instanceof Error ? error.message : "Unknown error",
            inline: false,
          },
        ],
        { content: "🔴 Registration error", username: "Auth Service" },
      );

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return {
          error: "DATABASE_ERROR",
          message: "Database operation failed",
          details: error.meta,
        };
      }

      return { error: "INTERNAL_SERVER_ERROR", message: "Failed to create user" };
    }
  }

  /**
   * Authenticates a user with the provided credentials.
   *
   * This method validates the credentials, checks the user's existence, verifies the password,
   * and returns a JWT token along with user data (excluding the password).
   *
   * @param credentials - An object containing the user's email and password.
   * @returns A promise that resolves to an object containing the JWT token and user data, or an error response.
   *
   * @see [JWT Introduction](https://jwt.io/introduction)
   *
   * @example
   * ```typescript
   * const loginResult = await authService.loginAuth({ email: "test@example.com", password: "pass" });
   * ```
   */
  async loginAuth(credentials: Partial<User>) {
    try {
      const { email, password } = credentials;

      // Validar campos requeridos
      if (!email || !password) {
        return { error: "MISSING_DATA", message: "Email and password are required" };
      }

      // Validar estructura de datos
      const validation = AuthLogin.safeParse({ email, password });
      if (!validation.success) {
        return {
          error: "VALIDATION_ERROR",
          message: "Invalid credentials format",
          details: validation.error.errors,
        };
      }

      // Buscar usuario
      const user = await this.authRepository.findAuthByEmail(email);
      if (!user) {
        return { error: "INVALID_CREDENTIALS", message: "Invalid email or password" };
      }

      // Verificar contraseña
      const isPasswordValid = await verified(password, user.password);
      if (!isPasswordValid) {
        return { error: "INVALID_CREDENTIALS", message: "Invalid email or password" };
      }

      // Generar token JWT
      const token = signToken(user.id);

      // Eliminar contraseña del objeto usuario
      const { password: _, ...userWithoutPassword } = user;

      return { token, user: userWithoutPassword };
    } catch (error) {
      console.error("Error in login:", error);
      return { error: "INTERNAL_SERVER_ERROR", message: "Failed to authenticate user" };
    }
  }
}
