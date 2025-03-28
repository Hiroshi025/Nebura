export interface ProyectConfig {
  project: {
    name: string; // Nombre del proyecto
    version: string; // Versión del proyecto
    type?: string; // Tipo de proyecto (opcional)
  };
  modules?: Record<string, unknown>; // Módulos adicionales (opcional)

  environments: {
    default: EnvironmentConfig; // Configuración por defecto
    production?: Partial<EnvironmentConfig>; // Configuración para producción (hereda de 'default')
  };
}

export interface EnvironmentConfig {
  api: {
    port: number; // Puerto del servidor API
    host: string; // Dirección del host
    sessions: {
      websecret: string; // Secreto para la sesión web
    };
    swagger: {
      local: string; // Ruta local del archivo Swagger
      name: string; // Nombre de la API
      version: string; // Versión de la API
      url: string; // URL de la API
      auth: {
        name: string; // Nombre de usuario para la autenticación
        password: string; // Contraseña para la autenticación
      };
    };
  };
  database: {
    sessions: {
      url: string; // Ruta de la base de datos de sesiones
      name: string; // Nombre de la base de datos de sesiones
    };
  };
}
