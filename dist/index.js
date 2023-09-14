import e from"localforage";class t{static cacheMap=new Map;static cacheApis={};static cacheName="";static syncMap=!0;static cacheDriver={local:void 0,session:{getItem:async e=>JSON.parse(sessionStorage.getItem(e)??"{}"),setItem:async(e,t)=>(sessionStorage.setItem(e,JSON.stringify(t)),t),removeItem:async e=>{sessionStorage.removeItem(e)},clear:async()=>{this.clearStorage(sessionStorage,(e=>{sessionStorage.removeItem(e)}))}},memory:{getItem:async e=>this.cacheMap.get(e),setItem:async(e,t)=>(this.cacheMap.set(e,t),t),removeItem:async e=>{this.cacheMap.delete(e)},clear:async()=>{this.cacheMap.clear()}}};static async init(t){this.cacheApis=t.cacheApis,this.cacheName=t.name||"ExpriesCache",this.syncMap=t.syncMap??!0,t.cacheDriver&&Object.keys(t.cacheDriver).forEach((e=>{this.cacheDriver[e]=t.cacheDriver[e]})),this.cacheDriver.local||(e.config({name:this.cacheName}),this.cacheDriver.local=e)}static clearStorage(e,t){const c=[];for(let t=0;t<e.length;t++){const a=e.key(t);a&&a.startsWith(this.cacheName)&&c.push(a)}c.forEach((e=>{t(e)}))}static _initKey(e){const t=e=>"object"!=typeof e||null===e?e:Array.isArray(e)?e.map(t):Object.keys(e).sort().reduce(((c,a)=>(c[a]=t(e[a]),c)),{}),c=t(e);return`${this.cacheName}/${JSON.stringify(c)}`}static _isCache(e){const t=this.cacheApis[e.api];return!!t&&("boolean"==typeof t.cache?t.cache:t.cache(e))}static _isOut(e,t){if(!t)return!1;return(new Date).getTime()>t+1e3*e*60*60}static async get(e){if(!this._isCache(e))return!1;const t=this.cacheApis[e.api],c=this._initKey(e),a=t.cacheType,s=e=>{const s=this._isOut(t.time,e?.createTime);s&&this.cacheDriver[a].removeItem(c);return!!(!s&&e?.data)&&e.data};if(this.syncMap){const a=s(this.cacheMap.get(c));if(a)return console.log(`Map:${t.cacheType}.getItem:${e.api}`,a),a}if(a){const a=await this.cacheDriver[t.cacheType].getItem(c);console.log(`${t.cacheType}.getItem:${e.api}`,a);const i=s(a);return i&&this.syncMap&&this.cacheMap.set(c,a),i}return!1}static async set(e,t){if(!this._isCache(e))return!1;if(!t)return!1;const c=this.cacheApis[e.api].cacheType,a=this._initKey(e),s={data:t,createTime:(new Date).getTime()};if(this.syncMap&&this.cacheMap.set(a,s),c)try{await this.cacheDriver[c].setItem(a,s)}catch(e){console.log(e)}}static async clear(){this.cacheMap.clear(),Object.values(this.cacheDriver).forEach((async e=>{await e.clear()}))}}export{t as ExpriesCache};
