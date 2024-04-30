import type { MaybePromise } from '../types';
import { FetchInit, FetchMap, HttpResponse } from '../async/fetch';



// export interface AsyncData<K extends string> {}

type AsyncData<K extends string> = (<T>(key: K, url?: string | URL, options?: FetchInit & { resolver?: Resolver }) => Promise<T>);
type Resolver = (response: HttpResponse) => MaybePromise<any>;

export function useAsyncData<K extends string>(): AsyncData<K> {
  const map = new FetchMap<K>();
  const cache = new Map<K, HttpResponse>();
  const resolvers = new Map<K, Resolver>();

  const get = async (key: K): Promise<any> => {
    if(cache.has(key)) return resolvers.has(key) ? resolvers.get(key)!(cache.get(key)!) : cache.get(key)!.arrayBuffer();

    const response = await map.fetch(key);
    cache.set(key, response.clone());

    if(resolvers.has(key)) return resolvers.get(key)!(response);
    return response;
  };

  const register = (key: K, url: string | URL, options?: FetchInit & { resolver?: Resolver }) => {
    const o = { ...options };
    delete o.resolver;

    map.set(key, url, o);

    if(options?.resolver && typeof options.resolver === 'function') {
      resolvers.set(key, options.resolver);
    }
  };

  const fetch = <T = HttpResponse>(key: K, url?: string | URL, options?: FetchInit & { resolver?: Resolver }): Promise<T> => {
    if(!map.contains(key) && !url) {
      throw new Error(`Key "${key}" not registered`);
    }

    if(!key && !!url) {
      register(key, url, options);
    }

    return get(key);
  };

  return fetch;
}

export default useAsyncData;
