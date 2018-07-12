/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/* eslint-env es6, mocha, node */
/* eslint-extends: eslint:recommended */
'use strict';


// Import modules
import URL = require("url");
import QueryString = require("querystring");
import Superagent = require("superagent");


// Declaration
declare interface Headers {
    [index: string]: string
}

declare interface Options {
    [index: string]: any
}



class Client {
    public agent = Superagent;
    public headers: Headers = {};
    public options: Options = {};
    public base_url?: string;


    /**
     * Constructor
     *
     * @constructs {Client}
     * @param {Object} headers
     * @param {Object} options
     */
    constructor(headers?: Headers, options?: Options) {
        this.headers = headers || {};
        this.options = options || {};
        if (options && "base_url" in options) {
            this.base_url = options.base_url;
        }
    }

    /**
     * Get request
     *
     * @param {string} url
     * @param {Object} parameters
     */
    get(url: string, parameters: {[index: string]: any}={}): Promise<any> {
        const request = new URL.URL(url, this.base_url);
        const params = Object.assign(
            QueryString.parse(request.searchParams.toString()) || {},
            parameters || {});
        request.search = QueryString.stringify(params);

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



// Export module
export default Client;



/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * c-hanging-comment-ender-p: nil
 * End:
 */

