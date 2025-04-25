import { Gemini } from "../typings";

/**
 * Representa un agente que interactúa con un sistema externo.
 */
export class Agent {
  /**
   * URL del webhook para enviar notificaciones.
   */
  public webhook_url: string;

  /**
   * Licencia asociada al agente.
   */
  public license: string;

  /**
   * Identificador único del usuario.
   */
  public userId: string;

  /**
   * Información adicional del agente representada por un objeto Gemini.
   */
  public gemini: Gemini;

  /**
   * Crea una nueva instancia de la clase Agent.
   * 
   * @param license - Licencia asociada al agente.
   * @param userId - Identificador único del usuario.
   * @param gemini - Información adicional del agente.
   * @param webhook_url - URL del webhook para enviar notificaciones.
   */
  constructor(
    license: string,
    userId: string,
    gemini: Gemini,
    webhook_url: string
  ) {
    this.webhook_url = webhook_url;
    this.license = license;
    this.userId = userId;
    this.gemini = gemini;
  }

  /**
   * Obtiene la información del agente.
   * 
   * @returns Un objeto con la información del agente.
   */
  public async getAgentInfo() {
    return {
      webhook_url: this.webhook_url,
      license: this.license,
      userId: this.userId,
      gemini: this.gemini,
    };
  }

  /**
   * Envía una alerta al webhook configurado.
   * 
   * @param message - Mensaje principal de la alerta.
   * @param title - Título de la alerta.
   * @param icon - URL del icono que se mostrará en la alerta.
   * @param description - Descripción detallada de la alerta.
   * @returns Un booleano indicando si la operación fue exitosa.
   */
  public async sendAlert(
    message: string,
    title: string,
    icon: string,
    description: string
  ): Promise<boolean> {
    if (!this.webhook_url) return false;

    const payload = {
      content: message,
      embeds: [
        {
          title: title,
          description: description,
          color: 0x00ff00,
          thumbnail: {
            url: icon,
          },
        },
      ],
    };

    try {
      const response = await fetch(this.webhook_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error(`Error al enviar la alerta: ${response.statusText}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Error al realizar la solicitud: ${error}`);
      return false;
    }
  }
}
