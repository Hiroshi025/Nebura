import { UpdateLicenseDto } from "@/application/dto/license.dto";
import { main } from "@/main";
import { LicenseDataToCreate } from "@typings/modules/api";

export class LicenseRepository {
  constructor() {}
  public async findLicenseMany() {
    const data = await main.prisma.license.findMany();
    return data;
  }

  public async findLicenseById(id: string) {
    const data = await main.prisma.license.findUnique({
      where: { id },
    });
    return data ? data : false;
  }

  public async findLicenseByKey(key: string) {
    const data = await main.prisma.license.findUnique({
      where: { key },
    });
    return data ? data : false;
  }

  public async findLicenseByUserId(userId: string) {
    const data = await main.prisma.license.findMany({
      where: { userId },
    });
    return data;
  }

  public async updateLicenseById(id: string, data: UpdateLicenseDto) {
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

  public async deleteLicenseById(id: string) {
    try {
      const data = await main.prisma.license.delete({
        where: { id },
      });
      return data ? data : false;
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "Unknown repository error");
    }
  }

  public async updateRequestLicenseById(id: string) {
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

  public async createLicence(data: LicenseDataToCreate) {
    try {
      if (data.validUntil === undefined) {
        throw new Error("validUntil is required and cannot be undefined");
      }
      const license = await main.prisma.license.create({
        data: {
          ...data,
          validUntil: data.validUntil as Date | string
        }
      });
      return license;
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "Unknown repository error");
    }
  }
}
