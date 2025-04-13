// Importa los tipos necesarios de Express
// import { Request, Response } from 'express';

import { Request, Response } from "express";

import { GitHubService } from "@/shared/classUtils/githubService";
import { TRoutesInput } from "@/typings/utils";

// Constantes para paths base y versionado
const BASE_PATH = "/public/github";
const API_VERSION = "/api/v1";

/**
 * Formatea las rutas de autenticación con el prefijo correcto
 * @param path Ruta específica del endpoint
 * @returns Ruta completa formateada
 */
const formatRoute = (path: string): string => `${API_VERSION}${BASE_PATH}${path}`;
export default ({ app }: TRoutesInput) => {
  const githubService = new GitHubService();
  app.get(formatRoute("/users/:username"), async (req: Request, res: Response) => {
    const { username } = req.params;
    try {
      const user = await githubService.getUser(username as string);
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: "Error fetching user" });
    }
  });

  app.get(formatRoute("/users/:username/all"), async (req: Request, res: Response) => {
    try {
      const allData = await githubService.getAllUserData(req.params.username);
      res.json(allData);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get(formatRoute('/users/:username/repos'), async (req: Request, res: Response) => {
    try {
      const repos = await githubService.getUserRepos(req.params.username, {
        per_page: req.query.per_page ? Number(req.query.per_page) : 30,
        page: req.query.page ? Number(req.query.page) : 1,
        sort: req.query.sort as 'created' | 'updated' | 'pushed' | 'full_name' | undefined,
        direction: req.query.direction as 'asc' | 'desc' | undefined,
      });
      res.json(repos);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get(formatRoute('/repos/:owner/:repo'), async (req: Request, res: Response) => {
    try {
      const repo = await githubService.getRepo(req.params.owner, req.params.repo);
      res.json(repo);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
};
