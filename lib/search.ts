/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/* eslint-env es6, mocha, node */
/* eslint-extends: eslint:recommended */
'use strict';



// 必要なモジュールのインポート
import Events = require("events");
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
    connections?: number;
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
    type?: string;
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
     * 現在のコネクション数
     *
     * @type {number}
     */
    public connections: number = 0;


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
        this.options.connections = this.options.connections || 1;
        this.options.depth = this.options.depth || 0;
        this.options.domains = this.options.domains || [];
        // 配列を検索すると遅いので、オブジェクトに変換しておく
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
     * イベントで処理を並列化して、高速化を図ったバージョン
     *
     * @param {string} word                  検索対象の文字列
     * @param {MatchingOptions} [options]    マッチングを行う際のオプション
     * @returns {Promise<Message|null>}
     */
    search(word: string, options?: MatchingOptions): Promise<Message|null> {
        const target = (this.options.normalize) ? this.normalize(word) : word;
        this.queue.push({
            url: this.url,
            step: 1,
            stack: [this.url]
        });

        return new Promise((resolve) => {
            const event = new Events.EventEmitter();
            let complete = false;  // 検索が完了したかどうかのフラグ

            // 文字列が見つからず、次の URL を処理する際に発生するイベント
            event.on("next", () => {
                // キューが空になり、処理も完了していれば終了する
                if (!this.queue.length && this.connections < 1) {
                    return event.emit("complete", null);
                }

                // 検索が完了していなければ継続する
                if (!complete) {
                    // 指定された最大コネクション数だけ同時に処理を実行する
                    while(this.queue.length && this.options.connections > this.connections) {
                        this.execute(event, target, options);
                    }
                }
            });

            // 検索が完了した場合に発生するイベント
            event.on("complete", (result) => {
                complete = true;  // 処理が継続されないようにフラグを立てる
                this.queue = [];

                return resolve(result || null);
            });

            // エントリーポイントにアクセスして処理を開始する
            event.emit("next");
        });
    }

    /**
     * キューに登録された URL を開いて、文字列を検索した結果を返す
     * 指定された URL に文字列がない場合は、そこからリンクをたどり、さらに検索を行う
     *
     * @param {Event} event
     * @param {string} word
     * @param {MatchingOptions} options
     * @returns {Promise<boolean>}
     */
    private async execute(event: Events, word: string, options?: MatchingOptions) {
        // 最短経路が欲しいので、幅優先探索を行う
        const message = this.queue.shift();
        const url = new URL.URL(message.url);
        this.connections = this.connections + 1;

        let next = false;
        if (this.options.domains.length) {
            next = !(url.hostname in this.domains);       // 許可されたドメイン以外へのアクセスはスキップする
        }
        next = next || (message.url in this.map);          // 既に検索したパスはスキップする
        next = next || (url.protocol === "javascript:");  // JavaScript が指定されているリンクはスキップする
        if (next) {
            this.connections = this.connections - 1;

            return event.emit("next");
        }

        // 指定された深さ以上になら終了する
        if (this.options.depth > 0 && message.step > this.options.depth) {
            this.connections = this.connections - 1;

            return event.emit("complete", null);
        }

        // URL を開いて内容を取得する
        let response;
        const client = new Client();
        try {
            this.map[message.url] = true;
            response = await client.get(message.url);
        } catch (error) {
            this.connections = this.connections - 1;

            return event.emit("next");
        }

        // 検索対象の文字列が存在すれば結果を返す
        const text = (this.options.normalize) ? this.normalize(response.text) : response.text;
        const document = new Document(text);
        if (document.hasString(word, options)) {
            this.connections = this.connections - 1;

            return event.emit("complete", message);
        }

        // 検索対象の文字列が見つからなければ、キューにリンク先の URL を登録する
        const links =  document.getLinks(message.url);
        links.push.apply(this.queue, links.map((link: string): Message => {
            // JavaScript の配列は参照渡しされるため、配列をコピーして経路を保存する必要がある
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

        this.connections = this.connections - 1;

        return event.emit("next");
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
