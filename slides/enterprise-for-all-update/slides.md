---
routerMode: hash
theme: default
title: "「全員が使える」誓約のアップデート: Enterprise 専用だった機能は今どこまで開放されたか"
info: |
  Updates on our pledge to make Cloudflare features accessible to everyone の解説スライド。
  原文: https://blog.cloudflare.com/enterprise-for-all-update/
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

# 「全員が使える」誓約の<br>アップデート

Enterprise 専用だった機能は今どこまで開放されたか

Birthday Week 2026 / Developers / Product News / Terraform

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/enterprise-for-all-update/<br>
公開日: 2026-10-02
</div>

---

# TL;DR

- 1年前の「全機能を全員に」という誓約の<strong>進捗報告</strong>。差は「何を使えるか」ではなく「どれだけ使えるか」に
- 今回の開放: <strong>Logpush</strong>（Free / Pro / Business へ）、<strong>Logpush Transformers</strong>（全顧客で GA）、<strong>Custom Dashboards</strong>
- 大規模運用の道具: RBAC の拡大、<strong>New Account ボタン</strong>、<strong>Organizations</strong>、Terraform、Resource Tagging
- <strong>今後 Enterprise 専用の新機能は導入しない</strong>（Cloudflare for Government などは例外）
- Workers・Containers・Workflows などの<strong>上限も広く引き上げ</strong>

---

# アジェンダ

- 背景: 二層構造と誓約
- 今回 Enterprise 専用から全員向けになった機能
- 大規模運用の道具: RBAC・複数アカウント・Organizations・Terraform
- Cloudflare 社内での使い方
- 「Enterprise 専用の新機能は作らない」という約束
- 無料・従量課金向けの進捗（Billable Usage・上限引き上げ）
- ユースケース、まとめ

---

# 背景: 二層構造と誓約

<div class="text-left text-sm pt-2">

- Enterprise 階層は、請求書払い・個別契約・専用サポートを求める大企業向けに作られた
- 時間とともに、先進的な機能が Enterprise にしかない<strong>二層構造</strong>ができた
- 1年前、CTO の Dane Knecht が「すべての機能を全員に」という方針を発表
- 考え方: 最も要求の厳しい顧客向けの製品を作り、その能力を全員に提供する
  - 大企業でも小規模事業者でも、サポートに電話せずに済むほうがよい
- 現状: 目標は<strong>未達</strong>だが、1年で大きく前進したという立場

</div>

---

# 方針: 違いは「量」であって「機能」ではない

<div class="text-left text-sm pt-2">

- 今週ローンチした GA 機能のうち、Enterprise プランにあるものは<strong>Pay-as-you-go でも利用可能</strong>
- その多くは<strong>無料枠でも利用可能</strong>
- プランの差は<strong>使用量（how much）</strong>に置く

<div class="mt-6 p-4 border rounded">

Free / Pro / Business / Pay-as-you-go / Enterprise<br>
→ 使える機能は揃える。違いは上限・契約・サポート

</div>

</div>

---

# 全員向けになった: Logpush と Transformers

<div class="text-left text-sm pt-2">

| 機能 | 内容 | 提供範囲 |
|---|---|---|
| Logpush | ログをストレージ・セキュリティ・分析の送信先へ配信 | Free / Pro / Business にセルフサービス・従量課金 |
| Transformers | SQL で絞り込み・伏字化・付加情報・整形 | 全顧客で GA |
| Custom Dashboards | 重視する指標を並べた個人向けビュー | 全顧客 |

- Transformers は、別途 ETL パイプラインを運用せずに配信前に変換できる
- データセットも拡大: アカウント単位の firewall events、WebSocket analytics、ゾーン単位のポスト量子可視性

</div>

---

# 大規模運用の道具: RBAC の拡大

<div class="text-left text-sm pt-2">

- この1年で RBAC を<strong>全製品・全顧客</strong>へ拡大
- ほぼすべての製品に、アカウント単位・ゾーン単位のロールがある
- Workers も、R2・Access に続いて<strong>個別リソース単位</strong>のロールに対応
  - 「誰がどの Worker にアクセスできるか」を個別に決められる
- ただし少数のスーパー管理者が決める構造は、規模が増えるとボトルネックになる
  - → 複数アカウントの管理機能を拡充

</div>

---

# New Account ボタン

<div class="text-left text-sm pt-2">

- 先月ダッシュボードに追加。追加アカウントを<strong>直接作成</strong>できる初の機能
- 毎週数千の顧客が別アカウントに分けている
- 作られるのは新しい<strong>無料</strong>アカウント。各アカウントは<strong>独立して請求</strong>される
- OSS プロジェクトの分離、チームごとのコスト分離に使える。不正・悪用への安全策あり

</div>

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3XD0G82WC9FV8GAF2Y6GBKQ.png" style="max-height: 200px; margin: 12px auto 0;" />

<div class="text-xs opacity-70 mt-1">「Create an Account」ダイアログ。出典: Cloudflare Blog https://blog.cloudflare.com/enterprise-for-all-update/</div>

---

# Enterprise の場合のアカウント作成

<div class="text-left text-sm pt-2">

- ボタンは全員向けだが、当面 Enterprise 顧客は<strong>アカウントチームに依頼</strong>することを推奨
  - 既存の Enterprise 契約とサブスクリプションを全アカウントで再利用できるため
- アカウント数に<strong>事前の上限はない</strong>
- 今後、Enterprise でもセルフサービスで作れる機能を追加する予定

</div>

---

# Organizations

<div class="text-left text-sm pt-2">

- 複数アカウントを<strong>単一の分析画面と共有設定</strong>で束ねる
- 提供状況: Enterprise でベータ → <strong>10月に GA</strong> → 無料アカウントは<strong>2027年初頭</strong>
- 共有管理者、統合された分析・監査ログ、共有の WAF・Gateway・Access IdP 設定
- Enterprise は<strong>ちょうど1つ</strong>の Organization（CISO・CTO などに単一の視点を提供）
- 作成: 少なくとも1つのアカウントのスーパー管理者で、まだ誰も作っていなければ直接作成
  - 既存の場合は、社内の他の管理者に追加を依頼（権限昇格を防ぐ）

</div>

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01M3XD0HAXDB7XP7H1SY1K9JZX.png
backgroundSize: contain
---

# Organization の構成

<div class="text-sm pt-2">

- 上段: 共有管理者・統合分析・共有 WAF / Gateway / Access IdP 設定
- 下段: Team A / B / C の各アカウント
  - Zone・Worker・Access App
  - Account / Zone / Resource の RBAC

<div class="text-xs opacity-70 mt-6">

出典: Cloudflare Blog https://blog.cloudflare.com/enterprise-for-all-update/

</div>

</div>

---

# Terraform と Resource Tagging

<div class="text-left text-sm pt-2">

- <strong>Terraform</strong>: API から機械的に生成される provider。常に最新の API に追随し、全顧客が利用可能
- <strong>Resource Tagging</strong>: アカウント・Organization 内の幅広いリソースにキー・バリューのタグ
  - 現在はダッシュボードまたは API で付与し、整理に使う
  - 将来: 課金・アクセス制御でも利用、Terraform から管理

</div>

---

# コード例: provider.tf

<div class="text-xs">

```hcl {all}
# This code block pulls the binary from the HashiCorp registry and
# initializes the Terraform workspace.
terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "5.25.0"
    }
  }
  required_version = ">= 1.5"
}
```

</div>

<div class="text-sm">

- 記事掲載の画像（<code>provider.tf</code>）の書き起こし。Cloudflare provider を<strong>バージョン固定</strong>で宣言し、Terraform 本体は <code>&gt;= 1.5</code> を要求する
- HashiCorp のレジストリから取得し、ワークスペースを初期化する

</div>

<div class="text-xs opacity-70 mt-1">出典: Cloudflare Blog https://blog.cloudflare.com/enterprise-for-all-update/</div>

---

# Cloudflare 社内での使い方

<div class="text-left text-sm pt-2">

- <strong>チームまたはサービス単位</strong>でアカウントを作る
- <strong>Terraform</strong> でアカウントのアクセスと本番設定を管理（ピアレビュー・監査可能な変更経路）
- アカウントの範囲が狭い → 担当エンジニアに広い権限を与えても<strong>影響範囲を抑えられる</strong>
- すべてのアカウントは Cloudflare の Organization に属し、セキュリティチームが管理アクセス・分析・ポリシー管理を持つ
- Resource Tagging は社内で有効化済み（まだ初期段階）

</div>

---

# さらに全員向けになった機能

<div class="text-left text-sm pt-2">

- <strong>SCIM</strong>: Authentik IdP のサポート、SCIM 監査ログ、SCIM 2.0 Group Sync
- <strong>MCP Server Portals</strong>: GA
- <strong>Network Overview ページ</strong>と <strong>Unified Routing</strong>: ネットワーク管理もセルフサービスへ

いずれも、かつては何らかの形で Enterprise 専用だった。

</div>

---

# 約束: 新しい Enterprise 専用機能は作らない

<div class="text-left text-sm pt-2">

- 今年の <strong>Code Orange: Fail Small</strong> で、新しいコードを<strong>トラフィックのコホート単位・無料顧客から順に</strong>展開すると発表
- その結果、今日から<strong>新たな Enterprise 専用機能は導入しない</strong>ことを約束
- 例外: Cloudflare for Government のように、本質的に Enterprise 志向のもの

</div>

---

# 無料・従量課金向けの進捗: Billable Usage

<div class="text-left text-sm pt-2">

- 8月に <strong>Billable Usage ダッシュボードと API</strong> を導入
  - 支出額の確認、消費データのダウンロード（Vantage などのサードパーティツールでも利用可）
- <strong>予算アラート</strong>は既定で有効
- <strong>ハードな支出上限</strong>: 試作中、2026年第4四半期に早期提供予定
- Enterprise は契約条件・支払い方法の差が大きく未提供。<strong>2027年</strong>に発表を見込む

▶ <a href="../billable-usage-api/">解説スライド</a>

</div>

---

# 上限の引き上げ（1）: Workers と Containers

<div class="text-left text-xs pt-2">

| 項目 | 旧 → 新 |
|---|---|
| Workers 起動時間 | 400 ms → 1 秒 |
| WebSocket メッセージ | 1 MiB → 32 MiB |
| サブリクエスト数 / リクエスト | 1,000 → 100万 |
| Worker サイズ（非圧縮） | 10 MB → 64 MiB |
| Dynamic Workers（DO あたり in-flight） | 4 → 10（有料 Workers で利用可） |
| Containers メモリ / vCPU / ディスク | 400 GiB / 100 / 2 TB → 6 TiB / 1,500 / 30 TB |
| Containers ディスク | メモリ 1 GiB あたり 2 GB → 任意のメモリで最大 20 GB |

</div>

---

# 上限の引き上げ（2）: Workflows・Browser Run ほか

<div class="text-left text-xs pt-2">

| 項目 | 旧 → 新 |
|---|---|
| Workflows 同時インスタンス | 4,500 → 50,000 |
| Workflows 作成レート | 10 → 300 インスタンス/秒 |
| Workflows ステップ数 | 1,024 → 25,000 |
| Browser Run 同時ブラウザ | 30 → 200 |
| Vectorize ベクトル数 / インデックス | 500万 → 2,000万 |
| Pages 静的アセット | 20,000 → 100,000 |
| HTTP ヘッダー | 32 KB → 128 KB |
| Durable Objects 生存（外向き接続中） | 70〜140 秒で退避対象 → 最大 15 分 |

</div>

---

# ユースケース1: ログ連携と変換

<div class="text-left text-sm pt-2">

- 小規模チームでも、Logpush で SIEM・ストレージへログを流せる（従量課金）
- Transformers で、配信前に<strong>不要なレコードの除外</strong>や<strong>機微情報の伏字化</strong>を SQL で行う
- 別途 ETL パイプラインを持たずに済む

</div>

---

# ユースケース2: チームごとのコスト分離

<div class="text-left text-sm pt-2">

- New Account ボタンでチームごと・プロジェクトごとにアカウントを作る
- 各アカウントは<strong>独立して請求</strong>されるため、コストセンター別に支出を分けられる
- OSS プロジェクトを複数持つ個人・コミュニティでも、プロジェクトごとに分離できる

</div>

---

# ユースケース3: 組織全体の統制と可視化

<div class="text-left text-sm pt-2">

- Enterprise は1つの Organization に全アカウントを集める
- 共有の WAF・Gateway・Access IdP 設定と、統合された分析・監査ログ
- CISO・CTO などの経営層に<strong>単一の視点</strong>を提供
- Terraform でアクセスと本番設定をコード化し、ピアレビューを経て変更する

</div>

---

# まとめ・所感

<div class="text-left text-sm pt-2">

- 「全機能を全員に」は<strong>達成済みではなく進捗報告</strong>。予定のものも多い
  - Organizations GA は10月、無料アカウントへは2027年初頭
  - ハードな支出上限は2026年第4四半期、Enterprise 向け Billable Usage は2027年
- 「新たな Enterprise 専用機能は作らない」は、無料顧客から順に展開するリリース方針とセット
- アカウント分割 + Organization + RBAC + Terraform が、社内運用をそのまま製品化した構成
- 画像4点のうち、ヘッダーは装飾イラスト。図中の文言は画像から筆者が転記した
- 方針・プラン・設定が中心のため、<code>examples/</code> のサンプルは未作成

</div>

---

# 参考リンク

<div class="text-left text-sm pt-2">

- 原文: https://blog.cloudflare.com/enterprise-for-all-update/
- 前年の発表: https://blog.cloudflare.com/enterprise-grade-features-for-all/
- Organizations（ベータ）: https://blog.cloudflare.com/organizations-beta/
- Code Orange: Fail Small: https://blog.cloudflare.com/code-orange-fail-small-complete/
- Logpush Transformers: https://developers.cloudflare.com/logs/logpush/transformers/
- Resource Tagging: https://developers.cloudflare.com/changelog/product/resource-tagging/
- Cloudflare Connect: https://www.cloudflare.com/connect/
- 関連解説スライド: [Billable Usage API](../billable-usage-api/) / [ポスト量子の可視化](../post-quantum-visibility/) / [Account Abuse Protection ダッシュボード](../account-abuse-protection-dashboard/)
- オブザーバビリティ 8 件の更新: ▶ <a href="../one-observability-platform/" target="_blank">解説スライド</a>

</div>
