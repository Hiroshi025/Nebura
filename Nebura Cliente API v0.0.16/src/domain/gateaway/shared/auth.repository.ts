import { AuthRegisterType } from "@/interfaces/http/middlewares/validators/user";
import { main } from "@/main";
import { RepositoryError } from "@utils/extends/error.extension";

import { IAuthPort } from "../../ports/auth.service.port";

/**
 * Repository for authentication-related database operations.
 * Implements {@link IAuthPort}.
 *
 * Uses Prisma ORM for database access.
 * @see {@link https://www.prisma.io/docs/concepts/components/prisma-client Prisma Client}
 */
export class AuthRepository implements IAuthPort {
  // Implementa el puerto
  constructor() {}

  /**
   * Creates a new user authentication record in the database.
   * If Discord data is provided, it will be linked to the user.
   *
   * @param data - User registration data (email, password, name)
   * @param discord - Optional Discord user data (id, avatar, username, global_name)
   * @returns The created user record, or false if creation failed
   * @throws {RepositoryError} If a database error occurs
   */
  public async createAuth(
    data: AuthRegisterType,
    discord?: { id: string; avatar: string; username: string; global_name: string },
  ) {
    try {
      let dataCreate;
      if (discord) {
        dataCreate = await main.prisma.userAPI.create({
          data: {
            email: data.email,
            password: data.password,
            name: data.name,
            discord: {
              userId: discord.id,
              userAvatar: discord.avatar,
              userName: discord.username ? discord.username : discord.global_name,
            },
          },
        });
      } else {
        dataCreate = await main.prisma.userAPI.create({
          data: {
            email: data.email,
            password: data.password,
            name: data.name,
          },
        });
      }
      return dataCreate ? dataCreate : false;
    } catch (e) {
      throw new RepositoryError(e instanceof Error ? e.message : "Unknown repository error");
    }
  }

  /**
   * Finds a user authentication record by email.
   *
   * @param email - The user's email address
   * @returns The user record if found, or false if not found
   * @throws {RepositoryError} If a database error occurs
   */
  public async findAuthByEmail(email: string) {
    try {
      const data = await main.prisma.userAPI.findUnique({
        where: { email },
      });

      return data ? data : false;
    } catch (e) {
      throw new RepositoryError(e instanceof Error ? e.message : "Unknown repository error");
    }
  }

  /**
   * Finds a user authentication record by user ID.
   *
   * @param id - The user's unique identifier
   * @returns The user record if found, or false if not found
   * @throws {RepositoryError} If a database error occurs
   */
  public async findAuthById(id: string) {
    try {
      const data = await main.prisma.userAPI.findUnique({
        where: { id },
      });

      return data ? data : false;
    } catch (e) {
      throw new RepositoryError(e instanceof Error ? e.message : "Unknown repository error");
    }
  }
}
