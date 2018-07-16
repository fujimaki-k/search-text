# search-text
指定された URL（url）を起点として URL を辿り、指定された文字列（word）が出現する URL までの最短経路を出力します。

オプションの設定によっては、対象のサーバーにかなりの負荷をかけてしまう可能性があります。
第三者のサーバーに対して実行する際は、同時アクセス数や、リクエスト間隔に注意してください。

また、自身が管理するサーバーに対して実行する場合にも ```--allow-domain``` オプションを指定して、第三者のサーバーにアクセスしないようにすることを推奨します。


## 動作環境
Node.js の次のバージョンで動作を確認しています。
async/await の機能を利用しているため Node.js 8.0.0 以上のバージョンを使用してください。

| 名前    | バージョン |
|:--------|:-----------|
| Node.js | 8.11.3     |
| npm     | 5.6.0      |


## インストール
### 1. プログラムの取得
任意のディレクトリで ```git clone``` を実行して、プログラムを取得してください。

```bash
git clone https://github.com/fujimaki-k/search-text.git
```

### 2. 必要なモジュールのインストール
```package.json``` のあるディレクトリで次のコマンドを実行して、必要なモジュールをインストールします。

```bash
npm install
```


## プログラムの使い方
```
node index.js index.js [-h] [-v] [-i] [-m] [-n] [-c CONNECTIONS] [-w WAIT] [-d DEPTH] [-a ALLOW_DOMAIN] url word

必須パラメーター
    url     検索を開始する URL です
    word    検索対象の文字列です

オプション
    -i, --ignore-case                               文字列を探す際に、大文字と小文字を区別しないようにするオプションです
    -m, --multiline                                 文字列を探す際に、複数行でのマッチングを行います
    -n, --normalize                                 文字列を探す前に、対象の HTML ドキュメントと、検索対象の文字列を正規化します。
    -c CONNECTIONS, --connections CONNECTIONS       最大で幾つの URL を同時に開くかを指定します（デフォルト：1）
    -w WAIT, --wait WAIT                            HTTP リクエストを行う間隔をミリ秒で指定します
                                                    同時に複数の URL を開いている場合は、接続毎の間隔になります。
    -d DEPTH, --depth DEPTH                         検索を開始した URL から、ここ指定された階層まで辿っても文字列がみつからない場合に、処理を中止します。
    -a ALLOW_DOMAIN, --allow-domain ALLOW_DOMAIN    アクセスを許可するドメインを指定します
                                                    ドメインを指定すると、指定されたドメインのみが検索の対象になり、他のドメインへはアクセスされません
                                                    このオプションは、複数指定することができます。
```

### 使用例
[Wikipedia](https://ja.wikipedia.org/) にある「[ラブライブ！](https://ja.wikipedia.org/wiki/%E3%83%A9%E3%83%96%E3%83%A9%E3%82%A4%E3%83%96!)」のページを開き「EmiRing」の文字を検索する例です。

下の例では、同時に 5 件の接続を開き、接続毎に 0.5 秒に 1 回の間隔でアクセスします。
また「ja.wikipedia.org」のドメイン以外にはアクセスしないようにしています。
結果が出るまで、短くても 30 秒程度の時間がかかります。

```bash
node ./index.js -c 5 -w 500 -a 'ja.wikipedia.org' 'https://ja.wikipedia.org/wiki/%E3%83%A9%E3%83%96%E3%83%A9%E3%82%A4%E3%83%96!' 'EmiRing'
```


## Docker を使った動作環境
環境構築が難しい場合には Docker を使った動作環境を用意しているのでご利用ください。
詳しくは [search-text-devops](https://github.com/fujimaki-k/search-text-devops) のリポジトリにある [README.md](https://github.com/fujimaki-k/search-text-devops/blob/master/README.md) を参照してください。
