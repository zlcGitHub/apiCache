# apiCache

配置化缓存插件（默认通过 storage 及 map 实现）

# 使用步骤

```
yarn add @xiujin/api-cache

import { ExpriesCache } from '@xiujin/api-cache'

const cacheApis = {
  'test/api': {
    cache: true,
    time:1,
    cacheType: 'local'
  }
}

ExpriesCache.init({ cacheApis })

ExpriesCache.set({
  api:'test/api',
  headers:{},
  params:{}
},{
  data: 'testData'
})

const data = await ExpriesCache.get({
  api:'test/api',
  headers:{},
  params:{}
})

```

# 自定义驱动
- 可根据使用环境传入自定义驱动,如微信小程序中配置local和session为 `wx.setStorage` 和 `getStorage`等,具体分装可参考`type TCacheDriver`