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
  id: string;
  email: string;
  name: string;
  discord: string;
  password: string;
  rol: string;
  createdAt: Date;
}