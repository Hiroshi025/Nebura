// Importa los tipos necesarios de Express
// import { Request, Response } from 'express';

import { TRoutesInput } from "../../../../../types/backend";
import { AuthApiController } from "../../controllers/auth.controllers";

const format = (str: string): string => `/api/v1/auth${str}`;

export default ({ app }: TRoutesInput) => {
  app.post(format("/register"), AuthApiController.Register);
  app.post(format("/login"), AuthApiController.Login);
  app.get(format("/:id"), AuthApiController.Info);
};
