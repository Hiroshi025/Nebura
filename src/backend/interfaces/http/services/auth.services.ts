import { encrypt, signToken, verified } from "@/backend/utils/token";
import { main } from "@/main";
import { User } from "@/types/backend";

import { AuthL, AuthR } from "../dto/auth.zod";

export const getAuth = async (id: string) => {
  const data = await main.prisma.userAPI.findUnique({ where: { id } });
  if (!data) return "user_not_found";
  return data;
};

export const NewAuth = async (body: Partial<User>) => {
  const { email, password, name, discord } = body;
  if (!email || !password || !name || !discord) return "missing_data";
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
