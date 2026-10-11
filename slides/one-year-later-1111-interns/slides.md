---
routerMode: hash
theme: default
title: "1年後の振り返り: 1.1.1.1 人のインターンが生んだ力"
info: |
  One year later: the power of 1.1.1.1 interns の解説スライド。
  原文: https://blog.cloudflare.com/one-year-later-1111-interns/
class: text-center
highlighter: shiki
drawings:
  persist: false
transition: slide-left
mdc: true
lineNumbers: true
themeConfig:
  primary: '#f6821f'
---

# 1年後の振り返り

1.1.1.1 人のインターンが生んだ力

Birthday Week 2026 / インターン / 早期キャリア

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/one-year-later-1111-interns/<br>
公開日: 2026-10-05
</div>

---

# TL;DR

- 1 年前、他社が若手採用を絞る中、「2026 年に<strong>最大 1,111 人</strong>のインターンを採用」と宣言した
- 賭けの前提は「AI によって、早期キャリアの人材はより価値が高まり、より早く影響を出せる」
- 現在は目標に向けて進行中で、<strong>9 拠点・48 チーム・750 件</strong>のインターンシップを実施
- 今年はインターン自身が記事を書いた。Cache Transcoding、EmDash、ポスト量子の可視化、BGP の ORIGIN 属性など
- 多くのインターンが、フルタイムとして戻ってくる

---

# アジェンダ

- 背景: 若手採用を絞る流れと、Cloudflare の賭け
- 規模と仕事の範囲
- AI ネイティブなインターン
- インターンが出荷したもの
- コミュニティと、これから

---

# 背景: 逆を向いた賭け

<div class="text-left text-sm pt-2">

- 1 年前、多くの企業がインターンや新卒の採用を減らしていた
- Cloudflare は逆に、最大 1,111 人（1.1.1.1 にちなんだ数）のインターン採用を宣言した

<div class="mt-6 p-4 border rounded">

AI は人が学ぶ速さ、試す数、挑む問題の難しさを引き上げる。一方で、新しい人が持ち込むエネルギー・好奇心・新鮮な視点は、AI が補ってくれない。

</div>

- 1 年後の現在、インターンは社内チームと数百万の顧客に向けて出荷している
- このブログが動く EmDash の 2 人目のメンテナも、今夏にインターンとして入社した人

</div>

---

# 規模

<div class="text-sm">

| 項目 | 内容 |
|---|---|
| 目標 | 2026 年に最大 1,111 人（進行中。採用も継続） |
| 実績 | 750 件のインターンシップ |
| チーム | 48 チーム |
| 拠点 | Austin、San Francisco、London、Lisbon、New York、Singapore、Bengaluru、Washington DC、Sydney の 9 拠点 |

</div>

---

# Austin オフィスでの 1 枚

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M40BZX7VK52DNB1P6CE9HGG5.jpg" style="max-height: 360px; margin: 0 auto;" />

<div class="text-xs opacity-60 pt-2">
Cloudflare CEO の Matthew Prince が、Austin オフィスでインターンたちと写る写真<br>
出典: Cloudflare Blog https://blog.cloudflare.com/one-year-later-1111-interns/
</div>

---

# 初日から実際の問題に取り組む

<div class="text-left text-sm pt-2">

- 稼働中のチームに入り、本物の問題を担当する
- 全員に「何かを残す」ことが期待される
  - 出荷した製品改善、より良いプロセス、新しいインフラ、チームの仕事の進め方を変える知見
- 仕事はエンジニアリングにとどまらない

</div>

---

# 職種をまたぐ成果の例

<div class="text-sm">

| 職種 | 取り組み |
|---|---|
| 内部監査 | ISO のコンプライアンス統制のテストと文書化を自動化する AI 支援パイプライン |
| プロダクトマネージャー | Startup Program のクレジット管理を近代化する API・ダッシュボード・移行ツール |
| People チーム（ソフトウェアエンジニアリング） | 新入社員の身元確認ワークフローの改善 |
| カスタマーサポート | ケース説明から、AI でトラブルシューティングコマンドを起動する方法の探索 |

</div>

---

# AI ネイティブなインターン

<div class="text-left text-sm pt-2">

- AI は主題だったが、学習や責任を省く近道ではなかった
- 使い方: 見慣れないコードベースの理解、要件と実装の比較、プロトタイプ、繰り返し作業の自動化、問いから動く解決策までの短縮
- マネージャーとメンターが、方向づけ・判断のレビュー・品質基準の確認を担い続けた

<div class="mt-4 p-4 border rounded">

AI は「スタートラインを前に動かした」。全体像の把握は数週間から数日へ。時間は「何を作るか」「誰が使うか」「正しいとどう分かるか」「本番で何が起きるか」に使える。

</div>

</div>

---

# インターンが書いた記事 1: キャッシュと CMS

<div class="text-left text-sm pt-2">

- <strong>Cache Transcoding（Aashi）</strong>
  - RAM とディスクの価格が急上昇する中、既存サーバーから多くのキャッシュ容量を得る狙い
  - 主要プロキシ内で、適格なアセットを Zstandard で圧縮してからディスクへ書く
  - 初期テストで、ディスク上のサイズが平均で元の 3 分の 1 に
- <strong>EmDash（Noah）</strong>
  - インターンから EmDash の 2 人目のメンテナに
  - メディアライブラリ、コンテンツエディタ、管理画面を変更。EmDash 1.0 は Birthday Week に出荷

</div>

---

# インターンが書いた記事 2: ポスト量子とインターネットの基盤

<div class="text-left text-sm pt-2">

- <strong>ポスト量子（Tiago、Sophie）</strong>
  - 2029 年のポスト量子セキュリティを目標に、「見えないものは移行できない」
  - Tiago: 社内 AI ツール CryptoLabe（コードベースの暗号利用と依存先を洗い出す）
  - Sophie: Logpush・Log Explorer・HTTP Traffic Analytics の接続ごとのポスト量子可視化
- <strong>BGP（Iliana）</strong>
  - ORIGIN 属性の書き換えを計測し、観測した経路の約 <strong>70%</strong> で確認
  - 経路選択から ORIGIN を外すことを公に提唱
  - RFC 9234（経路リークをルーター自身が拒否）の採用状況も追跡

</div>

---

# Birthday Week 2026 の発表に含まれたインターンの仕事

<div class="text-left text-sm pt-2">

- Protected Quick Tunnels: ▶ <a href="../protected-quick-tunnels/" target="_blank">解説スライド</a>
- CryptoLabe による暗号利用の発見: ▶ <a href="../ai-driven-cryptography-discovery/" target="_blank">解説スライド</a>
- ポスト量子暗号の可視化: ▶ <a href="../post-quantum-visibility/" target="_blank">解説スライド</a>
- EmDash 1.0: ▶ <a href="../emdash-cms-plugin-registry/" target="_blank">解説スライド</a>
- Workers の Rust（Emscripten ターゲット）: ▶ <a href="../rust-workers-emscripten-target/" target="_blank">解説スライド</a>
- BEACON（実ユーザー計測の探索）: ▶ <a href="../how-fast-is-the-web/" target="_blank">解説スライド</a>
- Containers の再設計（エージェントのサンドボックス）: ▶ <a href="../faster-agent-sandboxes/" target="_blank">解説スライド</a>

</div>

---

# コミュニティと、これから

<div class="text-left text-sm pt-2">

- <strong>コミュニティ</strong>: 食事・ボランティア・友人づくり。Matthew Prince が各地のオフィスでインターンと夕食会。役員 Q&A で会社・戦略・技術・キャリアを率直に質問
- <strong>これから</strong>: 来年も拡大（新しいコホート、参加チームの増加、AI と人と共に早期キャリアが力を発揮する方法の学び）
- 今年のインターンの多くがフルタイムとして戻ってくる。目標は「良い夏」ではなくキャリア

</div>

---

# コード例: 本記事にコードブロックはない

<div class="text-left text-sm pt-2">

- 記事は採用プログラムの経過報告で、コード例（コードブロック）を含まない
- 代わりに、成果と技術の対応を整理する

| 成果 | 技術的な核 |
|---|---|
| Cache Transcoding | プロキシ内の Zstandard 圧縮、ディスク上のサイズ削減 |
| CryptoLabe | AI によるコードベース内の暗号利用の発見 |
| 接続ごとの PQ 可視化 | Logpush・Log Explorer・HTTP Traffic Analytics への反映 |
| BGP ORIGIN の計測 | 観測経路の約 70% での書き換え |

</div>

---

# ユースケース 1: 非エンジニアリング職での自動化

<div class="text-left text-sm pt-2">

- 内部監査: ISO 統制のテストと文書化を、AI 支援のパイプラインで自動化
- サポート: ケース説明から、トラブルシューティングコマンドを起動する方法を探る
- 職種を問わず、AI を繰り返し作業の自動化に使う

</div>

---

# ユースケース 2: 製品・インフラへの出荷

<div class="text-left text-sm pt-2">

- Cache Transcoding: 既存サーバーのキャッシュ容量を、圧縮で実効的に増やす
- EmDash: メディアライブラリ・エディタ・管理画面の改善を継続的に出荷
- Protected Quick Tunnels: 製品要件から出荷までをインターンが担当

</div>

---

# ユースケース 3: 公開データと提案

<div class="text-left text-sm pt-2">

- 誰も単独では所有しない問題（BGP の ORIGIN 属性）を計測し、データを公開して改善を提案
- RFC 9234 の採用状況を追跡して、経路リーク対策の進み具合を見える化
- ポスト量子の可視化で、顧客が自分で進捗を確認できるようにする

</div>

---

# まとめ・所感

<div class="text-left text-sm pt-2">

- 技術解説というより、採用方針の経過報告。1,111 には届いておらず、「進行中」と明記されている
- 技術面の読みどころは Cache Transcoding と BGP ORIGIN の計測。詳細は個別記事にある
- AI は「責任や学習の省略」ではなく「スタートラインを前に進めるもの」。レビューする人の役割は変わらず重要
- ヘッダー画像は装飾で、キャプションは原文になく見た目からの記述
- サンプル対象外: 採用・プログラム報告で、Workers 上の機能の記事ではないため

</div>

---

# 参考リンク

- 原文: https://blog.cloudflare.com/one-year-later-1111-interns/
- 昨年の発表: https://blog.cloudflare.com/cloudflare-1111-intern-program/
- Cache Transcoding: https://blog.cloudflare.com/cache-transcoding/
- BGP の ORIGIN 属性: https://blog.cloudflare.com/bgp-origin-attribute/
- RFC 9234 の採用状況: https://blog.cloudflare.com/rfc9234-bgp-role-model/
- Internship Experience タグ: https://blog.cloudflare.com/tag/internship-experience/
- 早期キャリア向けの募集: https://www.cloudflare.com/careers/early-talent/

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-10-05-one-year-later-1111-interns.md
</div>
