import { DomainError } from "../DomainError.js";

export class NumberValidator {
  static finite(value: number, name: string): number {
    if (!Number.isFinite(value)) {
      throw new DomainError(`${name} must be a finite number`);
    }
    return Object.is(value, -0) ? 0 : value;
  }

  static nonNegative(value: number, name: string): number {
    this.finite(value, name);
    if (value < 0) throw new DomainError(`${name} must be non-negative`);
    return Object.is(value, -0) ? 0 : value;
  }

  static positive(value: number, name: string): number {
    this.finite(value, name);
    if (value <= 0) throw new DomainError(`${name} must be positive`);
    return value;
  }

  static parse(value: string, name: string): number {
    if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(value)) {
      throw new DomainError(`${name} must be a finite number`);
    }
    return this.finite(Number(value), name);
  }
}
