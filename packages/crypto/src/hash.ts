import {createHash, randomBytes, type BinaryLike} from 'node:crypto';

import type {CryptoAlgorithm, CryptoEncoding} from './type.js';

/**
 * Represents the configuration for a hash generator.
 */
export interface HashGeneratorConfig {
  /**
   * The prefix to be added to the generated hash.
   */
  prefix: string;

  /**
   * The algorithm used for hashing.
   */
  algorithm: CryptoAlgorithm;

  /**
   * The encoding used for the generated hash.
   */
  encoding: CryptoEncoding;

  /**
   * The length of the CRC (Cyclic Redundancy Check) value.
   */
  crcLength: number;
}

/**
 * Secure **self-validate** hash generator.
 */
export class AlwatrHashGenerator {
  /**
   * Creates a new instance of the AlwatrHashGenerator class.
   * @param config The configuration for the hash generator.
   */
  constructor(public config: HashGeneratorConfig) {}

  /**
   * Generate a random hash.
   * @returns The generated hash.
   * @example
   * ```typescript
   * const clientId = hashGenerator.generateRandom();
   * ```
   */
  generateRandom(): string {
    return this.generate(randomBytes(16));
  }

  /**
   * Generate a **self-validate** random hash.
   * @returns The generated self-validated hash.
   * @example
   * ```typescript
   * const userId = hashGenerator.generateRandomSelfValidate();
   * ```
   */
  generateRandomSelfValidate(): string {
    return this.generateSelfValidate(randomBytes(16));
  }

  /**
   * Generate a hash from data.
   * @param data - The data to generate the hash from.
   * @returns The generated hash.
   * @example
   * ```typescript
   * const crcHash = hashGenerator.generate(data);
   * ```
   */
  generate(data: BinaryLike): string {
    return this.config.prefix + createHash(this.config.algorithm).update(data).digest(this.config.encoding);
  }

  /**
   * Generate a crc hash.
   * @param data - The data to generate the crc hash from.
   * @returns The generated crc hash.
   */
  generateCrc(data: BinaryLike): string {
    const crc = createHash('sha1').update(data).digest(this.config.encoding);
    return this.config.crcLength == null || this.config.crcLength < 1 ? crc : crc.slice(0, this.config.crcLength);
  }

  /**
   * Generate a **self-validate** hash from data.
   * @param data - The data to generate the self-validated hash from.
   * @returns The generated self-validated hash.
   * @example
   * ```typescript
   * const userId = hashGenerator.generateSelfValidate(data);
   * ```
   */
  generateSelfValidate(data: BinaryLike): string {
    const mainHash = this.generate(data);
    const crcHash = this.generateCrc(mainHash);
    return mainHash + crcHash;
  }

  /**
   * Verify if the generated hash matches the provided hash.
   * @param data - The data to verify.
   * @param hash - The hash to compare against.
   * @returns `true` if the hash is verified, `false` otherwise.
   * @example
   * ```typescript
   * if (!hashGenerator.verify(data, hash)) {
   *   new Error('data_corrupted');
   * }
   * ```
   */
  verify(data: BinaryLike, hash: string): boolean {
    return hash === this.generate(data);
  }

  /**
   * Verify a **self-validate** hash to check if it was generated by this class (with the same options).
   * @param hash - The self-validated hash to verify.
   * @returns `true` if the hash is verified, `false` otherwise.
   * @example
   * ```typescript
   * if (!hashGenerator.verifySelfValidate(hash)) {
   *   new Error('invalid_hash');
   * }
   * ```
   */
  verifySelfValidate(hash: string): boolean {
    const gapPos = hash.length - this.config.crcLength;
    const mainHash = hash.slice(0, gapPos);
    const crcHash = hash.slice(gapPos);
    return crcHash === this.generateCrc(mainHash);
  }
}
