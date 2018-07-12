/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/* eslint-env es6, mocha, node */
/* eslint-extends: eslint:recommended */
'use strict';


// Import modules
import URL = require("url");
import Client from "./client";
import Document from "./document";
import Queue from "./queue";



declare interface Message {
    url: string;
    stack: Array<string>
}


class Search {
    public queue: Queue;
    public map: {[index: string]: boolean} = {};

    /**
     * constructor
     *
     * @constructs Search
     */
    constructor() {
        this.queue = new Queue();
    }

    async search(url: string, word: string): Promise<any> {
        this.queue.push({
            url: url,
            stack: []
        } as Message);

        while(this.queue.length) {
            const message: Message = this.queue.shift();
            if (message.url in this.map) {
                continue;
            }

            let response;
            const client = new Client();
            try {
                response = await client.get(message.url);
            } catch (error) {
                continue;
            }
            this.map[message.url] = true;

            const document = new Document(response.text);
            if (document.hasString(word)) {
                return Promise.resolve(message);
            }

            const links =  document.getLinks();
            if (links.length) {
                this.queue.push.apply(this.queue, links.map((link: string) => {
                    const address = URL.format(new URL.URL(link, message.url));
                    const stack = message.stack.slice();
                    stack.push(address);

                    return {
                        url: address,
                        stack: stack
                    } as Message;
                }));
            }
        }

        return Promise.resolve();
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

