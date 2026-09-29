# 時計を追加する

新しい時計の外装を、実機の写真に合わせて作る手順。見本は `data/watches/tudor/heritage-black-bay-79220b/`（丸型ダイバー）、`data/watches/sinn/556/`、`data/watches/hamilton/khaki-field-auto-h70455553/`、`data/watches/hamilton/ventura-xxl-auto-h24655331/`（丸くないケース）、`data/watches/sinn/103-st-sa/`（クロノグラフ）。

## 方針

- 意匠は実機に忠実に再現する。**ロゴと文字は入れない**（ブランド名、ロゴマーク、文字盤や裏蓋の文字）。数字や目盛りなど、意匠の一部である印刷は残す。
- 寸法は公表値（ブランドのページやレビュー）を出典付きで使う。写真から読み取る値は、比較画面で実測する。
- 値の出どころはすべて `params.ts` のコメントに書く。
  - `spec`: 公表値
  - `photo:<ショットid>`: 写真から実測した値
  - `est`: 推定値
- 完了の基準: 正面ショットで、ケース、ベゼル、ラグ、リューズの縁が写真と **約3 px 以内**で重なること。斜めのショットは遠近法の歪みがあるので、特徴が合っているかで判断する。

## ファイル構成

```
data/watches/<brand>/<model>/
  watch.ts      メタデータ（WatchSchema）: id、brand、model、reference、caliberId、caliberNotes、movement、sources
  exterior.ts   ビルダー（ExteriorBuilder）。default export
  params.ts     寸法の定数（出典タグ付き）
  shots.ts      比較用の写真の定義（Shot[]）
  case.ts / bezel.ts / dial.ts / hands.ts / crown.ts / strap.ts or bracelet.ts / materials.ts …  部品ごと
  *.test.ts     部品ごとのテスト
src/content/{en,ja}/watches.json   時計の説明文（<id>.summary）
reference/<brand>/<model>/         参考写真（gitignore。リポジトリには入れない）
```

`data/watches/index.ts` は `watch.ts` と `exterior.ts` を自動で読み込む。どちらかが欠けるとエラーになる。

## ビルダーの契約（src/scene/exterior/contract.ts）

`ExteriorBuilder` は `{ geometry, materials }` の組。

- `geometry(ctx)`: `{ parts, anchors }` を返す。`ctx.movement`（MovementFrame）はムーブメントの高さや窓の位置を持つ（`frontZ`、`dialZ`、`secondsZ`、`stemZ`、`plateFrontZ`、`rotorBackZ`、`dateWindow`、`dayWindow`、`extraHands`、`pushers`）。
  - **Web Worker で実行される**ので、DOM と canvas には触れない。canvas テクスチャは `materials` 側で作る。
  - ジオメトリの属性はインターリーブしない。インターリーブした属性があると `transfer.ts` がエラーを出す。
- `materials()`: `Record<string, () => THREE.Material>`。遅延生成にする。
- `parts`:
  - `case`、`bezel`、`dial`、`crystal`、`strap`、`caseback`、`crown`、`hands`（`hour`、`minute`、`seconds`。必要に応じて `extra`）、`pushers`（クロノグラフのみ）。
  - 空の配列でもよい。
- `anchors`: `{ seatRadius, crownX, caseBackZ, casebackTurns }`
  - `casebackTurns`: ねじ込み式の丸い裏蓋は `true`。ねじで留めて持ち上げるだけのものは `false`。
- 守ること:
  - ケースの中心はムーブメントの中心に合わせる。文字盤は −Z 側。
  - リューズは巻き真の軸上に置く。リューズのローカル座標は +Y がケース側。
  - **針はムーブメントの素材だけを使う**（`steel`、`lume`、`blued`、`ruby` など）。文字盤の夜光は別キー `dial-lume` にして、`lumeMaterial()`（`src/scene/lume.ts`）で作る。針の `lume` と同じ素材になる。
  - 風防とガラスの裏蓋には `glass(thickness)`（`src/scene/exterior/kit/glass.ts`）を使う。transmission の素材は使わない。
  - 日付と曜日の円盤の色を時計ごとに変える場合は、自前の `date` と `day` の素材（MeshPhysicalMaterial）を用意する。
  - ケースのメッシュが閉じていることを、自分のテストで確かめる（`kit/meshCheck`）。

共通の部品は `src/scene/exterior/kit/` にある。

| ファイル | 中身 |
|---|---|
| `sdf` | `polygonSdf`、`extrudeProfile` など |
| `surfaceNets`、`outline`、`field2d` | 形状の生成と輪郭の追跡 |
| `lathe`、`crease` | 回転体と、その折れ目 |
| `caseback` | 中空の裏蓋 |
| `crown` | フルートのあるリューズ |
| `crystal` | 平らな風防とドーム型の風防 |
| `dial` | 窓のある文字盤 |
| `hands` | 針の枠と夜光の板 |
| `bracelet` | 3連と H リンク |
| `bend` | 手首に沿う曲げ |
| `polish`、`canvas`、`flutes`、`glass` | 仕上げ、Canvas テクスチャ、ローレット、ガラス素材 |

## 手順

1. **調べる**: 寸法（径、厚さ、ラグ・トゥ・ラグ、ラグ幅）と、各部品の特徴を出典付きで集める。
2. **写真を集める**: 正面（できるだけ真正面）、斜め、リューズ側の写真を `reference/<brand>/<model>/` に保存する。出典の URL は `shots.ts` に書く。
3. **`shots.ts` を書く**: `{ id, file, sourceUrl, view, time, camera: { mmPerPx, center, rotation } }` の形。
   - `mmPerPx` は、写真上のケース径やベゼル径から求める。
   - `time` は写真の針が示す時刻。
4. **部品を作る**: テスト駆動で、部品ごとにテストを書く。`params.ts` の値を使い、既存の時計のテストの粒度を参考にする。
5. **`exterior.ts` でまとめる**。
6. **比較画面で合わせる**:
   ```
   npm run dev
   # http://localhost:5173/dev/compare/<brand>/<model>?shot=front （mode=overlay|model|side|diff、theme=dark|light）
   npm run compare -- <brand>/<model> [shot-id]
   # → test-results/compare/<slug>-shot-<id>-{model,overlay}.png
   ```
   - ショットを指定すると、そのショットだけを撮る（約12秒）。
   - `test-results/` は Playwright の実行のたびに消えるので、残したい画像は別の場所にコピーする。
   - 並行して別のチェックアウトで作業するときは、`COMPARE_PORT` でポートを変える。
   - ずれた量（px × `mmPerPx`）だけ `params.ts` を直し、`est` のタグを `photo:<ショットid>` に書き換える。
   - 形そのものが違う場合は、部品のコードを直して、その形をテストで固定する。
7. **説明文**: `src/content/en/watches.json` と `src/content/ja/watches.json` に `<id>.summary` を追加する。
8. **e2e**: `e2e/tour.spec.ts` を更新する。
   - ホームの時計の数と、キャリバーごとの時計の数を合わせる。
   - 新しい時計を `@quick` の「文字盤が開く」ループに加える。
   - 裏蓋がガラスなら、その確認にも加える。
9. **確認**:
   ```
   npm run typecheck
   npm test
   npm run e2e
   ```
   契約テスト（`contract.test.ts`）と Worker への受け渡しのテスト（`transfer.test.ts`）は、すべての時計に対して自動で走る。

## キャリバーがまだない場合

時計より先に、キャリバーの追加が必要になる。見本は `data/calibers/seiko-nh35a/` と `data/calibers/valjoux-7750/`。

- 部品、噛み合い、ツアー、出典を定義する。
- 高さの表 `H` を用意する。全高は公表値に合わせ、ローターを含める。
- 本文は `src/content/{en,ja}/<caliber-id>.json` に書く。
- `caliber.exterior`（`frontZ`、`secondsZ`）を設定する。
- 運動学のテストを書く。比、巻き上げ、日付を確かめる。
