import { UpdateLicenseDto } from "@/interfaces/http/dtos/license.dto";
import { main } from "@/main";
import { ILicenseRepositoryPort } from "@domain/ports/services/license.repository.port";
import { LicenseDataToCreate } from "@typings/modules/api";

export class LicenseRepository implements ILicenseRepositoryPort {
  constructor() {}
  public async findMany() {
    const data = await main.prisma.license.findMany();
    return data;
  }

  public async findById(id: string) {
    const data = await main.prisma.license.findUnique({
      where: { id },
    });
    return data ? data : false;
  }

  public async findByKey(key: string) {
    const data = await main.prisma.license.findUnique({
      where: { key },
    });
    return data ? data : false;
  }

  public async findByUserId(userId: string) {
    const data = await main.prisma.license.findMany({
      where: { userId },
    });
    return data;
  }

  public async updateLic(id: string, data: UpdateLicenseDto) {
    try {
      const updatedData = await main.prisma.license.update({
        where: { id },
        data,
      });
      return updatedData;
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "Unknown repository error");
    }
  }

  public async deleteById(id: string) {
    try {
      const data = await main.prisma.license.delete({
        where: { id },
      });
      return data ? data : false;
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "Unknown repository error");
    }
  }

  public async updateByIdRequest(id: string) {
    try {
      const data = await main.prisma.license.update({
        where: { id },
        data: { requestCount: { increment: 1 } },
      });
      return data ? data : false;
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "Unknown repository error");
    }
  }

  public async createLic(data: LicenseDataToCreate) {
    try {
      if (data.validUntil === undefined) {
        throw new Error("validUntil is required and cannot be undefined");
      }
      const license = await main.prisma.license.create({
        data: {
          ...data,
          validUntil: data.validUntil as Date | string,
        },
      });
      return license;
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "Unknown repository error");
    }
  }
}
