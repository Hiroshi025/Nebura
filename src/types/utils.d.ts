// Extend the Request interface to include the 'user' property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export interface TRoutesInput {
  app: Application;
}

export interface User {
  email: string;
  name: string;
  password: string;
  role: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput extends LoginInput {
  name: string;
  // otros campos necesarios
}

interface UpdateInput extends Partial<RegisterInput> {
  id: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  discord: string;
  password: string;
  rol: string;
  createdAt: Date;
}
