import "passport"; // <-- Esto importa las extensiones de tipos de passport

import { NextFunction, Request, Response } from "express";



// Extiende la interfaz Request para incluir isAuthenticated
//declare global {
//  namespace Express {
//    interface Request {
//      isAuthenticated?: () => boolean;
//    }
//  }
//}

export const AuthPublic = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) return res.redirect("/dashboard/auth");
  next();
};