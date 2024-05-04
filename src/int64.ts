export class Int64 {
  readonly #value: bigint;

  public constructor(value: string | number | bigint) {
    // Clamp the value to fit within 64-bit signed range
    const min64 = BigInt('-9223372036854775808'); // -2^63
    const max64 = BigInt('9223372036854775807'); // 2^63 - 1

    let t: bigint;

    if(typeof value === 'bigint') {
      t = value;
    } else if(['string', 'number'].includes(typeof value)) {
      t = BigInt(value);
    } else {
      throw new TypeError('Invalid type for Int64 constructor');
    }

    if(t < min64) {
      this.#value = min64;
    } else if(t > max64) {
      this.#value = max64;
    } else {
      this.#value = t;
    }
  }

  /** Get the value of the number as a 64-bit integer. */
  public get value(): bigint {
    return this.#value;
  }

  /**
   * Convert the number to a unsigned 64-bit integer.
   * 
   * @returns { bigint } The unsigned 64-bit integer.
   * @example
   * 
   * ```typescript
   * const i = new Int64(-1);
   * console.log(i.asUnsigned()); // 18446744073709551615n
   * ```
   */
  public asUnsigned(): bigint {
    return this.value & 0xFFFFFFFFFFFFFFFFn; // Mask for unsigned representation
  }

  /**
   * Convert the number to a signed 64-bit integer.
   * 
   * @returns { bigint } The signed 64-bit integer.
   * @example
   * 
   * ```typescript
   * const i = new Int64(-1);
   * console.log(i.asSigned()); // -1n
   * ```
   */
  public asSigned(): bigint {
    return this.value;
  }
}

export default Int64;
