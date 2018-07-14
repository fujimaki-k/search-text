/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/* eslint-env es6, mocha, node */
/* eslint-extends: eslint:recommended */
'use strict';


// 必要なモジュールのインポート
import URL = require("url");
import Cheerio = require("cheerio");


// インターフェースの宣言
/**
 * マッチングを行う際のオプション
 *
 * @typedef {Object} MatchingOptions
 * @property {boolean} [ignoreCase]    true の場合に大文字小文字を区別せずに検索を行う
 * @property {boolean} [multiline]     true の場合に複数行でのマッチングを行う
 */
export interface MatchingOptions {
    ignoreCase?: boolean;
    multiline?: boolean;
}

/**
 * HTML ドキュメントを扱うクラス
 *
 * @class
 */
class Document {
    /**
     * HTML ドキュメントの文字列
     *
     * @type {string}
     */
    public body: string;

    /**
     * Cheerio のオブジェクト
     *
     * @type {CheerioStatic}
     */
    public document: CheerioStatic;

    /**
     * コンストラクタ
     *
     * @constructs {Document}
     * @param {string} body    HTML ドキュメントの文字列
     */
    constructor(body: string) {
        this.body = body;
        this.document = Cheerio.load(this.body);
    }

    /**
     * HTML ドキュメントに指定された文字列が含まれているかを確認する
     *
     * @param {string} string                検索したい文字列
     * @param {MatchingOptions} [options]    マッチングを行う際のオプション
     * @returns boolean
     */
    hasString(string: string, options: MatchingOptions = {}): boolean {
        let flags = "u";
        flags = (options.ignoreCase) ? `${flags}i` : flags;
        flags = (options.multiline) ? `${flags}m` : flags;

        const regexp = new RegExp(string, flags);

        return regexp.test(this.body);
    }

    /**
     * HTML ドキュメントに含まれる文字列を取得する
     *
     * @param    {string} [base_url]    相対 URL を解釈するさいのベース URL
     * @returns {Array}
     */
    getLinks(base_url?: string): any {
        const links = this.document("a").map(function () {
            return Cheerio(this).attr("href");
        }).get();

        // 重複している URL を削除する
        const result = links.reduce((collection: {[index: string]: number}, link: string) => {
            // base_url が指定されている場合は、ハッシュ（ページ内リンク）を削除する
            // 相対 URL では URL パーサーが使えないため、この処理は行わない
            if (base_url) {
                const url = new URL.URL(link, base_url);
                url.hash = "";
                collection[URL.format(url)] = 1;

                return collection;
            }
            collection[link] = 1;

            return collection;
        }, {});

        return Object.keys(result);
    }
}



// Document クラスをエクスポートする
export default Document;



/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * c-hanging-comment-ender-p: nil
 * End:
 */

