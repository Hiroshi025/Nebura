export interface ProyectConfig {
  project: {
    name: string; // Nombre del proyecto
    version: string; // Versión del proyecto
    type?: string; // Tipo de proyecto (opcional)
    "api-version": string; // Versión de la API
  };
  modules?: Record<string, unknown>; // Módulos adicionales (opcional)

  environments: {
    default: EnvironmentConfig; // Configuración por defecto
    production?: Partial<EnvironmentConfig>; // Configuración para producción (hereda de 'default')
  };
}

export interface Artificial {
  services: {
    gemini: {
      model: string; // Modelo de Gemini
      configsystem: string; // Sistema de configuración
      "api-key": string; // Clave API
    };
  };
}

export interface SwaggerConfig {
  local: string; // Ruta local del archivo Swagger
  name: string; // Nombre de la API
  version: string; // Versión de la API
  url: string; // URL de la API
  docs: string; // Ruta de los documentos de la API
  auth: {
    name: string; // Nombre de usuario para la autenticación
    password: string; // Contraseña para la autenticación
  };
}

export interface ApiConfig {
  port: number; // Puerto del servidor API
  host: string; // Dirección del host
  sessions: {
    websecret: string; // Secreto para la sesión web
    jwtsecret: string; // Secreto para el JWT
  };
  swagger: SwaggerConfig; // Configuración de Swagger
}

export interface EnvironmentConfig {
  api: ApiConfig; // Configuración de la API
  database: {
    sessions: {
      url: string; // Ruta de la base de datos de sesiones
      name: string; // Nombre de la base de datos de sesiones
    };
  };
  artificial: Artificial; // Configuración de servicios artificiales
  "key-secrets": {
    administrator: string; // Clave secreta del administrador
  }
}
