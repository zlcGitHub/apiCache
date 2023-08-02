import localforage from 'localforage'

type Indexable<T = any> = {
  [key: string]: T
}

type TCacheMethodReq = {
  api: string
  headers: Indexable
  params: Indexable
}

type TCacheType = 'local' | 'session' | 'memory' // 缓存类型(memory缓存在内存里,刷新后清除)

type TCacheApi = {
  cache: boolean | ((e: TCacheMethodReq) => boolean) // 是否缓存(可接收当前api入参判断)
  time: number // 缓存时间(单位小时)
  cacheType: TCacheType
}
export type TCacheApiObject = Indexable<TCacheApi>

type TValue = {
  data: any // 缓存数据
  createTime: number
}

type TCacheDriverItem = {
  getItem<T = string>(key: string): Promise<T | null | undefined>
  setItem<T>(key: string, value: T): Promise<T>
  removeItem(key: string): Promise<void>
  clear(): Promise<void> // 默认仅清除已缓存数据
}
export type TCacheDriver = {
  local?: TCacheDriverItem
  session?: TCacheDriverItem
  memory?: TCacheDriverItem
}

type TInitParams = {
  cacheApis: TCacheApiObject // 待缓存api集合对象
  // 自定义缓存驱动(默认local:localforage,session:sessionStorage,memory:map(存储在内存中))
  cacheDriver?: TCacheDriver
  name?: string // 缓存数据前缀,默认'ExpriesCache'(使用localforage对应数据库名称)
  syncMap?: boolean // 是否同步存储在map中(默认true,优先调用内存)
}

export class ExpriesCache {
  /** map缓存 */
  static cacheMap: Indexable = new Map()

  /** 待缓存枚举 */
  static cacheApis: Indexable<TCacheApi> = {}

  /** 缓存仓库前缀 */
  static cacheName = ''

  /** 是否同步存储map中(默认true) */
  static syncMap = true

  /** 缓存驱动(默认如下) */
  static cacheDriver: TCacheDriver = {
    local: undefined,
    session: {
      getItem: async <T>(key: string) =>
        JSON.parse(sessionStorage.getItem(key) ?? '{}') as T,
      setItem: async <T>(key: string, value: T) => {
        sessionStorage.setItem(key, JSON.stringify(value))
        return value
      },
      removeItem: async (key: string) => {
        sessionStorage.removeItem(key)
      },
      clear: async () => {
        this.clearStorage(sessionStorage, sessionStorage.removeItem)
      },
    },
    memory: {
      getItem: async <T>(key: string) => this.cacheMap.get(key) as T,
      setItem: async <T>(key: string, value: T) => {
        this.cacheMap.set(key, value)
        return value
      },
      removeItem: async (key: string) => {
        this.cacheMap.delete(key)
      },
      clear: async () => {
        this.cacheMap.clear()
      },
    },
  }

  // 初始化配置
  static async init(params: TInitParams) {
    this.cacheApis = params.cacheApis
    this.cacheName = params.name || 'ExpriesCache'
    this.syncMap = params.syncMap ?? true
    if (params.cacheDriver) {
      Object.keys(params.cacheDriver).forEach((key) => {
        // @ts-ignore
        this.cacheDriver[key] = params.cacheDriver[key]
      })
    }

    // local默认使用localforage
    if (!this.cacheDriver.local) {
      localforage.config({
        name: this.cacheName,
      })
      this.cacheDriver.local = localforage
    }
  }

  /** 遍历删除缓存数据(依据前缀,适用webStorage) */
  static clearStorage(storage: Storage, removeFn: (key: string) => void) {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (key && key.startsWith(this.cacheName)) {
        removeFn(key)
      }
    }
  }

  // 拼接key(api+参数+headers)
  static _initKey(params: TCacheMethodReq) {
    // 参数进行排序
    const _handleSort = (obj: any):any => {
      if (typeof obj !== 'object' || obj === null) return obj
      if (Array.isArray(obj)) {
        return obj.map(_handleSort)
      }
      return Object.keys(obj)
        .sort()
        .reduce((sortedObj: Indexable, key) => {
          sortedObj[key] = _handleSort(obj[key])
          return sortedObj
        }, {})
    }
    const sortedParams = _handleSort(params)
    return `${this.cacheName}/${JSON.stringify(sortedParams)}`
  }

  // 判断是否缓存条件
  static _isCache(params: TCacheMethodReq) {
    const cacheOption = this.cacheApis[params.api]
    if (!cacheOption) return false
    if (typeof cacheOption.cache === 'boolean') return cacheOption.cache
    return cacheOption.cache(params)
  }

  // 判断是否过期(time缓存时间小时; createTime数据存入时间(时间戳))
  static _isOut(time: number, createTime: number) {
    if (!createTime) return false
    const now = new Date().getTime()
    return now > createTime + time * 1000 * 60 * 60
  }

  /** 拿取数据 */
  static async get<T = any>(params: TCacheMethodReq): Promise<T | false> {
    if (!this._isCache(params)) return false // 判断缓存条件
    const cacheOption = this.cacheApis[params.api]
    const cacheKey = this._initKey(params)
    const _cacheType = cacheOption.cacheType
    // 处理数据并返回
    const _handleData = (_value: TValue) => {
      const isOut = this._isOut(cacheOption.time, _value?.createTime) // 是否过期
      isOut && this.cacheDriver[_cacheType]!.removeItem(cacheKey) // 过期时清除
      const isOk = !isOut && _value?.data // 判断是否过期且存在

      return isOk ? _value.data : false // 过期则返回false
    }

    // 开启map同步后优先从map中拿取数据(有值时返回)
    if (this.syncMap) {
      const _mapValue = _handleData(this.cacheMap.get(cacheKey))
      if (_mapValue) {
        console.log(
          `Map:${cacheOption.cacheType}.getItem:${params.api}`,
          _mapValue
        )
        return _mapValue
      }
    }

    // 取值
    if (_cacheType) {
      const value: any = await this.cacheDriver[cacheOption.cacheType]!.getItem(
        cacheKey
      )
      console.log(`${cacheOption.cacheType}.getItem:${params.api}`, value)
      const _cacheValue = _handleData(value)
      _cacheValue && this.syncMap && this.cacheMap.set(cacheKey, value) // 开启同步map时存储
      return _cacheValue
    }

    return false
  }

  /** 存储数据 */
  static async set(params: TCacheMethodReq, data: any) {
    if (!this._isCache(params)) return false // 判断缓存条件
    if (!data) return false // 数据有误return(暂不考虑数据false等情况)

    const cacheOption = this.cacheApis[params.api]
    const _cacheType = cacheOption.cacheType
    const cacheKey = this._initKey(params)

    const value = {
      data, // 缓存数据
      createTime: new Date().getTime(), // 缓存时间(毫秒)
    }

    this.syncMap && this.cacheMap.set(cacheKey, value) // 存入map(开启syncMap时)

    // 存值
    if (_cacheType) {
      try {
        await this.cacheDriver[_cacheType]!.setItem(cacheKey, value)
      } catch (error) {
        console.log(error) // local存储空间溢出或出错
      }
    }
  }

  /** 清除所有缓存 */
  static clear() {
    this.cacheMap.clear()
    Object.values(this.cacheDriver).forEach((driver) => {
      driver.clear()
    })
  }
}
