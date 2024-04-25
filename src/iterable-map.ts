import type { Dict } from './types';
import { Exception } from './errors';
import { isThenable } from './async/promise';
import { jsonSafeStringify } from './safe-json';


export type UpdateCallback<K, T> = (
  | ((event: 'set', key: K, value: T) => void)
  | ((event: 'delete', key: K, value: T, deleted: boolean) => void)
  | ((event: 'clear') => void)
);

export type IterableMapEntries<K, T> = IterableIterator<[K, T]> | Dict<T>;
export type IterableMapValueValidator<T> = (value: T, key: string | number | symbol, index: number, map: Map<any, T>) => boolean;
export type AsyncIterableMapValueValidator<T> = (value: T, key: string | number | symbol, index: number, map: Map<any, T>) => Promise<boolean>;

export class IterableMap<K = string, T = any> {
  readonly #map: Map<K, T>;
  #invalidMessage?: string;
  #onUpdateCallback?: UpdateCallback<K, T>;
  #validator?: IterableMapValueValidator<T> | AsyncIterableMapValueValidator<T>;

  public constructor(
    entries?: IterableMapEntries<K, T> | null,
    mapper?: (value: T, key: K, index: number, map: Map<K, T>) => any // eslint-disable-line comma-dangle
  ) {
    this.#map = new Map<K, T>(entries as any);

    if(!!mapper && typeof mapper === 'function') {
      let i = 0;

      for(const [key, value] of this.#map.entries()) {
        const out = mapper(value, key, i++, this.#map);

        if(isThenable(out)) {
          throw new TypeError('Mapper function cannot return a promise.');
        }

        this.#map.set(key, out);
      }
    }
  }

  protected _setValidator(validator: IterableMapValueValidator<T> | AsyncIterableMapValueValidator<T>, message?: string) {
    if(!!message && typeof message === 'string' && message.length > 0) {
      this.#invalidMessage = message;
    }

    if(!validator || typeof validator !== 'function') return;
    this.#validator = validator;
  }

  protected _onUpdateCallback(callback: (event: 'set', key: K, value: T) => void): void;
  protected _onUpdateCallback(callback: (event: 'delete', key: K, value: T, deleted: boolean) => void): void;
  protected _onUpdateCallback(callback: (event: 'clear') => void): void;
  protected _onUpdateCallback(callback: UpdateCallback<K, T>): void {
    this.#onUpdateCallback = callback;
  }

  public async setAsync(key: K, value: T): Promise<this> {
    const isValid = this.#validator ? await this.#validator(value, String(key), this.#map.size, this.#map) : true;

    if(!isValid) {
      throw new Exception(this.#invalidMessage ||
        `Invalid value for key "${String(key)}" in map.`);
    }

    this.#map.set(key, value);
    (this.#onUpdateCallback as any)?.('set', key, value);

    return this;
  }

  public set(key: K, value: T): this {
    const isValid = this.#validator ? this.#validator(value, String(key), this.#map.size, this.#map) : true;

    if(isThenable(isValid)) {
      throw new TypeError('Validator function cannot return a promsie in synchronous `set` operation.');
    }

    if(!isValid) {
      throw new Exception(this.#invalidMessage ||
        `Invalid value for key "${String(key)}" in map.`);
    }

    this.#map.set(key, value);
    (this.#onUpdateCallback as any)?.('set', key, value);

    return this;
  }

  public get(key: K): T | undefined {
    return this.#map.get(key);
  }

  public delete(key: K): boolean {
    const v = this.#map.get(key);
    if(!v) return false;

    const del = this.#map.delete(key);
    (this.#onUpdateCallback as any)?.('delete', key, v, del);

    return del;
  }

  public clear(): void {
    (this.#onUpdateCallback as any)?.('clear');
    this.#map.clear();
  }

  public contains(key: K): boolean {
    return this.#map.has(key);
  }

  public keys(): IterableIterator<K> {
    return this.#map.keys();
  }

  public values(): IterableIterator<T> {
    return this.#map.values();
  }

  public entries(): IterableIterator<[K, T]> {
    return this.#map.entries();
  }

  public forEach(callback: (value: T, key: K, map: Map<K, T>) => void): void {
    this.#map.forEach(callback);
  }

  public [Symbol.iterator](): IterableIterator<[K, T]> {
    return this.#map.entries();
  }

  public *reverseIterator(): IterableIterator<[K, T]> {
    const keys = Array.from(this.#map.keys()).reverse();

    for(const key of keys) {
      yield [key, this.#map.get(key)!];
    }
  }

  public size(): number {
    return this.#map.size;
  }

  public get length(): number {
    return this.#map.size;
  }

  public get isEmpty(): boolean {
    return this.#map.size === 0;
  }

  public [Symbol.toStringTag](): string {
    return '[object IterableMap]';
  }

  public dict(): Dict<T> {
    return Object.fromEntries(this.#map.entries()) as Dict<T>;
  }

  public toJSON(): string {
    return jsonSafeStringify(this.dict()) || '{}';
  }
}

export default IterableMap;
