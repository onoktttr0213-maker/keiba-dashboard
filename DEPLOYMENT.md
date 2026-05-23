# Keiba Dashboard Deployment Guide

このダッシュボードをインターネット上で公開（HTTPS化）するための手順です。
現在は静的なHTML/JS構成になっているため、サーバー代のかからない無料ホスティングサービスを利用するのが最適です。

**推奨: Vercel または GitHub Pages**

## ⚠️ 公開に関する重要な注意点

1.  **データ更新の仕組み**
    *   **現状**: あなた自身のブラウザ(LocalStorage)にあるデータは、訪問者には見えません。
    *   **対策済み**: 今回の対応で、現在のデータを `public_test/data/db.json` に書き出しました。訪問者はこのファイルを読み込みます。
    *   **今後の更新**: サイトのデータを更新したい場合は、手元のPCでCSVを `public_test/data/累月.csv` に上書きするか、Admin画面からデータをロードして再度 `db.json` を生成・配置してデプロイし直す必要があります。

3.  **禁止事項**
    *   `public` という名称のフォルダは Vercel デプロイに支障が出るため使用を停止しました。今後は `public_test` を使用してください。

2.  **セキュリティ**
    *   `admin.js` 内のパスワード（`0000`）は、**ソースコードを見れば誰でもわかります**。
    *   Adminページは、あくまで「ローカルでデータをプレビューするためのツール」として扱い、重要な個人情報や変更されては困るデータを置かないでください（今回の仕組みでは、訪問者はデータを書き換えられないので、サイトが荒らされる心配はありません）。

---

## 手順A: Vercelで公開する（最も簡単・推奨）

ドラッグ＆ドロップだけで公開できます。

1.  [Vercel](https://vercel.com/) にアクセスし、アカウント作成（Sign Up）。
2.  Dashboardの「Add New...」→「Project」を選択。
3.  **Import Git Repository** が推奨ですが、Gitを使わない場合は Vercel CLI を使うか、以下の「手動アップロード」手順を行います。
    *   ※VercelのWeb画面からは、通常Gitリポジトリとの連携が求められます。
    *   フォルダごとアップロードする場合、[Vercel CLI](https://vercel.com/docs/cli) をインストールして、コマンドラインで `vercel` と打つのが一番早いです。

**Vercel CLIを使う場合:**
1.  Node.jsをインストールしている場合、ターミナルで `npm i -g vercel` を実行。
2.  このプロジェクトのフォルダで `vercel login` → `vercel` を実行。
3.  いくつかの質問に Enter で答えるだけでHTTPS URLが発行されます。

## 手順B: GitHub Pagesで公開する

1.  [GitHub](https://github.com/) アカウントを作成。
2.  新しいリポジトリ（Repository）を作成（Public設定）。
3.  このフォルダ内のファイルを全てアップロード（または `git push`）。
4.  リポジトリの「Settings」→「Pages」へ移動。
5.  Branchを `main` (または `master`) に設定して Save。
6.  数分待つと、`https://[username].github.io/[repo-name]/` で公開されます。

## 手順C: Netlify Drop（登録不要でテスト）

1.  [Netlify Drop](https://app.netlify.com/drop) にアクセス。
2.  `keiba-dashboard` フォルダごとブラウザにドラッグ＆ドロップ。
3.  即座にHTTPSのURLが発行されます（URLはランダムになります）。

---

## 運用更新フロー

1.  週末の競馬が終わる。
2.  手元のPCで `admin.html` を開き、CSVをアップロードして確認。
3.  **（ここが重要）** 最新のデータ状態にするため、以下のいずれかを行います：
    *   **方法1**: `public_test/data/累月.csv` を最新のCSVファイルで上書きする。
    *   **方法2**: `public_test/data/db.json` を最新のデータ（JSON形式）に更新する。
4.  変更したファイルを再度デプロイ（Vercelなら再度 `vercel` コマンド、GitHubなら `git push`）。
