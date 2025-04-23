export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

export class ProyectError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProyectError";
  }
}

export class PrismaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PrismaError";
  }
}

export class DiscordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DiscordError";
  }
}