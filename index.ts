/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/* eslint-env es6, mocha, node */
/* eslint-extends: eslint:recommended */
'use strict';


// Configuration
/*
const url = "https://127.0.0.1:8000";
const word = "printemps";
*/


// Import modules
import superagent = require("superagent");
// import cheerio = require("cheerio");
// import Queue from "./lib/queue"


// Declaration
const get = function (url: string) {
    return new Promise((resolve, reject) => {
        superagent.get(url).end((error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
};

// Variables
// const searched: {[index: string]: boolean} = {};


// Execute
(async () => {

    const test = await get("http://localhost:8000/");
    console.log(test);

})();



/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * c-hanging-comment-ender-p: nil
 * End:
 */

