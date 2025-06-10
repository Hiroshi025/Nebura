import { main } from "@/main";

import { CreateLicenseDto, UpdateLicenseDto } from "../../dto/license.dtos";
import { LicenseEntity } from "../../entitys/license.entity";

export class LicenseService {
  async create(createDto: CreateLicenseDto): Promise<LicenseEntity> {
    const { userId, adminId, validUntil, key, ...licenseData } = createDto;
    const licenseDataToCreate: any = {
      ...licenseData,
      key,
      type: createDto.type,
      userId,
      adminId,
      hwid: createDto.hwid ? createDto.hwid : [],
      requestLimit: createDto.requestLimit || 1000,
      requestCount: 0,
      validUntil: validUntil ? new Date(validUntil) : undefined,
    };

    // Asegúrate de no enviar 'id' en el payload
    delete licenseDataToCreate.id;

    const license = await main.prisma.license.create({
      data: licenseDataToCreate,
    });

    return new LicenseEntity(license);
  }

  async findAll(): Promise<LicenseEntity[]> {
    const licenses = await main.prisma.license.findMany();
    return licenses.map((license) => new LicenseEntity(license));
  }

  async findById(id: string): Promise<LicenseEntity | null> {
    const license = await main.prisma.license.findUnique({
      where: { id },
    });
    return license ? new LicenseEntity(license) : null;
  }

  async findByKey(key: string): Promise<LicenseEntity | null> {
    const license = await main.prisma.license.findFirst({
      where: { key },
    });
    return license ? new LicenseEntity(license) : null;
  }

  async findByUserId(userId: string): Promise<LicenseEntity[]> {
    const licenses = await main.prisma.license.findMany({
      where: { userId },
    });
    return licenses.map((license) => new LicenseEntity(license));
  }

  async update(id: string, updateDto: UpdateLicenseDto): Promise<LicenseEntity> {
    // Permite actualizar por id (ObjectId)
    const license = await main.prisma.license.update({
      where: { id },
      data: updateDto,
    });
    return new LicenseEntity(license);
  }

  async updateByKey(key: string, updateDto: UpdateLicenseDto) {
    // Permite actualizar por key (clave de licencia)
    const data = await main.prisma.license.findFirst({
      where: { key },
    });

    if (!data) return null;
    const license = await main.prisma.license.update({
      where: { id: data.id },
      data: updateDto,
    });
    return new LicenseEntity(license);
  }

  async delete(id: string) {
    const data = await main.prisma.license.findFirst({
      where: { key: id },
    });

    if (!data) return false;

    return await main.prisma.license.delete({ where: { id: data.id } });
  }

  async deleteByKey(key: string) {
    const data = await main.prisma.license.findFirst({
      where: { key },
    });

    if (!data) return false;

    return await main.prisma.license.delete({ where: { id: data.id } });
  }

  async validateLicense(key: string, hwid: string): Promise<boolean> {
    const license = await main.prisma.license.findFirst({ where: { key } });

    if (!license || license.validUntil < new Date() || !license.hwid.includes(hwid)) {
      return false;
    }

    await main.prisma.license.update({
      where: { id: license.id },
      data: { requestCount: { increment: 1 } },
    });

    return license.requestCount < license.requestLimit;
  }
}
