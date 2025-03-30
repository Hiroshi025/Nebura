import { Request, Response } from "express";
import { ZodIssue } from "zod";

import { getAuth, LoginAuth, NewAuth } from "@/server/domain/services/auth.service";

type ResponseType = { errors: ZodIssue[]; data: null };
export class AuthApiCtrl {
  static Login = async ({ body }: Request, res: Response) => {
    const { email, password } = body;

    const response = await LoginAuth({ email, password });
    if ((response as ResponseType).errors || typeof response === "string") {
      return res.status(400).json({
        errors: response,
      });
    }

    return res.status(200).json({
      data: response,
      errors: [],
    });
  };

  static Register = async ({ body }: Request, res: Response): Promise<Response> => {
    const response = await NewAuth(body);
    if ((response as ResponseType).errors || typeof response === "string") {
      return res.status(400).json({
        errors: response,
      });
    }

    return res.status(201).json({
      data: response,
      errors: [],
    });
  };
  
  static Info = async (req: Request, res: Response) => {
    const userId = req.params.id;
    if (!userId) {
      return res.status(400).json({
        errors: [{ message: "Missing user id" }],
      });
    }

    const profile = await getAuth(userId);
    if (typeof profile === "string")
      return res.status(404).json({
        data: null,
        errors: profile,
      });

    return res.status(200).json({
      data: profile,
      errors: [],
    });
  };
}
