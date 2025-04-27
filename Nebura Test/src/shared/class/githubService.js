"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubService = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * A service class for interacting with the GitHub API.
 * Provides methods to fetch user data, repositories, events, organizations, followers, and more.
 */
class GitHubService {
    api;
    token;
    /**
     * Creates an instance of GitHubService.
     * @param token Optional GitHub personal access token for authenticated requests.
     */
    constructor(token) {
        this.token = token || process.env.GITHUB_TOKEN || null;
        this.api = axios_1.default.create({
            baseURL: "https://api.github.com",
            headers: {
                Accept: "application/vnd.github.v3+json",
                Authorization: this.token ? `token ${this.token}` : "",
            },
        });
    }
    /**
     * Fetches basic information about a GitHub user.
     * @param username The GitHub username.
     * @returns A promise that resolves to a `GitHubUser` object containing user details.
     * @throws An error if the request fails.
     */
    async getUser(username) {
        try {
            const response = await this.api.get(`/users/${username}`);
            return response.data;
        }
        catch (error) {
            throw new Error(`Error fetching user ${username}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Fetches the public repositories of a GitHub user.
     * @param username The GitHub username.
     * @param options Optional parameters for pagination and sorting.
     * @returns A promise that resolves to an array of `GitHubRepo` objects.
     * @throws An error if the request fails.
     */
    async getUserRepos(username, options) {
        try {
            const params = new URLSearchParams();
            if (options?.per_page)
                params.append("per_page", options.per_page.toString());
            if (options?.page)
                params.append("page", options.page.toString());
            if (options?.sort)
                params.append("sort", options.sort);
            if (options?.direction)
                params.append("direction", options.direction);
            const response = await this.api.get(`/users/${username}/repos?${params.toString()}`);
            return response.data;
        }
        catch (error) {
            throw new Error(`Error fetching repos for ${username}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Fetches the public events of a GitHub user.
     * @param username The GitHub username.
     * @returns A promise that resolves to an array of `GitHubEvent` objects.
     * @throws An error if the request fails.
     */
    async getUserEvents(username) {
        try {
            const response = await this.api.get(`/users/${username}/events`);
            return response.data;
        }
        catch (error) {
            throw new Error(`Error fetching events for ${username}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Fetches the organizations a GitHub user belongs to.
     * @param username The GitHub username.
     * @returns A promise that resolves to an array of `GitHubOrganization` objects.
     * @throws An error if the request fails.
     */
    async getUserOrganizations(username) {
        try {
            const response = await this.api.get(`/users/${username}/orgs`);
            return response.data;
        }
        catch (error) {
            throw new Error(`Error fetching organizations for ${username}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Fetches the followers of a GitHub user.
     * @param username The GitHub username.
     * @returns A promise that resolves to an array of `GitHubFollower` objects.
     * @throws An error if the request fails.
     */
    async getUserFollowers(username) {
        try {
            const response = await this.api.get(`/users/${username}/followers`);
            return response.data;
        }
        catch (error) {
            throw new Error(`Error fetching followers for ${username}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Fetches the users followed by a GitHub user.
     * @param username The GitHub username.
     * @returns A promise that resolves to an array of `GitHubFollower` objects.
     * @throws An error if the request fails.
     */
    async getUserFollowing(username) {
        try {
            const response = await this.api.get(`/users/${username}/following`);
            return response.data;
        }
        catch (error) {
            throw new Error(`Error fetching following for ${username}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Fetches the public gists of a GitHub user.
     * @param username The GitHub username.
     * @returns A promise that resolves to an array of `GitHubGist` objects.
     * @throws An error if the request fails.
     */
    async getUserGists(username) {
        try {
            const response = await this.api.get(`/users/${username}/gists`);
            return response.data;
        }
        catch (error) {
            throw new Error(`Error fetching gists for ${username}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Fetches detailed information about a specific GitHub repository.
     * @param owner The owner of the repository.
     * @param repo The name of the repository.
     * @returns A promise that resolves to a `GitHubRepo` object.
     * @throws An error if the request fails.
     */
    async getRepo(owner, repo) {
        try {
            const response = await this.api.get(`/repos/${owner}/${repo}`);
            return response.data;
        }
        catch (error) {
            throw new Error(`Error fetching repo ${owner}/${repo}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Fetches all available data for a GitHub user in a single object.
     * @param username The GitHub username.
     * @returns A promise that resolves to an object containing user data, repositories, events, organizations, followers, following, and gists.
     * @throws An error if any of the requests fail.
     */
    async getAllUserData(username) {
        try {
            const [user, repos, events, organizations, followers, following, gists] = await Promise.all([
                this.getUser(username),
                this.getUserRepos(username),
                this.getUserEvents(username),
                this.getUserOrganizations(username),
                this.getUserFollowers(username),
                this.getUserFollowing(username),
                this.getUserGists(username),
            ]);
            return {
                user,
                repos,
                events,
                organizations,
                followers,
                following,
                gists,
            };
        }
        catch (error) {
            throw new Error(`Error fetching all data for ${username}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
exports.GitHubService = GitHubService;
