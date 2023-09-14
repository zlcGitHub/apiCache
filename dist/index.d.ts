type Indexable<T = any> = {
    [key: string]: T;
};
type TCacheMethodReq = {
    api: string;
    headers: Indexable;
    params: Indexable;
};
type TCacheType = 'local' | 'session' | 'memory';
type TCacheApi = {
    cache: boolean | ((e: TCacheMethodReq) => boolean);
    time: number;
    cacheType: TCacheType;
};
export type TCacheApiObject = Indexable<TCacheApi>;
type TCacheDriverItem = {
    getItem<T = string>(key: string): Promise<T | null | undefined>;
    setItem<T>(key: string, value: T): Promise<T>;
    removeItem(key: string): Promise<void>;
    clear(): Promise<void>;
};
export type TCacheDriver = {
    local?: TCacheDriverItem;
    session?: TCacheDriverItem;
    memory?: TCacheDriverItem;
};
type TInitParams = {
    cacheApis: TCacheApiObject;
    cacheDriver?: TCacheDriver;
    name?: string;
    syncMap?: boolean;
};
export declare class ExpriesCache {
    static cacheMap: Indexable;
    static cacheApis: Indexable<TCacheApi>;
    static cacheName: string;
    static syncMap: boolean;
    static cacheDriver: TCacheDriver;
    static init(params: TInitParams): Promise<void>;
    static clearStorage(storage: Storage, removeFn: (key: string) => void): void;
    static _initKey(params: TCacheMethodReq): string;
    static _isCache(params: TCacheMethodReq): boolean;
    static _isOut(time: number, createTime: number): boolean;
    static get<T = any>(params: TCacheMethodReq): Promise<T | false>;
    static set(params: TCacheMethodReq, data: any): Promise<false | undefined>;
    static clear(): Promise<void>;
}
export {};
