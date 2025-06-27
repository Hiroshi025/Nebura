"use strict";
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="5bcacaee-4d90-528b-a469-6d841f8cffdc")}catch(e){}}();

Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRepository = void 0;
const main_1 = require("../main");
const error_extend_1 = require("../shared/adapters/extends/error.extend");
class AuthRepository {
    constructor() { }
    async createAuth(data, discord) {
        try {
            let dataCreate;
            if (discord) {
                dataCreate = await main_1.main.prisma.userAPI.create({
                    data: {
                        email: data.email,
                        password: data.password,
                        name: data.name,
                        discord: {
                            userId: discord.id,
                            userAvatar: discord.avatar,
                            userName: discord.username ? discord.username : discord.global_name,
                        },
                    },
                });
            }
            else {
                dataCreate = await main_1.main.prisma.userAPI.create({
                    data: {
                        email: data.email,
                        password: data.password,
                        name: data.name,
                    },
                });
            }
            return dataCreate ? dataCreate : false;
        }
        catch (e) {
            throw new error_extend_1.RepositoryError(e instanceof Error ? e.message : "Unknown repository error");
        }
    }
    async findAuthByEmail(email) {
        try {
            const data = await main_1.main.prisma.userAPI.findUnique({
                where: { email },
            });
            return data ? data : false;
        }
        catch (e) {
            throw new error_extend_1.RepositoryError(e instanceof Error ? e.message : "Unknown repository error");
        }
    }
    async findAuthById(id) {
        try {
            const data = await main_1.main.prisma.userAPI.findUnique({
                where: { id },
            });
            return data ? data : false;
        }
        catch (e) {
            throw new error_extend_1.RepositoryError(e instanceof Error ? e.message : "Unknown repository error");
        }
    }
}
exports.AuthRepository = AuthRepository;
//# sourceMappingURL=auth.repositories.js.map
//# debugId=5bcacaee-4d90-528b-a469-6d841f8cffdc
