街えらび案内所「暮らし別に駅を探す」入口ページ更新

現在公開中のサイトの同じ階層に、このZIPの public/ の中身を上書きしてください。
対象は public/themes/index.html と public/assets/interface-v34.css です。
その後、通常どおり Cloudflare Worker を再デプロイしてください。

scripts/ と tests/ は次回の再生成時にも変更が残るようにする編集元です。
既存ファイルを消したり、ZIPの中身だけを新しい公開フォルダにしないでください。

変更内容：3つの過ごし方から8テーマへ進む入口、候補数、見方の手順、確認状況へのリンク。
確認：npm run build、npm run check（54テスト）を通過。
