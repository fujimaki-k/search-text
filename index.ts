/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/* eslint-env es6, mocha, node */
/* eslint-extends: eslint:recommended */
'use strict';



// 必要なモジュールのインポート
import path = require("path");
import Argparse = require("argparse");
import Search from "./lib/search";


// 変数の宣言
const meta = require(path.resolve(__dirname, "package.json"));


// コマンドライン引数をパースする
const parser = new Argparse.ArgumentParser({
    version: meta.version,
    description: meta.description
});
parser.addArgument(["-i", "--ignore-case"], {
    action: "storeConst",
    constant: true,
    defaultValue: false,
    help: "大文字、小文字を区別せずにマッチングを行う"
});
parser.addArgument(["-m", "--multiline"], {
    action: "storeConst",
    constant: true,
    defaultValue: false,
    help: "複数行でのマッチングを行う"
});
parser.addArgument(["-n", "--normalize"], {
    action: "storeConst",
    constant: true,
    defaultValue: false,
    help: "マッチングを行う前に HTML ドキュメントと、検索対象の文字列を正規化する"
});
parser.addArgument(["-c", "--connections"], {
    action: "store",
    defaultValue: 1,
    help: "最大コネクション数（デフォルト：1）"
});
parser.addArgument(["-w", "--wait"], {
    action: "store",
    defaultValue: 0,
    help: "HTTP のリクエストを送る間隔（ミリ秒）"
});
parser.addArgument(["-d", "--depth"], {
    action: "store",
    defaultValue: 0,
    help: "リンクを辿る最大のステップ数"
});
parser.addArgument(["-a", "--allow-domain"], {
    action: "append",
    defaultValue: [],
    help: "リクエストを許可するドメイン（複数指定可能）"
});
parser.addArgument("url", {help: "検索を開始する URL"});
parser.addArgument("word", {help: "検索対象の文字列"});
const config = parser.parseArgs();


// Execute
(async () => {
    const search = new Search(config.url, {
        connections: config.connections,
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
        console.log(`ステップ: ${result.step}`);
        console.log("経路:");
        result.stack.forEach((path: string, index: number) => {
            console.log(`\t${index + 1}: ${path}`);
        });
    } else {
        console.error("指定された文字列が見つかりませんでした。");
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
