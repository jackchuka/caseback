# Caseback

機械式時計の仕組みを、フォトリアルな3Dで解説するウェブサイト。最初のキャリバーはETA 2824-2。

## 開発

    npm install
    npm run dev        # http://localhost:5173
    npm test           # Vitest（運動学・データ・形状・i18n・URL）
    npm run e2e        # Playwright フルスイート
    npm run e2e:quick  # 主要シナリオのみ（@quick）。日々の変更確認に
    npm run e2e:fast   # dist/ が src/・data/ より新しければビルドを省略してフルスイートを実行
    npm run build

`E2E_PORT`（既定 4173）でプレビューのポートを、`E2E_WORKERS`（既定 2）で並列数を上書きできる。並行して動く別チェックアウトとポートが衝突する場合などに使う。

## 構成

- `data/calibers/<id>/caliber.ts` — キャリバー定義（部品・歯数・噛み合い・ツアー・出典）。読み込み時にzodで検証
- `src/kinematics` — 歯数比のグラフと脱進機から、各部品の角度を計算
- `src/geometry` — 歯車・ガンギ車・アンクル・テンプ・受けの手続き生成
- `src/scene` — React Three Fiberの描画・カメラ・演出
- `src/ui` — 解説パネル・ツアーバー・ドック
- `src/content/{ja,en}` — 文言

## キャリバーを追加する

1. `data/calibers/<id>/caliber.ts` を作り、`Caliber` を default export する
2. 出典で確認できない値は `provenance.confidence: 'estimated'` にする
3. `src/content/{ja,en}/<id>.json` に章・ステップ・部品の文言を足す
4. `npm test` で不変条件（歯数比、中心距離、翻訳の網羅）が通ることを確認する
