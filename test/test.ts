/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/* eslint-env es6, mocha, node */
/* eslint-extends: eslint:recommended */
'use strict';



// Import modules
import http = require("http");
import path = require("path");
import expect = require("expect.js");
import express = require("express");
import Client from "../lib/client";
import Document from "../lib/document";
import Search from "../lib/search";


// Variables
let server: http.Server;
const application = express();
const port = 8080;
const host = "localhost";
const base_url = `http://${host}:${port}`;
application.use(express.static(path.resolve(__dirname, "./html")));


// Hooks
before((done) => {
    server = application.listen(port, () => {
        done();
    });
});

after(() => {
    server.close();
});


// Test
describe("test", () => {
    describe("Client", () => {
        it("Should get response", async () => {
            const client = new Client();
            const result = await client.get(base_url);

            expect(result.statusCode).to.be(200);
            expect(result.text).to.be.a("string");
        });

        it("Should get error response", async () => {
            const client = new Client();
            try {
                await client.get(`${base_url}/not_found.html`);
            } catch (error) {
                expect(error.response.status).to.be(404);
                expect(error.message).to.be("Not Found");
            }
        });
    });

    describe("Document", () => {
        it("Should get document", async () => {
            const client = new Client();
            const response = await client.get(base_url);
            const document = new Document(response.text);

            expect(document.hasString("μ's")).to.be(true);
            expect(document.hasString("Printemps")).to.be(false);
            expect(document.getLinks()).to.eql(["./muse.html", "./aqours.html"]);
        });

        it("Should not get links", async () => {
            const client = new Client();
            const response = await client.get(`${base_url}/empty.html`);
            const document = new Document(response.text);

            expect(document.getLinks()).to.eql([]);
        });
    });

    describe("search", () => {
        it("Should find data", async () => {
            const search = new Search();
            const result = await search.search(base_url, "printemps");

            console.log(result);
        });
    });
});



/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * c-hanging-comment-ender-p: nil
 * End:
 */

