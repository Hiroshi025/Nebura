import { AuthRegisterType } from "@/interfaces/http/middlewares/validators/user";

export interface IAuthPort {
  createAuth(
    data: AuthRegisterType,
    discord?: { id: string; avatar: string; username: string; global_name: string }
  ): Promise<any | false>;

  findAuthByEmail(email: string): Promise<any | false>;

  findAuthById(id: string): Promise<any | false>;
}