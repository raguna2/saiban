# CI

ChecksはPR、mainへのpush、手動実行で動きます。公開リポジトリで無料のGitHub標準Ubuntuランナーを使うため、Macが停止していても実行できます。

Node.js 22.21.1で次を実行します。

```sh
node --test .github/tests/site.test.mjs
```

HTML内のJavaScriptとFirebase設定の構文、判例データの必須項目と出典URLの重複、検索・絞り込み・解除の処理を確認します。画面表示とFirebaseへのデプロイは含みません。UI変更時はテスト結果に加えてスクリーンショットまたは操作動画をPRに添付します。

外部npm依存がないためnpm installとnpm auditは実行しません。GitHubの成果物アップロードとキャッシュ保存も使いません。毎月Node.jsと使用するActionsを確認し、セキュリティ更新を優先します。
