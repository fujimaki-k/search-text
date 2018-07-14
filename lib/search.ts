/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/* eslint-env es6, mocha, node */
/* eslint-extends: eslint:recommended */
'use strict';


// Import modules
import URL = require("url");
import Client from "./client";
import Document from "./document";
import {MatchingOptions} from "./document";

const rewritePattern = require("regexpu-core");


// Variables
const others = new RegExp(rewritePattern("\\p{C}", "iu", {unicodePropertyEscape: true}), "g");


// Declaration
declare interface Options {
    depth?: number;
    domains?: Array<string>;
    normalize?: boolean;
    wait?: number;
}

declare interface Message {
    url: string;
    step: number;
    stack: Array<string>;
}


class Search {
    public queue: Array<Message> = [];
    public map: {[index: string]: boolean} = {};
    public domains: {[index: string]: boolean} = {};
    public url: string;
    public options: Options = {};

    /**
     * constructor
     *
     * @constructs Search
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
     * Normalize string
     *
     * @param   {string} string
     * @param   {string} [form="NFKC"]
     * @returns {string}
     */
    private normalize(string: string, form="NFKC"): string {
        const lines = string.split(/\r\n|\r|\n/).map(function (line) {
            return line.replace(others, "");
        });

        return lines.join("\n").normalize(form);
    }

    /**
     * Sleep
     *
     * @param {number} milliseconds
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
     * Search word in the web
     *
     * @param {string} word
     * @param {MatchingOptions} [options]
     * @returns {Promise}
     */
    async search(word: string, options?: MatchingOptions): Promise<Message|null> {
        const target = (this.options.normalize) ? this.normalize(word) : word;
        this.queue.push({
            url: this.url,
            step: 1,
            stack: [this.url]
        });

        while(this.queue.length) {
            const message = this.queue.shift();
            const url = new URL.URL(message.url);
            if (message.url in this.map) {
                continue;
            }
            if (this.options.depth > 0 && message.step > this.options.depth) {
                continue;
            }
            if (url.protocol === "javascript:") {
                continue;
            }
            if (this.options.domains.length) {
                if (!this.domains[url.hostname]) {
                    continue;
                }
            }

            let response;
            const client = new Client();
            try {
                response = await client.get(message.url);
            } catch (error) {
                continue;
            } finally {
                this.map[message.url] = true;
            }

            const text = (this.options.normalize) ? this.normalize(response.text) : response.text;
            const document = new Document(text);
            if (document.hasString(target, options)) {
                return Promise.resolve(message);
            }

            const links =  document.getLinks(message.url);
            links.push.apply(this.queue, links.map((link: string): Message => {
                const stack = message.stack.slice();
                stack.push(link);

                return {
                    url: link,
                    step: message.step + 1,
                    stack: stack
                };
            }));

            if (this.options.wait > 0) {
                await this.sleep(this.options.wait);
            }
        }

        return Promise.resolve(null);
    }
}


// Export module
export default Search;



/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * c-hanging-comment-ender-p: nil
 * End:
 */
