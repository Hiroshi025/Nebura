import z from "zod";

import { Roles } from "@/infra/constants/user.constants";
import { DomainError } from "@/infra/extenders/errors.extender";
import { main } from "@/main";

export class UserEntity {
  constructor(
    public readonly id: string,
    public name: string,
    public email: string,
    public password: string,
    public role: Roles = "user",
  ) {}

  changeEmail(newEmail: string) {
    try {
      z.string().email().parse(newEmail);
      this.email = newEmail;
    } catch {
      throw new DomainError("Invalid email format");
    }
  }

  changePassword(newPassword: string) {
    try {
      z.string().min(8).parse(newPassword);
      this.password = newPassword;
    } catch {
      throw new DomainError("Invalid password format");
    }
  }

  changeName(newName: string) {
    try {
      z.string().min(3).max(50).parse(newName);
      this.name = newName;
    } catch {
      throw new DomainError("Invalid name format");
    }
  }

  async changeRole(newRole: Roles, currentRole: Roles, id: string) {
    try {
      z.enum(["admin", "user", "guest", "developer"]).parse(newRole);
      if (currentRole !== "admin") {
        throw new DomainError("Only admin can change roles");
      }

      const data = await main.prisma.userAPI.findUnique({ where: { id } });
      if (!data) throw new DomainError("User not found");

      this.role = newRole;
    } catch {
      throw new DomainError("Invalid role format");
    }
  }
}
