import { UpdateLicenseDto } from "@/interfaces/http/dtos/license.dto";
import { LicenseDataToCreate } from "@typings/modules/api";

export interface ILicenseRepositoryPort {
  findMany(): Promise<any[]>;
  findById(id: string): Promise<any | false>;
  findByKey(key: string): Promise<any | false>;
  findByUserId(userId: string): Promise<any[]>;
  updateLic(id: string, data: UpdateLicenseDto): Promise<any>;
  deleteById(id: string): Promise<any | false>;
  updateByIdRequest(id: string): Promise<any | false>;
  createLic(data: LicenseDataToCreate): Promise<any>;
}