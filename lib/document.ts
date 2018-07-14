/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/* eslint-env es6, mocha, node */
/* eslint-extends: eslint:recommended */
'use strict';


// Import modules
import URL = require("url");
import Cheerio = require("cheerio");


// Declaration
export interface MatchingOptions {
    ignoreCase?: boolean;
    multiline?: boolean;
}


class Document {
    public body: string;
    public document: CheerioStatic;

    /**
     * Constructor
     *
     * @constructs {Document}
     * @param {string} body
     */
    constructor(body: string) {
        this.body = body;
        this.document = Cheerio.load(this.body);
    }

    /**
     * Get request
     *
     * @param {string} string
     * @param {Object} [options]
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
     * Get links in the document
     *
     * @returns {Array}
     */
    getLinks(base_url?: string): any {
        const links = this.document("a").map(function () {
            return Cheerio(this).attr("href");
        }).get();

        const result = links.reduce((collection: {[index: string]: number}, link: string) => {
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



// Export module
export default Document;



/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * c-hanging-comment-ender-p: nil
 * End:
 */

