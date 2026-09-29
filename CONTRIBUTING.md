# Caseback に参加する

Caseback は、機械式時計のムーブメントを実寸で組み直し、正しく動かして見せる図鑑です。いちばん大事にしているのは正確さです。コードが書けなくても手伝えることはたくさんあります。

*English: Issues and PRs in English are welcome. The easiest ways to help are requesting a watch and correcting estimated values with a source.*

## 何から手伝えるか

易しい順に並べています。

| | 内容 | 必要なもの | 方法 |
| --- | --- | --- | --- |
| 1 | 時計のリクエスト | なし | [Issue](../../issues/new?template=watch-request.yml) |
| 2 | 推定値の出典、値の訂正 | 時計の知識 | [Issue](../../issues/new?template=correction.yml) か PR |
| 3 | 解説文・翻訳の改善 | JSON の編集 | PR |
| 4 | 時計の追加（既存のキャリバー） | TypeScript、three.js | 先に Issue で相談 → PR |
| 5 | キャリバーの追加 | 上記に加え、時計の機構 | 先に Issue で相談 → PR |

### 1. 時計のリクエスト

型番と写真の出典があれば十分です。すでにあるリクエストには 👍 を付けてください。次に作る時計を選ぶときに参考にします。

### 2. 推定値を確かな値にする

歯数などの値の多くはメーカーが公表していません。Caseback はそうした値を**推定値**としてサイトに明示しています。コード上では `estimated(...)` がそれにあたります。

```sh
grep -rn "estimated(" data/calibers
```

技術資料、パーツカタログ、分解時の実測など、確かな出典があれば教えてください。PR で直す場合は次のようにします。

- 出典を `sources` に足し、`estimated('…')` を `sourced('<source-id>')` に置き換える
- `npm test` を通す（歯数比や中心距離の不変条件が崩れていないかを確認できます）

### 3. 解説文・翻訳

文言は `src/content/{ja,en}/` にあります。キーは両言語で揃っている必要があり、欠けているとテストが落ちます。

### 4. 時計を追加する

既存のキャリバーを載せた時計の外装を、実機の写真に合わせて作ります。作業量が多いので、**着手前に Issue で一声かけてください**。重複を避けられます。

手順は [docs/adding-a-watch.md](docs/adding-a-watch.md) にすべて書いてあります。守ってほしい方針は次のとおりです。

- ロゴとブランドの文字は再現しない。数字や目盛りなど、意匠の一部である印刷は残す
- 寸法には出典を付ける。写真から読み取った値は比較画面で実測する
- 参考写真はリポジトリに入れない（`reference/` は gitignore されています）。出典の URL を `shots.ts` に書く
- PR には `npm run compare` の重ね合わせ画像を貼る

### 5. キャリバーを追加する

部品、歯数、噛み合い、ツアーを `data/calibers/<id>/caliber.ts` に定義します。規模が大きいので、まず Issue で資料と方針を相談させてください。README の「追加する」の節も参照してください。

## 開発

Node.js 22 以上が必要です。

```sh
npm install
npm run dev        # http://localhost:5173
npm run typecheck
npm run lint
npm test
```

E2E（`npm run e2e`）は GPU の使える Chrome が必要で、CI では回していません。手元で回せない場合は、スクリーンショットを PR に貼ってもらえれば大丈夫です。

## PR の約束事

- コミットメッセージは [Conventional Commits](https://www.conventionalcommits.org/) 形式（例 `fix(eta-2824-2): third wheel has 75 teeth per the parts catalogue`）
- 1つの PR に1つの話題
- 値を変えたら出典を、文言を変えたら両言語を

## ライセンス

コントリビュートいただいたものは、コードは [MIT](LICENSE)、`src/content/` の解説文と `public/thumbs/` の画像は [CC BY-SA 4.0](LICENSE-CONTENT) で公開されます。
