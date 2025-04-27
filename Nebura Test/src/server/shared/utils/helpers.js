"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isErrorResponse = isErrorResponse;
exports.normalizeError = normalizeError;
exports.sendErrorResponse = sendErrorResponse;
exports.sendSuccessResponse = sendSuccessResponse;
// Métodos helper
function isErrorResponse(response) {
    return response.error !== undefined || typeof response === "string";
}
function normalizeError(error) {
    if (typeof error === "string")
        return [error];
    if (Array.isArray(error)) {
        return error.map((e) => (typeof e === "string" ? e : e.message));
    }
    if (typeof error === "object" && error !== null && "errors" in error) {
        const errObj = error;
        if (typeof errObj.errors === "string")
            return [errObj.errors];
        if (Array.isArray(errObj.errors)) {
            return errObj.errors.map((e) => (typeof e === "string" ? e : e.message));
        }
    }
    return ["Unknown error occurred"];
}
function sendErrorResponse(res, status, errors) {
    return res.status(status).json({
        errors,
        data: null,
    });
}
function sendSuccessResponse(res, status, data) {
    return res.status(status).json({
        data,
        errors: [],
    });
}
