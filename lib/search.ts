/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/* eslint-env es6, mocha, node */
/* eslint-extends: eslint:recommended */
'use strict';


// 必要なモジュールのインポート
import URL = require("url");
import Client from "./client";
import Document from "./document";
import {MatchingOptions} from "./document";

const rewritePattern = require("regexpu-core");


// 変数の宣言
const others = new RegExp(rewritePattern("\\p{C}", "iu", {unicodePropertyEscape: true}), "g");


// インターフェースの宣言
/**
 * コンストラクタに渡すオプション
 *
 * @typedef {Object} Options
 * @property {number} [depth]
 * @property {Array.<string>} [domains]
 * @property {boolean} [normalize]
 * @property {number} [wait]
 */
declare interface Options {
    depth?: number;
    domains?: Array<string>;
    normalize?: boolean;
    wait?: number;
}

/**
 * メソッドの結果
 *
 * @typedef {Object} Message
 * @property {string} url
 * @property {number} step
 * @property {Array.<string>} stack
 */
declare interface Message {
    url: string;
    step: number;
    stack: Array<string>;
}

/**
 * 検索を実行するクラス
 *
 * @class
 */
class Search {
    /**
     * 検索対象の URL などの情報を保存しておく配列
     *
     * @type {Array.<Message>}
     */
    public queue: Array<Message> = [];

    /**
     * 検索済みの URL を保存しておくオブジェクト
     *
     * 配列を検索するよりも速いので、オブジェクトを利用する
     *
     * @type {Object}
     */
    public map: {[index: string]: boolean} = {};

    /**
     * 検索対象のドメインの一覧
     *
     * "fujimakishouten.com" と "www.fujimakishouten.com" は別のドメインとして扱う
     * 配列を検索するよりも速いので、オブジェクトを利用する
     *
     * @type {Object}
     */
    public domains: {[index: string]: boolean} = {};

    /**
     * 検索のエントリーポイントとなる URL
     *
     * @type {string}
     */
    public url: string;

    /**
     * オプション
     *
     * @type {Options}
     */
    public options: Options = {};

    /**
     * コンストラクタ
     *
     * @constructs Search
     * @url {string} url                検索のエントリーポイントとなる URL
     * @options {Options} [options]    オプション
     */
    constructor(url: string, options?: Options) {
        this.url = url;
        this.options = options || {};
        this.options.depth = this.options.depth || 0;
        this.options.domains = this.options.domains || [];
        this.domains = this.options.domains.reduce((collection: {[index: string]: boolean}, value: string) => {
            collection[value] = true;

            return collection;
        }, {});
    }

    /**
     * 文字列を正規化する
     *
     * @param   {string} string           正規化したい文字列
     * @param   {string} [form="NFKC"]    正規化の形式、デフォルトは NFKC
     * @returns {string}
     */
    private normalize(string: string, form="NFKC"): string {
        // 1 行ずつ処理するのは、コントロール文字を削除したときに改行が削除されてしまわないように
        const lines = string.split(/\r\n|\r|\n/).map(function (line) {
            return line.replace(others, "");
        });

        return lines.join("\n").normalize(form);
    }

    /**
     * 指定したミリ秒の間処理を一時停止する
     *
     * @param {number} milliseconds    停止する時間をミリ秒で指定する
     * @returns {Promise}
     */
    private sleep(milliseconds: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, milliseconds);
        });
    }

    /**
     * ウェブサイトを開き、指定された文字列が含まれるかを確認する
     * 文字列が見つからなかった場合には、リンクを辿って検索を継続する
     *
     * @param {string} word                  検索対象の文字列
     * @param {MatchingOptions} [options]    マッチングを行う際のオプション
     * @returns {Promise<Message|null>}
     */
    async search(word: string, options?: MatchingOptions): Promise<Message|null> {
        const target = (this.options.normalize) ? this.normalize(word) : word;
        this.queue.push({
            url: this.url,
            step: 1,
            stack: [this.url]
        });

        // 最短経路が必要なので、幅優先探索を行う
        while(this.queue.length) {
            const message = this.queue.shift();
            const url = new URL.URL(message.url);

            // すでに検索したパスはスキップする
            if (message.url in this.map) {
                continue;
            }
            // JavaScript が指定されているリンクはスキップする
            if (url.protocol === "javascript:") {
                continue;
            }
            // 許可されたドメイン以外へのアクセスはスキップする
            if (this.options.domains.length) {
                if (!this.domains[url.hostname]) {
                    continue;
                }
            }
            // 指定された深さ以上になったら終了する
            if (this.options.depth > 0 && message.step > this.options.depth) {
                break;
            }

            // URL を開いて内容を取得する
            let response;
            const client = new Client();
            try {
                response = await client.get(message.url);
            } catch (error) {
                continue;
            } finally {
                // 検索済みの URL を記録する
                // エラーになって continue が呼ばれても、finally は実行される
                this.map[message.url] = true;
            }

            // 検索対象の文字列が存在すれば結果を返す
            const text = (this.options.normalize) ? this.normalize(response.text) : response.text;
            const document = new Document(text);
            if (document.hasString(target, options)) {
                return Promise.resolve(message);
            }

            // 検索対象の文字列が見つからなければ、キューにリンク先の URL を登録する
            const links =  document.getLinks(message.url);
            links.push.apply(this.queue, links.map((link: string): Message => {
                // JavaScript の配列は参照渡しされるため、コピーした配列に経路を保存する必要がある
                const stack = message.stack.slice();
                stack.push(link);

                return {
                    url: link,
                    step: message.step + 1,
                    stack: stack
                };
            }));

            // ウェイトが指定されていれば、指定された時間だけ待つ
            if (this.options.wait > 0) {
                await this.sleep(this.options.wait);
            }
        }

        return Promise.resolve(null);
    }
}


// Search クラスをエクスポートする
export default Search;



/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * c-hanging-comment-ender-p: nil
 * End:
 */
