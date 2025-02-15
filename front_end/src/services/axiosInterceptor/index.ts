/*
 * @Author: 祝占朋 wb.zhuzp01@rd.netease.com
 * @Date: 2023-03-21 11:43:45
 * @LastEditors: 祝占朋 wb.zhuzp01@rd.netease.com
 * @LastEditTime: 2023-11-13 20:17:39
 * @FilePath: \ai-demo\src\services\axiosInterceptor\index.ts
 * @Description:
 */
import axios from 'axios';
import interceptors from './interceptors/index';
axios.defaults.withCredentials = true;
function isInterceptor(config: any, name: string) {
  return config[name];
}
function getInterceptors() {
  return {
    ...interceptors,
  };
}
const alwaysOpen = ['errorToast', 'rdLoginReqToken'];
function runInterceptors(instance: any) {
  if (!instance) return;
  const allInterceptor = getInterceptors() as any;
  Object.keys(allInterceptor).forEach(name => {
    const interceptor = allInterceptor[name];
    if (interceptor.request || interceptor.requestError) {
      instance.interceptors.request.use(
        (config: any) => {
          if (
            alwaysOpen.indexOf(name) > -1 ||
            (interceptor.request && isInterceptor(config, name))
          ) {
            return interceptor.request(config, instance);
          }
          return config;
        },
        (error: any) => {
          if (interceptor.requestError) {
            // && error.config[name]请求报错自动开启toast提示
            return interceptor.requestError(error);
          }
          return Promise.reject(error);
        }
      );
    }
    if (interceptor.response || interceptor.responseError) {
      instance.interceptors.response.use(
        (response: any) => {
          return cheakcCanResponse(response, name, interceptor, instance);
        },
        (error: any) => {
          const { config = {}, headers = {} } = error;
          const responseData = {
            config,
            statusText: 'OK',
            headers,
            status: 200,
            data: {
              code: 500,
              data: '',
              msg: '请求失败',
            },
          };
          if (interceptor.responseError && (config[name] || alwaysOpen.indexOf(name) > -1)) {
            interceptor.responseError(error, instance);
          }
          return cheakcCanResponse(responseData, name, interceptor, instance);
          // return Promise.reject(error);
        }
      );
    }
  });
}
function cheakcCanResponse(response, name, interceptor, instance) {
  const { config = {} } = response || {};
  if (alwaysOpen.indexOf(name) > -1 || (interceptor.response && config[name])) {
    return interceptor.response(response, instance);
  }
  return response;
}
const http = axios.create({
  headers: {},
});
runInterceptors(http);
export default http;
