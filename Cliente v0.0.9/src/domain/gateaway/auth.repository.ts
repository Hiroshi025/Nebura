import { AuthRegisterType } from "@/adapters/validators/user";
import { main } from "@/main";
import { RepositoryError } from "@utils/extenders/error.extend";

export class AuthRepository {
  constructor() {}
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
