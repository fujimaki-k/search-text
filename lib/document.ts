/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/* eslint-env es6, mocha, node */
/* eslint-extends: eslint:recommended */
'use strict';


// Import modules
import cheerio = require("cheerio");



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
        this.document = cheerio.load(this.body);
    }

    /**
     * Get request
     *
     * @param {string} string
     * @returns boolean
     */
    hasString(string: string): boolean {
        const regexp = new RegExp(string, "imu");

        return regexp.test(this.body);
    }

    getLinks(): any {
        return this.document("a").map(function () {
            return cheerio(this).attr("href");
        }).get();
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

