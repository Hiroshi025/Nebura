import z from "zod";

import { DomainError } from "@/infra/extenders/errors.extender";

export class UserEntity {
  constructor(
    public readonly id: string,
    public name: string,
    public email: string,
    public password: string,
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
}
