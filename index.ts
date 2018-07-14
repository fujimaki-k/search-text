/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/* eslint-env es6, mocha, node */
/* eslint-extends: eslint:recommended */
'use strict';



// Import modules
import path = require("path");
import Argparse = require("argparse");
import Search from "./lib/search";


// Variables
const meta = require(path.resolve(__dirname, "package.json"));


// Argument parser
const parser = new Argparse.ArgumentParser({
    version: meta.version,
    description: meta.description
});
parser.addArgument(["-i", "--ignore-case"], {
    action: "storeConst",
    constant: true,
    defaultValue: false,
    help: "Ignore case"
});
parser.addArgument(["-m", "--multiline"], {
    action: "storeConst",
    constant: true,
    defaultValue: false,
    help: "Enable multiline matching"
});
parser.addArgument(["-n", "--normalize"], {
    action: "storeConst",
    constant: true,
    defaultValue: false,
    help: "Normalize word and document before matching"
});
parser.addArgument(["-w", "--wait"], {
    action: "store",
    defaultValue: 0,
    help: "Wait time before HTTP request"
});
parser.addArgument(["-d", "--depth"], {
    action: "store",
    defaultValue: 0,
    help: "Max depth of documents"
});
parser.addArgument(["-a", "--allow-domain"], {
    action: "append",
    defaultValue: [],
    help: "Domain list of allow accessing"
});
parser.addArgument("url", {help: "Base URL"});
parser.addArgument("word", {help: "Search word"});
const config = parser.parseArgs();


// Execute
(async () => {
    const search = new Search(config.url, {
        depth: config.depth,
        domains: config.domains,
        normalize: config.normalize,
        wait: config.wait
    });

    const result = await search.search(config.word, {
        ignoreCase: config.ignore_case,
        multiline: config.multiline
    });

    if (result) {
        console.log(`Steps: ${result.step}`);
        console.log("Path:");
        result.stack.forEach((path: string, index: number) => {
            console.log(`\t${index + 1}: ${path}`);
        });
    } else {
        console.error("Not found");
        process.exit(100);
    }
})();



/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * c-hanging-comment-ender-p: nil
 * End:
 */

