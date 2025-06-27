"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="834ebb22-649d-5891-8d83-c0224a137489")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositoryError = exports.DiscordError = exports.PrismaError = exports.ProyectError = exports.DomainError = void 0;
class DomainError extends Error {
    constructor(message) {
        super(message);
        this.name = "DomainError";
    }
}
exports.DomainError = DomainError;
class ProyectError extends Error {
    constructor(message) {
        super(message);
        this.name = "ProyectError";
    }
}
exports.ProyectError = ProyectError;
class PrismaError extends Error {
    constructor(message) {
        super(message);
        this.name = "PrismaError";
    }
}
exports.PrismaError = PrismaError;
class DiscordError extends Error {
    constructor(message) {
        super(message);
        this.name = "DiscordError";
    }
}
exports.DiscordError = DiscordError;
class RepositoryError extends Error {
    constructor(message) {
        super(message);
        this.name = "RepositoryError";
    }
}
exports.RepositoryError = RepositoryError;
//# sourceMappingURL=error.extend.js.map
//# debugId=834ebb22-649d-5891-8d83-c0224a137489
