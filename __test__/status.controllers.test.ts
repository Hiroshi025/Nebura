import express, { Application } from "express";
import os from "os";
import request from "supertest";

import { PrismaClient } from "@prisma/client";

import {
	StatusController
} from "../src/server/interfaces/http/controllers/public/status.controller";

jest.mock("@prisma/client");
jest.mock("os");

const prismaMock = new PrismaClient() as jest.Mocked<PrismaClient>;
const app: Application = express();
const statusController = new StatusController();

app.get("/status", statusController.getStatus);

describe("StatusController", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("getStatus", () => {
        it("should return operational status with database and system info", async () => {
            // Mock database connection
            prismaMock.$connect.mockResolvedValueOnce(undefined);

            // Mock system info
            jest.spyOn(os, "loadavg").mockReturnValue([0.1, 0.2, 0.3]);
            jest.spyOn(os, "freemem").mockReturnValue(1024 * 1024 * 1024); // 1GB
            jest.spyOn(os, "totalmem").mockReturnValue(4 * 1024 * 1024 * 1024); // 4GB

            const response = await request(app).get("/status");

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                status: "operational",
                database: { status: "healthy" },
                system: {
                    platform: process.platform,
                    arch: process.arch,
                    nodeVersion: process.version,
                },
            });
            expect(prismaMock.$connect).toHaveBeenCalled();
        });

        it("should return error status when database connection fails", async () => {
            // Mock database connection failure
            prismaMock.$connect.mockRejectedValueOnce(new Error("Database connection failed"));

            const response = await request(app).get("/status");

            expect(response.status).toBe(200);
            expect(response.body.database).toMatchObject({
                status: "unhealthy",
                error: "Database connection failed",
            });
            expect(prismaMock.$connect).toHaveBeenCalled();
        });

        it("should handle unexpected errors gracefully", async () => {
            // Mock unexpected error
            jest.spyOn(statusController, "getStatus").mockImplementationOnce(() => {
                throw new Error("Unexpected error");
            });

            const response = await request(app).get("/status");

            expect(response.status).toBe(500);
            expect(response.body).toMatchObject({
                status: "error",
                message: "Failed to retrieve system status",
            });
        });
    });
});