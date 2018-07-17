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
describe("search-text", () => {
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
        it("Should include string", async () => {
            const client = new Client();
            const response = await client.get(base_url);
            const document = new Document(response.text);

            expect(document.hasString("μ's")).to.be(true);
        });

        it("Should not include string", async () => {
            const client = new Client();
            const response = await client.get(base_url);
            const document = new Document(response.text);

            expect(document.hasString("Printemps")).to.be(false);
        });

        it("Should get links", async () => {
            const client = new Client();
            const response = await client.get(base_url);
            const document = new Document(response.text);

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
        describe("Should find string", () => {
            it("Default", async () => {
                const search = new Search(base_url);
                const result = await search.search("Printemps");

                expect(result.url).to.be(`${base_url}/honoka.html`);
                expect(result.depth).to.be(3);
                expect(result.stack).to.eql([
                    `${base_url}`,
                    `${base_url}/muse.html`,
                    `${base_url}/honoka.html`
                ]);
            });

            it("Ignore case", async () => {
                const search = new Search(base_url);
                const result = await search.search("printemps", {
                    ignoreCase: true
                });

                expect(result.url).to.be(`${base_url}/honoka.html`);
                expect(result.depth).to.be(3);
                expect(result.stack).to.eql([
                    `${base_url}`,
                    `${base_url}/muse.html`,
                    `${base_url}/honoka.html`
                ]);
            });

            it("Normalize search words", async () => {
                const search = new Search(base_url, {
                    normalize: true
                });
                const result = await search.search("Ｈｏｎｏｋａ");

                expect(result.url).to.be(`${base_url}/muse.html`);
                expect(result.depth).to.be(2);
                expect(result.stack).to.eql([
                    `${base_url}`,
                    `${base_url}/muse.html`
                ]);
            });

            it("Normalize document", async () => {
                const search = new Search(`${base_url}/unnormalized.html`, {
                    normalize: true
                });
                const result = await search.search("Printemps");

                expect(result.url).to.be(`${base_url}/unnormalized.html`);
                expect(result.depth).to.be(1);
                expect(result.stack).to.eql([`${base_url}/unnormalized.html`]);
            });
        });

        describe("Should not find string", async () => {
            it("Not matched", async () => {
                const search = new Search(base_url);
                const result = await search.search("printemps");

                expect(result).to.be(null);
            });

            it("Max depth exceeded", async () => {
                const search = new Search(base_url, {
                    depth: 2
                });
                const result = await search.search("Printemps");

                expect(result).to.be(null);
            });

            it("Not allowed domain", async() => {
                const search = new Search(base_url, {
                    domains: [
                        "otonokizaka.ac.jp",
                        "www.otonokizaka.ac.jp"
                    ]
                });
                const result = await search.search("Printemps");

                expect(result).to.be(null);
            });

            it("Unnormalized document", async () => {
                const search = new Search(`${base_url}/unnormalized.html`);
                const result = await search.search("Printemps");

                expect(result).to.be(null);
            });
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

