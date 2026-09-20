# FISH LOG v1

釣れた瞬間を、データにする。スマートフォンを優先した、自分だけの釣果記録アプリです。

## 公開環境

- アプリ: https://fish-log-psi.vercel.app
- データ・ログイン・写真: SupabaseのFISH LOG専用プロジェクト（東京リージョン）
- ログイン: アプリ画面でメールアドレスを入力し、届いたリンクを開きます。釣果、釣行、釣り場、写真はログインした本人のみ閲覧できます。
- GitHubにはSupabaseの公開用接続設定を含む実際の環境変数や、データベースのパスワードを保存していません。Vercelの環境変数はProduction、Preview、Developmentに設定済みです。

本番ではSupabaseに接続します。環境変数がないローカル開発時だけ、画面に「デモモード」と表示してブラウザ内に保存します。

## はじめる

```bash
npm ci
npm run dev
```

`http://localhost:3000` を開きます。`.env.local` がない場合は明示的に **デモモード** で動き、データはそのブラウザの `localStorage` にだけ保存されます。実データやSupabaseと同期されません。写真は縮小してブラウザ内に保存します。ブラウザのデータを削除すると失われます。

### Supabaseを接続する

1. Supabaseでプロジェクトを作成し、SQL Editorで [`supabase/migrations/202609200001_init.sql`](supabase/migrations/202609200001_init.sql) を実行します。3テーブルのRLSとprivateの写真Storageが設定されます。
2. AuthenticationでEmail（OTP / Magic Link）を有効にし、Site URLをアプリのURLに設定します。開発時は `http://localhost:3000` をRedirect URLsに追加します。
3. `.env.example` を `.env.local` にコピーし、Supabase Project URLとanon/publishable keyを入力します。service role keyはブラウザ用環境変数に入れません。
4. 開発サーバーを再起動し、メールのログインリンクで認証します。

```bash
cp .env.example .env.local
npm run dev
```

`npm run typecheck`、`npm run lint`、`npm run build` で検証できます。GPS、カメラ、PWAのインストールはHTTPS環境またはlocalhostで確認してください。

## 実装内容

| フェーズ | 主な実装 | 主なファイル | 検証 | 残る確認 |
|---|---|---|---|---|
| ① 基盤・PWA・Auth | Next.js App Router、TypeScript、Tailwind、モバイルナビ、Magic Link、デモモード、manifest、Service Worker | `src/app/layout.tsx`, `src/components/Shell.tsx`, `src/lib/store.tsx`, `public/` | 型・lint・ビルド、デスクトップと390px表示 | 実機インストールとSupabaseメール認証 |
| ② DB・RLS・Storage | 個人別RLS、所有者が一致する関連付け、private写真、サイズと形式の制限 | `supabase/migrations/202609200001_init.sql`, `supabase/config.toml` | 本番migration適用、2ユーザーで分離・写真の非公開を確認 | 利用者自身によるログイン確認 |
| ③ Home・釣果 | CTA押下時刻の確定、クイック登録、一覧・検索・詳細、写真 | `src/app/page.tsx`, `src/app/catch/new/page.tsx`, `src/app/catches/` | デモで登録→一覧反映、本番private Storageへの一時ユーザーによる写真アップロード | 利用者自身の写真登録 |
| ④ 釣行・カレンダー | 釣行開始と終了、0匹の「ボウズ」保存、日別表示 | `src/app/sessions/`, `src/app/calendar/` | デモで0匹終了→ボウズ表示、本番DBへの書き込み権限を確認 | 利用者自身の釣行登録 |
| ⑤ 月・天気・潮 | GPS、登録釣り場判定、気象庁239地点から最寄り選択、潮位補間、月齢近似、Open-Meteo | `src/lib/geo.ts`, `src/lib/moon.ts`, `src/lib/providers.ts`, `src/app/api/` | 東京の潮位・天気APIを実リクエストで確認 | 他の観測地点と年境界の追加検証 |
| ⑥ 分析 | 時間帯、魚種、潮別の過去記録集計。因果を断定しない文言 | `src/app/analysis/` | ビルド・画面表示 | 記録量が多い場合の使用感 |
| ⑦ レスポンシブ・エラー | iPhone幅の配置、取得失敗時も釣果保存、保存エラー表示、PWAアイコン | `src/app/globals.css`, `public/` | 390px表示、位置取得失敗下の釣果保存 | iPhone Safari実機とオフライン動作 |

## データの扱い

- 「釣れた！」のクリック時に`caught_at`を固定します。GPSと外部データ取得はその後です。直接登録画面を開いた場合は画面表示時刻を使います。
- 位置取得に失敗した場合は手動で選んだ釣り場の座標を天気・潮汐の取得に使います。実GPS座標は取得できなければ `null` のまま保存します。
- 天気・潮位が取れなくても釣果を保存し、`snapshot.warnings`に欠落を記録します。月齢と照度は近似値です。
- 潮位は[気象庁の潮位表テキストデータ](https://www.data.jma.go.jp/kaiyou/db/tide/suisan/readme.html)の毎時予測値を線形補間します。実測値ではありません。地点一覧は2026年の気象庁掲載地点から生成しました。
- 天気は[Open-Meteo Forecast API](https://open-meteo.com/en/docs)の釣れた時刻に最も近い毎時予報値です。実測値ではありません。
- ログイン中はユーザー本人のデータだけをRLSで読み書きします。写真はprivate bucketに保存し、閲覧時に短時間の署名付きURLを発行します。

v1にはAI釣果予測、SNS、公開共有、ランキング、課金、広告、ネイティブアプリを含めません。
