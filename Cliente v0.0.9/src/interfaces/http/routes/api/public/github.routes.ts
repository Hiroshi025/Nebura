// Importa los tipos necesarios de Express
// import { Request, Response } from 'express';

import { Request, Response } from "express";

import { GitHubService } from "@/infrastructure/external/github-service";
import { RateLimitManager } from "@/interfaces/messaging/broker/rateLimit";
import { TRoutesInput } from "@/typings/utils";

// Constantes para paths base y versionado
const BASE_PATH = "/public/github";
const API_VERSION = "/api/v1";

/**
 * Formats the authentication routes with the correct prefix.
 * @param path Specific endpoint path.
 * @returns Formatted full route.
 */
const formatRoute = (path: string): string => `${API_VERSION}${BASE_PATH}${path}`;
export default ({ app }: TRoutesInput) => {
  const githubService = new GitHubService();

  /**
   * Retrieves information about a GitHub user.
   * Method: GET
   * Route: /api/v1/public/github/users/:username
   * Controller: githubService.getUser
   * Description: Returns basic information about a GitHub user.
   */
  app.get(
    formatRoute("/users/:username"),
    RateLimitManager.getInstance().createCustomLimiter({
      max: 10,
      windowMs: 60 * 1000, // 1 minuto
      message: "Too many requests, please try again later.",
    }),
    async (req: Request, res: Response) => {
      const { username } = req.params;
      try {
        const user = await githubService.getUser(username as string);
        res.status(200).json(user);
      } catch (error) {
        res.status(500).json({ error: "Error fetching user" });
      }
    },
  );

  /**
   * Retrieves all available information about a GitHub user.
   * Method: GET
   * Route: /api/v1/public/github/users/:username/all
   * Controller: githubService.getAllUserData
   * Description: Returns all available information about a GitHub user.
   */
  app.get(
    formatRoute("/users/:username/all"),
    RateLimitManager.getInstance().createCustomLimiter({
      max: 10,
      windowMs: 60 * 1000, // 1 minuto
      message: "Too many requests, please try again later.",
    }),
    async (req: Request, res: Response) => {
      try {
        const allData = await githubService.getAllUserData(req.params.username);
        res.json(allData);
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
      }
    },
  );

  /**
   * Retrieves the repositories of a GitHub user.
   * Method: GET
   * Route: /api/v1/public/github/users/:username/repos
   * Controller: githubService.getUserRepos
   * Description: Returns a list of repositories of a GitHub user with pagination and sorting options.
   */
  app.get(
    formatRoute("/users/:username/repos"),
    RateLimitManager.getInstance().createCustomLimiter({
      max: 10,
      windowMs: 60 * 1000, // 1 minuto
      message: "Too many requests, please try again later.",
    }),
    async (req: Request, res: Response) => {
      try {
        const repos = await githubService.getUserRepos(req.params.username, {
          per_page: req.query.per_page ? Number(req.query.per_page) : 30,
          page: req.query.page ? Number(req.query.page) : 1,
          sort: req.query.sort as "created" | "updated" | "pushed" | "full_name" | undefined,
          direction: req.query.direction as "asc" | "desc" | undefined,
        });
        res.json(repos);
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
      }
    },
  );

  /**
   * Retrieves information about a specific repository.
   * Method: GET
   * Route: /api/v1/public/github/repos/:owner/:repo
   * Controller: githubService.getRepo
   * Description: Returns detailed information about a specific repository.
   */
  app.get(
    formatRoute("/repos/:owner/:repo"),
    RateLimitManager.getInstance().createCustomLimiter({
      max: 10,
      windowMs: 60 * 1000, // 1 minuto
      message: "Too many requests, please try again later.",
    }),
    async (req: Request, res: Response) => {
      try {
        const repo = await githubService.getRepo(req.params.owner, req.params.repo);
        res.json(repo);
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
      }
    },
  );
};
