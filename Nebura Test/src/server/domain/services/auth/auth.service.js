"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const main_1 = require("../../../../main");
const token_1 = require("../../../../server/shared/utils/token");
const console_1 = require("../../../../shared/utils/functions/console");
const user_const_1 = require("../../../../structure/constants/user.const");
const client_1 = require("@prisma/client");
class AuthService {
    /**
     * Obtiene un usuario por su ID
     * @param id - ID del usuario
     * @returns Promise<UserResponse | ErrorResponse>
     */
    async getAuth(id) {
        try {
            const user = await main_1.main.prisma.userAPI.findUnique({
                where: { id },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            if (!user) {
                return { error: "USER_NOT_FOUND", message: "User not found" };
            }
            return user;
        }
        catch (error) {
            (0, console_1.logWithLabel)("error", "The user not found");
            return { error: "INTERNAL_SERVER_ERROR", message: "An error occurred while fetching user" };
        }
    }
    /**
     * Crea un nuevo usuario
     * @param body - Datos del usuario
     * @returns Promise<UserResponse | ErrorResponse>
     */
    async createAuth(body) {
        try {
            const { email, password, name } = body;
            // Validar campos requeridos
            if (!email || !password || !name) {
                return { error: "MISSING_DATA", message: "Required fields are missing" };
            }
            // Validar estructura de datos
            const validation = user_const_1.AuthRegister.safeParse(body);
            if (!validation.success) {
                return {
                    error: "VALIDATION_ERROR",
                    message: "Invalid data format",
                    details: validation.error.errors,
                };
            }
            // Verificar si el usuario ya existe
            const existingUser = await main_1.main.prisma.userAPI.findUnique({ where: { email } });
            if (existingUser) {
                return { error: "USER_EXISTS", message: "User with this email already exists" };
            }
            // Encriptar contraseña
            const passwordHash = await (0, token_1.encrypt)(password);
            if (!passwordHash) {
                return { error: "ENCRYPTION_ERROR", message: "Failed to encrypt password" };
            }
            // Crear usuario
            const newUser = await main_1.main.prisma.userAPI.create({
                data: {
                    email,
                    password: passwordHash,
                    name,
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    createdAt: true,
                },
            });
            return { user: newUser };
        }
        catch (error) {
            (0, console_1.logWithLabel)("error", "Failed to create user");
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                return {
                    error: "DATABASE_ERROR",
                    message: "Database operation failed",
                    details: error.meta,
                };
            }
            return { error: "INTERNAL_SERVER_ERROR", message: "Failed to create user" };
        }
    }
    /**
     * Autentica un usuario
     * @param credentials - Credenciales de login
     * @returns Promise<{token: string, user: User} | ErrorResponse>
     */
    async login(credentials) {
        try {
            const { email, password } = credentials;
            // Validar campos requeridos
            if (!email || !password) {
                return { error: "MISSING_DATA", message: "Email and password are required" };
            }
            // Validar estructura de datos
            const validation = user_const_1.AuthLogin.safeParse({ email, password });
            if (!validation.success) {
                return {
                    error: "VALIDATION_ERROR",
                    message: "Invalid credentials format",
                    details: validation.error.errors,
                };
            }
            // Buscar usuario
            const user = await main_1.main.prisma.userAPI.findUnique({ where: { email } });
            if (!user) {
                return { error: "INVALID_CREDENTIALS", message: "Invalid email or password" };
            }
            // Verificar contraseña
            const isPasswordValid = await (0, token_1.verified)(password, user.password);
            if (!isPasswordValid) {
                return { error: "INVALID_CREDENTIALS", message: "Invalid email or password" };
            }
            // Generar token JWT
            const token = (0, token_1.signToken)(user.id);
            // Eliminar contraseña del objeto usuario
            const { password: _, ...userWithoutPassword } = user;
            return { token, user: userWithoutPassword };
        }
        catch (error) {
            console.error("Error in login:", error);
            return { error: "INTERNAL_SERVER_ERROR", message: "Failed to authenticate user" };
        }
    }
}
exports.AuthService = AuthService;
