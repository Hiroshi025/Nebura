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