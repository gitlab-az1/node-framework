import type { MaybePromise } from './types';


export interface IDisposable {
  dispose(): void;
}

export interface IAsyncDisposable {
  dispose(): Promise<void>;
}

export function toDisposable(dispose: () => void): IDisposable {
  return { dispose };
}

export function toAsyncDisposable(dispose: () => Promise<void>): IAsyncDisposable {
  return { dispose };
}


export class Disposable implements IDisposable {
  public static readonly None: IDisposable = Object.freeze<IDisposable>({ dispose() {} });
  private readonly _lifecycle: Set<IDisposable> = new Set();
  private _isDisposed: boolean = false;

  public dispose(): void {
    if(this._isDisposed) return;

    this._isDisposed = true;
    this.clear();
  }
    
  protected clear() {
    this._lifecycle.forEach(item => item.dispose());
    this._lifecycle.clear();
  }

  protected _register<T extends IDisposable>(t: T): T {
    if(this._isDisposed) {
      console.warn('[Disposable] Registering disposable on object that has already been disposed.');
      t.dispose();
    } else {
      this._lifecycle.add(t);
    }

    return t;
  }
}

export class AsyncDisposable implements IAsyncDisposable {
  public static readonly None: IAsyncDisposable = Object.freeze<IAsyncDisposable>({ dispose: () => Promise.resolve(void 0) });
  private readonly _lifecycle: Set<IAsyncDisposable> = new Set();
  private _isDisposed: boolean = false;
    
  public dispose(): Promise<void> {
    if(this._isDisposed) return Promise.resolve(void 0);

    this._isDisposed = true;
    return this.clear();
  }
    
  protected async clear() {
    await Promise.all([...this._lifecycle.values()].map(item => item.dispose()));
    this._lifecycle.clear();
  }
    
  protected _register<T extends IAsyncDisposable>(t: T): T {
    if(this._isDisposed) {
      console.warn('[AsyncDisposable] Registering disposable on object that has already been disposed.');
      t.dispose();
    } else {
      this._lifecycle.add(t);
    }
    
    return t;
  }
    
}


export type UsingOptions = {
  cache?: boolean;
}

export async function using<T extends IDisposable | IAsyncDisposable, R>(
  resource: T,
  resolver: (resource: T) => MaybePromise<R>,
  options?: UsingOptions // eslint-disable-line comma-dangle
): Promise<R> {
  try {
    void options;
    // TODO: #options
    const r = await resolver(resource);
    return r;
  } finally {
    await resource.dispose();
  }
}
