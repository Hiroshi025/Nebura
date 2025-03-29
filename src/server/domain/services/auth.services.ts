import { Roles } from "@/infra/constants/user.constants";
import { main } from "@/main";
import { UserEntity } from "@/server/domain/entities/user.entity";
import { encrypt, signToken, verified } from "@/server/shared/utils/token";
import { User } from "@/types/utils";

import { AuthL, AuthR } from "../../interfaces/http/dto/auth.zod";

export const getAuth = async (id: string) => {
  const data = await main.prisma.userAPI.findUnique({ where: { id } });
  if (!data) return "user_not_found";
  return data;
};

export const NewAuth = async (body: Partial<User>) => {
  const { email, password, name } = body;
  if (!email || !password || !name) return "missing_data";
  const validate = AuthR.safeParse(body);
  if (!validate.success)
    return {
      errors: validate.error.errors,
      data: null,
    };

  const checkIs = await main.prisma.userAPI.findUnique({ where: { email } });
  if (checkIs) return "user_already_exist";

  const passHash = await encrypt(password);
  if (!passHash) return "err_encrypt_password";
  const createAuth = await main.prisma.userAPI.create({
    data: {
      email: email,
      password: passHash,
      name: name,
    },
  });

  return createAuth;
};

export const LoginAuth = async ({ email, password }: Partial<User>) => {
  if (!email || !password) return "missing_data";
  const validate = AuthL.safeParse({ email, password });
  if (!validate.success)
    return {
      errors: validate.error.errors,
      data: null,
    };

  const checkIs = await main.prisma.userAPI.findUnique({ where: { email } });
  if (!checkIs) return "date_incorrect";

  const passwordHash = checkIs.password;
  const isCorrect = await verified(password, passwordHash);

  if (!isCorrect) return "password_incorrect";
  const token = signToken(checkIs.email);
  const data = { token, user: checkIs };
  return data;
};

export const UpdateAuth = async (id: string, body: Partial<User>) => {
  const { email, password, name } = body;
  if (!email || !password || !name || !id) return "missing_data";
  const validate = AuthR.safeParse(body);
  if (!validate.success)
    return {
      errors: validate.error.errors,
      data: null,
    };

  const checkIs = await main.prisma.userAPI.findUnique({ where: { id } });
  if (!checkIs) return "user_not_found";

  const entity = new UserEntity(
    checkIs.id,
    checkIs.name,
    checkIs.email,
    checkIs.password,
    checkIs.role as Roles,
  );

  entity.changeEmail(email);
  entity.changePassword(password);
  entity.changeName(name);

  const passHash = await encrypt(entity.password);
  if (!passHash) return "err_encrypt_password";

  const updateAuth = await main.prisma.userAPI.update({
    where: { id },
    data: {
      email: entity.email,
      password: passHash,
      name: entity.name,
    },
  });

  return updateAuth;
};
