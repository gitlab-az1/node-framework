import type { Integer32Handler } from '../int32';


export type TypedValue = {
  string: string;
  int32: Integer32Handler;
  int64: never; // change to int64 handler
  float32: never; // change to float32 handler
  float64: never; // change to float64 handler
  bool: boolean;
  bytes: Uint8Array;
  auto: any;
  any: any;
  null: null;
};

export type SchemaValue = {
  type: 'string' | 'bool' | 'bytes' | 'auto' | 'any' | 'null';
  kind: 'required' | 'optional';
  default?: any;
} | {
  type: 'array';
  kind: 'required' | 'optional';
  default?: any;
  items: SchemaValue;
} | {
  type: 'map';
  kind: 'required' | 'optional';
  default?: any;
  keyType: 'string' | 'int32' | 'int64';
  valueType: SchemaValue;
} | {
  type: 'enum';
  kind: 'required' | 'optional';
  default?: any;
  symbols: string[];
} | {
  type: 'union';
  kind: 'required' | 'optional';
  default?: any;
  schemas: Schema<Record<string, SchemaValue>, keyof Record<string, SchemaValue>>[];
} | {
  type: 'int32' | 'int64' | 'float32' | 'float64';
  kind: 'required' | 'optional';
  default?: any;
  signed: boolean;
};

export type Key<K> = {
  key: K;
  position: number;
};


export class Schema<T extends Record<string, SchemaValue>, K extends keyof T> {
  public constructor(private readonly _schema: T) { }

  public keys(): K[] {
    return Object.keys(this._schema).sort((a, b) => {
      return a.toLowerCase().localeCompare(b.toLowerCase());
    }) as K[];
  }

  public orderedKeys(): Key<K>[] {
    const k = this.keys();
    const o = [] as Key<K>[];

    for(let i = 0; i < k.length; i++) {
      o.push({
        key: k[i],
        position: i,
      });
    }

    return o;
  }

  public *[Symbol.iterator](): IterableIterator<Key<K>> {
    for(const key of this.orderedKeys()) {
      yield key;
    }
  }
}

export default Schema;
