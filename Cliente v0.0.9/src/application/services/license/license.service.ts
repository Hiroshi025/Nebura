import { main } from "@/main";

import { CreateLicenseDto, UpdateLicenseDto } from "../../dto/license.dtos";
import { LicenseEntity } from "../../entitys/license.entity";

export class LicenseService {
  async create(createDto: CreateLicenseDto): Promise<LicenseEntity> {
    const license = await main.prisma.license.create({
      data: {
        ...createDto,
        requestLimit: createDto.requestLimit || 1000,
        requestCount: 0,
      },
      include: {
        user: true,
        admin: true,
      },
    });

    return new LicenseEntity(license);
  }

  async findAll(): Promise<LicenseEntity[]> {
    const licenses = await main.prisma.license.findMany({
      include: { user: true, admin: true },
    });
    return licenses.map((license) => new LicenseEntity(license));
  }

  async findById(id: string): Promise<LicenseEntity | null> {
    const license = await main.prisma.license.findUnique({
      where: { id },
      include: { user: true, admin: true },
    });
    return license ? new LicenseEntity(license) : null;
  }

  async findByUserId(userId: string): Promise<LicenseEntity[]> {
    const licenses = await main.prisma.license.findMany({
      where: { userId },
      include: { user: true, admin: true },
    });
    return licenses.map((license) => new LicenseEntity(license));
  }

  async update(id: string, updateDto: UpdateLicenseDto): Promise<LicenseEntity> {
    const license = await main.prisma.license.update({
      where: { id },
      data: updateDto,
      include: { user: true, admin: true },
    });
    return new LicenseEntity(license);
  }

  async delete(id: string): Promise<void> {
    await main.prisma.license.delete({ where: { id } });
  }

  async validateLicense(key: string, hwid: string): Promise<boolean> {
    const license = await main.prisma.license.findUnique({ where: { id: key } });

    if (!license || license.validUntil < new Date() || !license.hwid.includes(hwid)) {
      return false;
    }

    await main.prisma.license.update({
      where: { id: key },
      data: { requestCount: { increment: 1 } },
    });

    return license.requestCount < license.requestLimit;
  }
}
