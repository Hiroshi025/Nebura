"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordUpdateEntity = exports.DiscordStatusEntity = void 0;
// src/entities/discord.entity.ts
class DiscordStatusEntity {
    indicator;
    description;
    lastUpdated;
    constructor(indicator, description, lastUpdated) {
        this.indicator = indicator;
        this.description = description;
        this.lastUpdated = lastUpdated;
    }
}
exports.DiscordStatusEntity = DiscordStatusEntity;
class DiscordUpdateEntity {
    title;
    description;
    url;
    date;
    type;
    constructor(title, description, url, date, type) {
        this.title = title;
        this.description = description;
        this.url = url;
        this.date = date;
        this.type = type;
    }
}
exports.DiscordUpdateEntity = DiscordUpdateEntity;
