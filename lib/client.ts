/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/* eslint-env es6, mocha, node */
/* eslint-extends: eslint:recommended */
'use strict';


// 必要なモジュールのインポート
import URL = require("url");
import QueryString = require("querystring");
import Superagent = require("superagent");


// インターフェースの宣言
/**
 * リクエストヘッダーのパラメータを保存しておくオブジェクト
 *
 * @typedef {Object} Headers
 */
declare interface Headers {
    [index: string]: string
}

/**
 * コンストラクタに渡すオプション
 *
 * @typedef {Object}
 * @property {string} [base_url]    相対 URL のベースとなる URL
 *                                   相対 URL を使用するときには必須
 */
declare interface Options {
    [index: string]: any
}


/**
 * URL を開いて、内容を取得するためのクラス
 *
 * @class
 */
class Client {
    /**
     * SuperAgent のオブジェクト
     *
     * @type {request | request.SuperAgentStatic}
     */
    public agent = Superagent;

    /**
     * 追加で送信するリクエストヘッダー
     *
     * @type {Headers}
     */
    public headers: Headers = {};

    /**
     * オプション
     *
     * @type {Options}
     */
    public options: Options = {};

    /**
     * 相対 URL のベースとなる URL
     *
     * @type {string}
     */
    public base_url?: string;


    /**
     * コンストラクタ
     *
     * @constructs {Client}
     * @param {Headers} headers    追加で送信するリクエストヘッダー
     * @param {Options} options    オプション
     */
    constructor(headers?: Headers, options?: Options) {
        this.headers = headers || {};
        this.options = options || {};
        if (options && "base_url" in options) {
            this.base_url = options.base_url;
        }
    }

    /**
     * GET でのリクエストを行い、結果を取得する
     *
     * @param {string} url           リクエストを行う URL
     * @param {Object} parameters    追加のパラメーター
     */
    get(url: string, parameters: {[index: string]: any}={}): Promise<any> {
        // URL にパラメーターを追加する
        const request = new URL.URL(url, this.base_url);
        const params = Object.assign(
            QueryString.parse(request.searchParams.toString()) || {},
            parameters || {});
        request.search = QueryString.stringify(params);

        // クライアントに追加のヘッダーを設定する
        const client = this.agent.get(URL.format(request));
        Object.keys(this.headers).forEach((key) => {
            client.set(key, this.headers[key]);
        });

        return new Promise((resolve, reject) => {
            client.end((error: Error, result: any) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    }
}



// Client クラスをエクスポートする
export default Client;



/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * c-hanging-comment-ender-p: nil
 * End:
 */

