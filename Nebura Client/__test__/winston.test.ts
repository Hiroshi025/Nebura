import fs from "fs";
import winston from "winston";

import { WinstonLogger } from "../src/shared/class/winston";

// src/shared/class/winston.test.ts

jest.mock("fs");
jest.mock("winston", () => {
  const actual = jest.requireActual("winston");
  return {
    ...actual,
    createLogger: jest.fn(),
    addColors: jest.fn(),
    format: {
      combine: jest.fn((...args) => args),
      timestamp: jest.fn(() => (input: any) => input),
      colorize: jest.fn(() => (input: any) => input),
      printf: jest.fn((fn) => fn),
      json: jest.fn(() => (input: any) => input), // <-- Añadir este mock
    },
    transports: {
      DailyRotateFile: jest.fn(function () {
        return {};
      }),
    },
  };
});
jest.mock("winston-daily-rotate-file", () => jest.fn());

const mockLogger = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  log: jest.fn(),
};

(winston.createLogger as jest.Mock).mockImplementation(() => mockLogger);
(winston.addColors as jest.Mock).mockImplementation(() => {});

describe("WinstonLogger", () => {
  const logDir = "/tmp/test-logs";
  const oldEnv = process.env.WINSTON_LOG_DIR;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.values(mockLogger).forEach((fn) => (fn as jest.Mock).mockClear());
    (fs.existsSync as jest.Mock).mockImplementation((p) => p === logDir);
    (fs.mkdirSync as jest.Mock).mockImplementation(() => {});
    (fs.readdirSync as jest.Mock).mockImplementation(() => []);
    process.env.WINSTON_LOG_DIR = logDir;
  });

  afterAll(() => {
    process.env.WINSTON_LOG_DIR = oldEnv;
  });

  it("should read and parse log content", async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue('{"a":1}\n{"b":2}\n');
    const logger = new WinstonLogger();
    const content = await logger.getLogContent("app-2024-06-01.log");
    expect(content).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it("should prepare logs and stats for API", () => {
    const logger = new WinstonLogger();
    jest.spyOn(logger, "getRecentLogs").mockReturnValue([
      {
        filename: "app-2024-06-01.log",
        path: "/tmp/app-2024-06-01.log",
        lastModified: "2024-06-01T12:00:00.000Z",
        size: "2.00 KB",
      },
      {
        filename: "app-2024-05-31.log",
        path: "/tmp/app-2024-05-31.log",
        lastModified: "2024-05-31T12:00:00.000Z",
        size: "1.00 KB",
      },
    ]);
    const result = logger.prepareForAPI(2);
    expect(result.logs.length).toBe(2);
    expect(result.stats.total).toBe(2);
    expect(result.stats.totalSize).toMatch(/KB/);
    expect(result.stats.oldest).toBe("2024-05-31T12:00:00.000Z");
    expect(result.stats.newest).toBe("2024-06-01T12:00:00.000Z");
  });
});
