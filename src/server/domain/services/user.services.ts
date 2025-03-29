import { z } from "zod";

import { main } from "@/main";

export const UserChangeRole = async (id: string, role: string) => {
  z.enum(["admin", "user", "guest", "developer"]).parse(role);
  const data = await main.prisma.userAPI.findUnique({ where: { id } });
  if (!data) return "User not found";

  const update = await main.prisma.userAPI.update({
    where: { id },
    data: { role },
  });
  if (!update) return "Error updating user role";

  return update;
}