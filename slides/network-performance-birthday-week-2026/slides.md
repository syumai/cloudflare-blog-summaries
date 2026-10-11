---
routerMode: hash
theme: default
title: "2026 Birthday Week: ネットワーク性能アップデート"
info: |
  2026 Birthday Week: network performance update の解説スライド。
  原文: https://blog.cloudflare.com/network-performance-birthday-week-2026/
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

# 2026 Birthday Week:<br>ネットワーク性能アップデート

上位1,000ネットワークの74%で最速に。Challenge Pages による新しい計測

Birthday Week 2026

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/network-performance-birthday-week-2026/<br>
公開日: 2026-10-02
</div>

---

# TL;DR

- 世界の上位1,000ネットワークのうち <strong>74%</strong> で Cloudflare が最速（4月の Agents Week 時点は60%、+14ポイント）
- 約150ネットワークで新たに最速になり、最速の国も38か国増えた（2026年8月のデータ）
- 指標は TCP ハンドシェイクの<strong>接続時間</strong>、順位は 25/50/75 パーセンタイルの加重平均である<strong>トリミアン</strong>
- エラーページに加え、<strong>Challenge Pages</strong>（Turnstile）でも軽量ファイルの取得を計測。サンプルが増え、僅差の順位が安定した

---

# アジェンダ

- 結果: 74%、国別・ネットワーク別
- 測定方法（接続時間・トリミアン）
- Challenge Pages による新しい測定
- 測定量が増えると何が変わるか
- ユースケース、まとめ

---

# 背景: 1〜2ms の差を判定する難しさ

<div class="text-left text-sm pt-2">

- 1ミリ秒ごとに、アプリ・API・Webサイトへ到達する速さが変わる
- 多くのネットワークで、上位プロバイダー同士の差は 1〜2ms しかない
  - 例: Cloudflare 50ms と Fastly 51ms
- この程度の差は、日ごとの揺らぎで順位が入れ替わる
- 課題は、<strong>本当の優位</strong>と<strong>統計的なノイズ</strong>を区別できるだけのサンプルを集めること

</div>

---

# 結果: 74% のネットワークで最速

<div class="grid grid-cols-3 gap-4 pt-6 text-center">
<div class="p-4 border rounded"><div class="text-4xl font-bold">60%</div><div class="text-sm pt-2">2026年4月<br>Agents Week</div></div>
<div class="p-4 border rounded"><div class="text-4xl font-bold">74%</div><div class="text-sm pt-2">2026年8月<br>Birthday Week</div></div>
<div class="p-4 border rounded"><div class="text-4xl font-bold">+14pt</div><div class="text-sm pt-2">上位1,000ネットワーク中</div></div>
</div>

<div class="text-left text-sm pt-6">

- 追加で約150ネットワークが最速に
- 最速になった国は38か国増加
- 各国で最も多くのユーザーにサービスを提供するネットワークで最速プロバイダーを見ている

</div>

---

# 国別の最速プロバイダー（2026年8月）

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3T5GDZ75P9Q00E1F1JBMK29.png" style="max-height: 340px; margin: 0.5rem auto 0;" />

<div class="text-sm pt-2 text-left">

凡例: Cloudflare 206 / CloudFront 10 / Google 7 / Fastly 5 / Akamai 3（計231か国・地域）

</div>

<div class="text-xs opacity-70 pt-1">出典: Cloudflare Blog https://blog.cloudflare.com/network-performance-birthday-week-2026/</div>

---

# Agents Week 以降に増えた国

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3T5G6RW8ATGQ9ZMH0FTD9NF.png" style="max-height: 340px; margin: 0.5rem auto 0;" />

<div class="text-sm pt-2 text-left">

オレンジ色が、4月以降に Cloudflare が新たに最速になった国。

</div>

<div class="text-xs opacity-70 pt-1">出典: Cloudflare Blog https://blog.cloudflare.com/network-performance-birthday-week-2026/</div>

---

# 最速ネットワーク数: 598 → 746

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3T5GGDNQN6NWB8ENN33P03N.png" style="max-height: 340px; margin: 0.5rem auto 0;" />

<div class="text-sm pt-2 text-left">

図の差分は 148。本文は「約150ネットワーク」と記載している。

</div>

<div class="text-xs opacity-70 pt-1">出典: Cloudflare Blog https://blog.cloudflare.com/network-performance-birthday-week-2026/</div>

---

# 測定方法: 何を、どう比べるか

| 項目 | 内容 |
| --- | --- |
| 対象 | 推定ユーザー数の上位1,000ネットワーク（APNIC のデータ） |
| 指標 | 接続時間（TCP ハンドシェイクの完了まで） |
| 順位付け | 接続時間の<strong>トリミアン</strong> |
| 比較対象 | Cloudflare / CloudFront / Google / Fastly / Akamai |

<div class="text-sm pt-3 text-left">

トリミアンは 25・50・75 パーセンタイルの加重平均。外れ値の影響を抑えつつ、多くのユーザーの体験の幅を表せる。

</div>

---

# 従来の測定: エラーページ（2021年〜）

<div class="text-left text-sm pt-2">

1. ユーザーが Cloudflare ブランドのエラーページに到達する
2. ブラウザがバックグラウンドで、複数プロバイダーの軽量ファイルを取得する
3. そのユーザーのブラウザ・ネットワーク・その時点での接続時間を記録する

</div>

<div class="text-sm pt-4 text-left">

テスト環境ではなく、<strong>実際のインターネット条件</strong>での性能が分かる。一方で、エラーページに到達する場面は限られる。

</div>

---

# 新しい測定: Challenge Pages

<div class="grid grid-cols-2 gap-6 pt-2 text-left text-sm">
<div class="p-4 border rounded">

<strong>Challenge Pages とは</strong>

- サイトに到達する前に訪問者を検証する全画面の画面
- WAF ルールなどで challenge が実行されると表示
- Turnstile（プライバシー重視のリスクベース challenge）が提供

</div>
<div class="p-4 border rounded">

<strong>測定の仕組み</strong>

- 訪問者が画面にいる間、非対話の計測がバックグラウンドで走る
- 固定のエンドポイントから軽量ファイルを取得し、完了有無と所要時間を記録
- ユーザーの追加操作は不要

</div>
</div>

---

# 慎重な展開と、到達範囲の利点

<div class="text-left text-sm pt-2">

- 目に見える遅延を増やさず、Turnstile のプライバシー重視の特性も保つ設計
- 現時点は、対象となる<strong>無料プランの Challenge Pages のごく一部</strong>のみ。エラーページの収集も継続
- サンプリング率は、データが測定品質を高め、ユーザーの性能に影響しないと確認できた場合のみ引き上げる
- 日常的な操作の中で計測できるため、より多くのネットワーク・地域・ユーザーを観測できる

</div>

---

# コード例: 測定の流れ（概念）

<div class="text-sm text-left">

記事にコード例はない。測定の流れを概念的に整理する。

</div>

```text {all|1-2|3|4-5}
1. エラーページ / Challenge Page にユーザーが到達
2. ブラウザが5社の固定エンドポイントから軽量ファイルを取得
3. 完了の有無と接続時間を記録
4. ネットワークごとに接続時間のトリミアンを計算
5. 最小のプロバイダーをそのネットワークの最速とする
```

---

# 測定量が増えると何が変わるか

<div class="grid grid-cols-2 gap-6 pt-2 text-left text-sm">
<div class="p-4 border rounded">

<strong>見方が広がる</strong>

- 上位1,000を超えるネットワークも対象に
- 人数で重み付けした性能
- 国別・世界全体での集計
- 測定ネットワークがユーザートラフィックのどれだけを占めるか

</div>
<div class="p-4 border rounded">

<strong>僅差の判定が安定する</strong>

- 各プロバイダーのトリミアンの信頼区間が狭まる
- 1〜2ms 差の2位が、外れ値や日ごとの揺らぎの影響で入れ替わりにくくなる
- 本当の優位とノイズを区別しやすい

</div>
</div>

---

# ユースケース

<div class="text-left text-sm pt-2">

- <strong>プロバイダー選定</strong>: 自社ユーザーの多い国・ネットワークで、どのプロバイダーが速いかを実測で把握する
- <strong>性能改善の検証</strong>: 遅いネットワークを特定し、改善後の効果を確認する
- <strong>計測設計の参考</strong>: 実ユーザーのブラウザから軽量リクエストを出し、パーセンタイルの加重平均で外れ値に強い指標を作る
- <strong>サイト運営者の参加</strong>: Challenge Pages を導入すると、訪問者が（無料プランで、サンプリング対象の場合に）測定に寄与する

</div>

---

# 読む際の注意

<div class="text-left text-sm pt-2">

- 74% は<strong>ネットワーク数</strong>ベースの割合で、ユーザー数による重み付けではない
- 改善には、手法変更（サンプル増）で順位が安定した分も含まれる
- 測定は Cloudflare 自身が行った自己報告の結果
- 記事自身も結果を「初期のもの」としている
- 関連: BEACON（ブラウザ体験の実ユーザー計測）を扱う記事。▶ <a href="../how-fast-is-the-web/">解説スライド</a>

</div>

---

# まとめ

<div class="text-left text-sm pt-2">

- 上位1,000ネットワークの74%で最速。4月の60%から14ポイント改善
- 接続時間のトリミアンで順位付けする方式は変わらない
- Challenge Pages の計測を加え、データ量と多様性を拡大した
- パフォーマンスの改善と、その測り方の改善を並行して続けていく

</div>

---

# 参考リンク

<div class="text-left text-sm pt-2">

- 原文: https://blog.cloudflare.com/network-performance-birthday-week-2026/
- 前回（Agents Week）: https://blog.cloudflare.com/network-performance-agents-week/
- Internet Quality ページの紹介: https://blog.cloudflare.com/introducing-radar-internet-quality-page/
- Challenge Pages: https://developers.cloudflare.com/cloudflare-challenges/challenge-types/challenge-pages/
- Turnstile: https://www.cloudflare.com/products/turnstile/

</div>
