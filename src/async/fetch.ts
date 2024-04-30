import { Exception } from '../errors';
import { Disposable, IDisposable } from '../disposable';
import { jsonSafeParser, jsonSafeStringify } from '../safe-json';
import { isBrowser, isIterableIterator, isPlainObject, version } from '../utils';
import type { Dict, HttpMethod, MaybePromise, HttpHeaders as HeadersType } from '../types';
import { Headers as HttpHeaders, StatusCode, httpStatusExplanation, statusCodeToString } from '../utils/http';



const USER_AGENT = `node-framework/${version}${isBrowser() ? '' : ` (Node.JS ${process.version})`}`;


export interface AbstractResponse {
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly headers: HttpHeaders;
  readonly responseTime: number;
  readonly statusExplanation: string;

  clone(): AbstractResponse;
  arrayBuffer(): MaybePromise<ArrayBuffer>;
  blob(): MaybePromise<Blob>;
  text(): MaybePromise<string>;
  json<T = any>(): MaybePromise<T>;
  stream(): MaybePromise<ReadableStream<Uint8Array>>;
}


export class BodyParser {
  readonly #buffer?: ArrayBuffer;
  readonly #hasBody: boolean;
  #bodyUsed: boolean = false;

  public constructor(body?: ArrayBuffer | null,
    private readonly _contentType?: string | null) {
    if(!!body && !(body instanceof ArrayBuffer)) {
      throw new TypeError(`Unsupported body type for BodyParser: ${typeof body}`);
    }

    this.#hasBody = !!body;
    this.#buffer = body ?? undefined;
  }

  public get contentType(): string | null {
    return this._contentType ?? null;
  }

  public json<T = any>(): T {
    if(this.#bodyUsed) {
      throw new Exception('Cannot parse body twice.');
    }

    let text = '';

    if(!this.#hasBody || !this.#buffer) {
      text = JSON.stringify('"[empty]"');
    } else {
      text = this.text();
    }

    const parsed = jsonSafeParser<T>(text);
    this.#bodyUsed = true;

    if(parsed.isLeft()) {
      throw parsed.value;
    }

    return parsed.value;
  }

  public blob(): Blob {
    if(!this.#hasBody || !this.#buffer) {
      throw new Exception('Cannot parse an empty response body to blob');
    }

    if(this.#bodyUsed) {
      throw new Exception('Cannot parse body twice.');
    }

    this.#bodyUsed = true;
    return new Blob([this.#buffer]);
  }

  public arrayBuffer(): ArrayBuffer {
    if(!this.#hasBody || !this.#buffer) {
      throw new Exception('Cannot parse an empty response body to array buffer');
    }

    if(this.#bodyUsed) {
      throw new Exception('Cannot parse body twice.');
    }

    this.#bodyUsed = true;
    return this.#buffer.slice(0);
  }

  public text(): string {
    return this.#extractText();
  }

  public stream(options?: { chunkSize?: number }): ReadableStream<Uint8Array> {
    return this.#createStream(options);
  }

  #createStream({ chunkSize = 4096 }: { chunkSize?: number } = {}) {
    if(!this.#hasBody || !this.#buffer) {
      throw new Exception('Cannot parse an empty response body to readable stream');
    }

    if(this.#bodyUsed) {
      throw new Exception('Cannot parse body twice.');
    }

    const uint8Array = new Uint8Array(this.#buffer);

    const readableStream = new ReadableStream<Uint8Array>({
      start: (controller: ReadableStreamDefaultController<Uint8Array>) => {
        if(chunkSize || chunkSize < 1 || chunkSize > uint8Array.length) {
          controller.enqueue(uint8Array);
        } else {
          for(let i = 0; i < uint8Array.length; i += chunkSize) {
            controller.enqueue(uint8Array.subarray(i, i + chunkSize));
          }
        }

        controller.close();
      },
    });

    this.#bodyUsed = true;
    return readableStream;
  }

  #extractText() {
    if(!this.#hasBody || !this.#buffer) return (() => {
      this.#bodyUsed = true;
      return '[empty]';
    })();
    
    if(this.#bodyUsed) {
      throw new Exception('Cannot parse body twice.');
    }

    this.#bodyUsed = true;

    const decoder = new TextDecoder();
    return decoder.decode(new DataView(this.#buffer));
  }
}


export type HttpResponseProps = {
  responseTime?: number;
}

export class HttpResponse extends BodyParser implements AbstractResponse {
  readonly #body: ArrayBuffer | null;

  public readonly ok: boolean;
  public readonly headers: HttpHeaders;
  public readonly responseTime: number;
  public readonly statusText: string;
  public readonly statusExplanation: string;

  public constructor(
    body: ArrayBuffer | null,
    public readonly status: number,
    headers?: Dict<string | string[]> | IterableIterator<[string, string | string[]]>,
    props?: HttpResponseProps // eslint-disable-line comma-dangle
  ) {
    const h: Dict<string | string[]> = {};

    if(!!headers && isIterableIterator(headers)) {
      for(const [key, value] of headers) {
        h[key] = value;
      }
    } else if(typeof headers === 'object' && isPlainObject(headers)) {
      Object.assign(h, headers);
    }

    super(body?.slice(0), typeof h['content-type'] === 'string' ? h['content-type'] : null);
    this.#body = body;

    this.headers = new HttpHeaders();
    this.ok = (2 === ((status / 100) | 0));

    if(typeof headers === 'object' && isPlainObject(headers)) {
      for(const [key, value] of Object.entries(headers)) {
        this.headers.set(key, value);
      }
    } else if(!!headers && isIterableIterator(headers)) {
      for(const [key, value] of headers) {
        this.headers.set(key, value);
      }
    }

    this.responseTime = props?.responseTime && typeof props?.responseTime === 'number' ?
      props.responseTime : -1;

    this.statusText = statusCodeToString(status);
    this.statusExplanation = httpStatusExplanation(status);
  }

  public clone(): HttpResponse {
    return new HttpResponse(this.#body,
      this.status,
      this.headers.entries() as IterableIterator<[string, string]>, {
        responseTime: this.responseTime,
      });
  }
}


export type FetchInit = {
  body?: XMLHttpRequestBodyInit | ReadableStream | Record<string | number, any> | null;
  headers?: HeadersType | HttpHeaders | Headers | (readonly [string, string])[];
  cache?: RequestCache;
  keepalive?: boolean;
  method?: HttpMethod;
  mode?: RequestMode;
  priority?: RequestPriority;
  redirect?: RequestRedirect;
  referrer?: string;
  signal?: AbortSignal | null;
  timeout?: number;
  credentials?: RequestCredentials;
  userAgent?: string;
}

export async function $fetch(
  url: string | URL,
  options?: FetchInit // eslint-disable-line comma-dangle
): Promise<HttpResponse> {
  let headers = new HttpHeaders();

  if(options?.headers instanceof Headers) {
    for(const [key, value] of options.headers.entries()) {
      headers.set(key, value);
    }
  } else if(options?.headers instanceof HttpHeaders) {
    headers = headers.contact(options.headers);
  } else if(typeof options?.headers === 'object' && isPlainObject(options.headers)) {
    for(const [key, value] of Object.entries(options.headers)) {
      headers.set(key, value);
    }
  } else if(!!options?.headers && Array.isArray(options.headers)) {
    for(const [key, value] of options.headers) {
      headers.set(key, value);
    }
  }

  if(options?.body && typeof options.body === 'object' && isPlainObject(options.body)) {
    options.body = jsonSafeStringify(options.body) || '{}';

    headers.set('Content-Type', 'application/json; charset=utf-8');
    headers.set('Content-Length', (typeof Buffer !== 'undefined' ? Buffer.byteLength(options.body) : options.body.length).toString());
  }

  headers.set('User-Agent', options?.userAgent || USER_AGENT);
  const t = !!options && typeof options.timeout === 'number' && options.timeout > 1 ? options.timeout : -1;

  if(t > 0 && options?.signal instanceof AbortSignal) {
    throw new Error('Cannot use both timeout and abort signal in fetch options');
  }

  if(t < 1) return new Promise<HttpResponse>((resolve, reject) => {
    const s = Date.now();

    fetch(url, {
      body: options?.body as any,
      cache: options?.cache,
      credentials: options?.credentials,
      headers: Object.fromEntries([...headers.entries()].map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : v])),
      keepalive: options?.keepalive,
      method: options?.method,
      mode: options?.mode,
      priority: options?.priority,
      redirect: options?.redirect,
      referrer: options?.referrer,
      signal: options?.signal,
    }).then(async rawResponse => {
      try {
        const buf = await rawResponse.arrayBuffer();
        const rh = {} as Dict<string>;

        for(const [key, value] of rawResponse.headers.entries()) {
          rh[key] = value;
        }

        const res = new HttpResponse(buf,
          rawResponse.status,
          rh,
          { responseTime: Date.now() - s });

        resolve(res);
      } catch (err: any) {
        reject(err);
      }
    }).catch(reject);
  });

  const ac = new AbortController();

  return Promise.race<HttpResponse>([
    new Promise<HttpResponse>((resolve, reject) => {
      const s = Date.now();
  
      fetch(url, {
        body: options?.body as any,
        cache: options?.cache,
        credentials: options?.credentials,
        headers: Object.fromEntries([...headers.entries()].map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : v])),
        keepalive: options?.keepalive,
        method: options?.method,
        mode: options?.mode,
        priority: options?.priority,
        redirect: options?.redirect,
        referrer: options?.referrer,
        signal: ac.signal,
      }).then(async rawResponse => {
        try {
          const buf = await rawResponse.arrayBuffer();
  
          const res = new HttpResponse(buf,
            rawResponse.status,
            rawResponse.headers.entries(),
            { responseTime: Date.now() - s });
  
          resolve(res);
        } catch (err: any) {
          reject(err);
        }
      }).catch(reject);
    }),
    new Promise((_, reject) => {
      setTimeout(() => {
        const e = new Exception(`Request timeout for '${url.toString()}' in ${t}ms.`, {
          status: StatusCode.RequestTimeout,
          statusCode: StatusCode.RequestTimeout,
        });

        ac.abort(e);
        reject(e);
      }, t);
    }),
  ]);
}


export class CancelableFetch extends AbortController implements IDisposable {
  #isDisposed: boolean = false;
  readonly #url: string | URL;
  readonly #options?: FetchInit;

  public constructor(url: string | URL, options?: FetchInit) {
    super();

    super.signal.onabort = () => {
      this.#isDisposed = true;
    };

    this.#url = url;
    this.#options = options;
  }

  public dispose(): void {
    if(this.#isDisposed) return;

    this.abort();
    this.#isDisposed = true;
  }

  public async fetch(): Promise<HttpResponse> {
    try {
      return (await this.#createPromise());
    } finally {
      this.dispose();
    }
  }

  #createPromise(): Promise<HttpResponse> {
    if(this.#isDisposed) {
      throw new Exception('This fetch instance has been disposed.');
    }

    const t = !!this.#options && typeof this.#options.timeout === 'number' && this.#options.timeout > 1 ?
      this.#options.timeout : -1;

    delete this.#options?.timeout;
    delete this.#options?.signal;

    if(t < 1) return $fetch(this.#url, Object.assign({}, this.#options, { signal: this.signal }));

    return Promise.race<HttpResponse>([
      $fetch(this.#url, Object.assign({}, this.#options, { signal: this.signal })),
      new Promise((_, reject) => {
        setTimeout(() => {
          const e = new Exception(`Request timeout for '${this.#url.toString()}' in ${t}ms.`, {
            status: StatusCode.RequestTimeout,
            statusCode: StatusCode.RequestTimeout,
          });
    
          this.abort(e);
          this.dispose();
          reject(e);
        }, t);
      }),
    ]);
  }
}

export class FetchMap<K extends string | number | symbol> extends Disposable {
  readonly #map: Map<K, CancelableFetch> = new Map();

  public set(key: K, url: string | URL, options?: FetchInit): void {
    const o = new CancelableFetch(url, options);

    this.#map.set(key, o);
    super._register(o);
  }

  public get(key: K): CancelableFetch | undefined {
    return this.#map.get(key);
  }

  public contains(key: K): boolean {
    return this.#map.has(key);
  }

  public delete(key: K): void {
    const o = this.#map.get(key);
    
    if(o) {
      o.dispose();
      this.#map.delete(key);
    }
  }

  public clear(): void {
    super.clear();
    this.empty();
  }

  public empty(): void {
    for(const o of this.#map.values()) {
      o.dispose();
    }
    
    this.#map.clear();
  }

  public override dispose(): void {
    super.dispose();
    this.empty();
  }

  public async fetch(key: K): Promise<HttpResponse> {
    const o = this.#map.get(key);
    
    if(!o) {
      throw new Exception(`No fetch instance found for key '${key.toString()}'`);
    }
    
    try {
      return (await o.fetch());
    } finally {
      this.delete(key);
    }
  }
}
