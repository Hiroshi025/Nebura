import axios from "axios";

import { Agent } from "../infra/agent";
import { LicenseError } from "../shared/extenders/errors.extenders";
import { Gemini } from "../typings";

/**
 * Clase para gestionar licencias a través de una API.
 */
export class License extends Agent {
  public license: string;

  /**
   * Constructor de la clase License.
   * @param license - Clave de la licencia.
   */
  constructor(license: string) {
    if (!license) {
      throw new LicenseError("La licencia es obligatoria.");
    }
    super(license, "", {} as Gemini, ""); // Llama al constructor de la clase base con valores predeterminados.
    this.license = license;
  }

  /**
   * Obtiene información de la licencia asociada a un usuario por su ID.
   * @param userId - ID del usuario.
   * @param url - URL base de la API.
   * @returns Promesa que resuelve con la respuesta de la API o `false` si falla.
   * @throws Error si los parámetros son inválidos o si ocurre un problema con la solicitud.
   */
  public async byuserId(userId: string, url: string) {
    if (!userId || !url) {
      throw new LicenseError("El userId y el url son obligatorios.");
    }

    try {
      const res = await axios({
        method: "GET",
        url: `${url}/api/v1/license/user/${userId}`,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res || res.status !== 200) return false;
      return res.data;
    } catch (error) {
      console.error("Error en byuserId:", error);
      throw new LicenseError("No se pudo obtener la licencia por userId.");
    }
  }

  /**
   * Valida la licencia actual con un identificador de hardware (HWID).
   * @param url - URL base de la API.
   * @param hwid - Identificador de hardware.
   * @returns Promesa que resuelve con la respuesta de la API o `false` si falla.
   * @throws Error si los parámetros son inválidos o si ocurre un problema con la solicitud.
   */
  public async validate(url: string, hwid: string) {
    if (!url || !hwid) {
      throw new LicenseError("El url y el hwid son obligatorios.");
    }

    try {
      const res = await axios({
        method: "POST",
        url: `${url}/api/v1/license/validate/${this.license}`,
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          hwid: hwid,
        },
      });

      if (!res || res.status !== 200) return false;
      return res.data;
    } catch (error) {
      console.error("Error en validate:", error);
      throw new LicenseError("No se pudo validar la licencia.");
    }
  }

  /**
   * Obtiene información detallada de la licencia actual.
   * @param url - URL base de la API.
   * @returns Promesa que resuelve con la respuesta de la API o `false` si falla.
   * @throws Error si el parámetro es inválido o si ocurre un problema con la solicitud.
   */
  public async byId(url: string) {
    if (!url) {
      throw new LicenseError("El url es obligatorio.");
    }

    try {
      const res = await axios({
        method: "GET",
        url: `${url}/api/v1/license/${this.license}`,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res || res.status !== 200) return false;
      return res.data;
    } catch (error) {
      console.error("Error en byId:", error);
      throw new LicenseError("No se pudo obtener la licencia por ID.");
    }
  }
}
