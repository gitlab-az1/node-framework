export * from './http';
export * from './string';

export const version = '1.0.1';


declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Process {
      type?: string;
    }
  }
}


export function isBrowser(): boolean {
  // Check if the current environment is Node.js
  if(typeof process !== 'undefined' && process?.versions?.node) return false;

  // Check if the current environment is a browser
  if(typeof window !== 'undefined'
    && typeof window === 'object' &&
    !!window.document) return true;

  // Check for other browser-like environments (e.g., Electron renderer process)
  if(typeof process !== 'undefined' && typeof process?.type === 'string' && process?.type === 'renderer') return true;

  // Add additional checks for specific browser-like environments if needed

  // Assume Node.js environment if not running in a browser-like environment
  return false;
}


const kindOf = (cache => (thing: any) => {
  const str = Object.prototype.toString.call(thing);
  return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
})(Object.create(null));


/**
 * Determine if a value is a plain Object
 *
 * @param {*} val The value to test
 *
 * @returns {boolean} True if value is a plain Object, otherwise false
 */
export function isPlainObject(val: any): boolean {
  if(Array.isArray(val)) return false;
  if(kindOf(val) !== 'object' || typeof val !== 'object') return false;

  const prototype = Object.getPrototypeOf(val);
  return (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(Symbol.toStringTag in val) && !(Symbol.iterator in val);
}


export function isIterableIterator<T>(value: any): value is IterableIterator<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value[Symbol.iterator] === 'function' &&
    typeof value.next === 'function'
  );
}


/**
 * Resolve object with deep prototype chain to a flat object
 * 
 * @param {Object} sourceObj source object
 * @param {Object} [destObj]
 * @param {Function|Boolean} [filter]
 * @param {Function} [propFilter]
 *
 * @returns {Object}
 */
export function toFlatObject(sourceObj: Record<any, any>, destObj: Record<any, any>, filter?: (src: object, dest: object) => boolean | boolean, propFilter?: (prop: string, src: object, dest: object) => boolean): Record<any, any> {
  let props;
  let i;
  let prop;
  const merged: Record<any, any> = {};

  destObj = destObj || {};
  if(sourceObj == null) return destObj;

  do {
    props = Object.getOwnPropertyNames(sourceObj);
    i = props.length;

    while (i-- > 0) {
      prop = props[i];

      if((!propFilter || propFilter(prop, sourceObj, destObj)) && !merged[prop]) {
        destObj[prop] = sourceObj[prop];
        merged[prop] = true;
      }
    }

    sourceObj = (filter as unknown as any) !== false && Object.getPrototypeOf(sourceObj);
  } while (sourceObj && (!filter || filter(sourceObj, destObj)) && sourceObj !== Object.prototype);

  return destObj;
}


/**
 * Check if the specified value is a typed array
 * 
 * @param value 
 * @returns 
 */
export function isTypedArray(value: any): value is NodeJS.TypedArray {
  const typedArrayConstructors = [
    Uint8Array,
    Uint8ClampedArray,
    Uint16Array,
    Uint32Array,
    Int8Array,
    Int16Array,
    Int32Array,
    BigUint64Array,
    BigInt64Array,
    Float32Array,
    Float64Array,
  ];

  let result: boolean = false;

  for (let i = 0; i < typedArrayConstructors.length; i++) {
    if (value instanceof typedArrayConstructors[i]) {
      result = true;
      break;
    }
  }

  return result;
}


/**
 * Check if two values are deeply equal
 * 
 * @param a 
 * @param b 
 * @returns 
 */
export function areDeeplyEqual(a: any, b: any): boolean {
  if (a === b) return true;

  if (
    typeof a !== 'object' || typeof b !== 'object'
    || Array.isArray(a) !== Array.isArray(b)
    || Object.keys(a).length !== Object.keys(b).length
  ) return false;

  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && JSON.stringify(a) === JSON.stringify(b);

  let result = true;

  for (const key of Object.keys(a)) {
    if (!areDeeplyEqual(a[key], b[key])) {
      result = false;
      break;
    }
  }

  return result;
}


/**
 * Joins an array of strings with a separator
 * 
 * @param {any[]} arr Some array
 * @param {string} [separator=' | '] The separator to use
 * @returns {string} The joined string
 */
export function join<T extends any[]>(arr: T, separator: string = ' | '): string {
  return arr.map(item => {
    if(typeof item === 'string') return `'${item}'`;
    return item;
  }).join(separator);
}

/**
 * Returns a function that can only be called once
 * 
 * @param fn The function to wrap 
 * @returns The wrapped function
 */
export function once<T>(fn: (...args: any[]) => T): (...args: any[]) => T {
  let called = false;
  let result: T;

  return (...args: any[]) => {
    if(called) return result;

    called = true;
    return (result = fn(...args));
  };
}


/**
 * Maps an object to a new object
 * 
 * @param {object} obj The object to map 
 * @param {Function} mapper The mapper function 
 * @returns {object} The mapped object
 */
export function map<T extends Record<string | number | symbol, any>, V, K extends string | number | symbol>(obj: Record<K, V>, mapper: ((key: K, value: V) => any)): T {
  return Object.entries(obj).reduce((accumulator, [key, value]) => {
    return {
      ...accumulator,
      [key]: mapper(key as K, value as V),
    };
  }, {} as T);
}


/**
 * Removes duplicate values from an array
 * 
 * @param {any[]} arr The array to remove duplicates from 
 * @returns {any[]} The array without duplicates
 */
export function uniq<T extends unknown[]>(arr: T): T {
  return [...new Set(arr)] as T;
}
