---
routerMode: hash
theme: default
title: "Cloudflare が「インターネット全体のための認証局」を作る"
info: |
  Cloudflare が「インターネット全体のための認証局」を作る の解説スライド。
  原文: https://blog.cloudflare.com/cloudflare-certificate-authority/
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

# Cloudflare が<br>「インターネット全体のための認証局」を作る

Birthday Week 2026

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/cloudflare-certificate-authority/<br>
公開日: 2026-09-29
</div>

---

# TL;DR

- Cloudflare は、長年の「公開証明書の大口利用者」から、自ら<strong>公開認証局（CA）</strong>になる意向を発表
- 4 つのルートプログラム（Chrome・Apple・Microsoft・Mozilla）へ申請し、<strong>GlobalSign の既存ルート</strong>を取得する最終合意に署名
- <strong>ACME ファースト</strong>。<strong>ARI（RFC 9773）対応を発行の条件</strong>にし、再現可能ビルドや公開ダッシュボードで運用も透明化
- <strong>2027 年第 1 四半期</strong>に本番の MTC を初めて発行する計画。現時点では証明書は未発行

---

# アジェンダ

- 背景: Universal SSL から 12 年、そして発行の集中
- 信頼への 2 つの道
- 無料証明書の新しい供給元（ACME ファースト）
- 証明書需要の増加
- 回復力の設計: 透明性と fail small
- ポスト量子の CA と MTC
- Customer Zero・今後・まとめ

---

# 背景: Universal SSL から 12 年

- 2014 年の Birthday Week に Universal SSL を開始し、背後の全サイトに無料 TLS を提供
- 以来、Cloudflare は公開証明書の<strong>最大級の利用者</strong>でありながら、<strong>自分では 1 枚も発行していない</strong>
- 今回の発表: 公開 CA になる意向、最初の節目、ポスト量子証明書への対応計画
- まだ発行はしておらず、開始までには時間がかかる。作業は公開の場で進め、節目ごとに共有する

---

# 課題 1: 新規ルートは数年間、役に立たない

- ルートプログラムに受け入れられても、OS・ブラウザ・デバイスへの配布に時間がかかる
- 更新の止まった（または更新を受けたことのない）端末には<strong>永久に届かない</strong>
- そうした古いクライアントから、世界のトラフィックの多くが発生している
- 記事の立場: どのクライアントも、製造元・OS・更新状況に関係なく、最高水準のセキュリティに値する

---

# 信頼への 2 つの道

| ルート | 役割 |
|---|---|
| <strong>既存の GlobalSign ルート</strong>（取得の最終合意に署名） | 2012 年から各種ブラウザ・OS・デバイスで信頼。<strong>過去のデバイスへの到達性</strong> |
| <strong>新しいルート</strong>（ルートプログラムへ申請） | ルートの「年齢」に上限を設けるなど、<strong>将来のポリシー</strong>に適合 |

- 目的: 発行初日から、互換性の幅を最大にする

---

# 課題 2: 発行の集中

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3NDPRKC82G6V4NTDZEF5NPP.png" style="max-height: 360px; margin: 0 auto;" />

<div class="text-xs opacity-60 pt-2">出典: Cloudflare Blog https://blog.cloudflare.com/cloudflare-certificate-authority/（未失効プレ証明書の CCADB 所有者別シェア。図中の出典は crt.sh / CCADB、2026 年 6 月。図の説明は筆者が整理）</div>

---

# 集中が意味するもの

- 最大の発行者 Let's Encrypt (ISRG) は <strong>39.2%</strong>、上位 3 社で <strong>68.8%</strong>、上位 5 社で <strong>89.4%</strong>
- Let's Encrypt は 1 日あたり約 1,000 万枚を発行、5 億超のサイトにサービス、2025 年に<strong>アクティブな証明書が 40 億枚超</strong>
- 記事は「この 20 年のインターネットで最良の出来事の 1 つ」と評価しつつ、<strong>システミックなリスク</strong>を指摘
- 最大手が不調の週には、Web の大半に同等の無料・自動の代替がない

---

# ACME ファースト

- 証明書の発行と更新は <strong>ACME</strong>（標準プロトコル）で行う
- 既存の無料 CA を使っている場合は、<strong>ディレクトリ URL を変えるだけ</strong>で移行可能。新しいツールも再設計も不要
- Universal SSL の証明書には、別の鍵・別の認証局のバックアップ証明書がすでに付属
- 公開 CA は、この冗長化の考え方を「インターネット全体」の規模に広げるもの

---

# 証明書の需要は増え続ける

- Cloudflare はグローバルのリクエストトラフィックの <strong>20% 超</strong>の前段に立ち、数百万ドメインの TLS を終端
- 複数の CA を使い、プライマリとバックアップの経路で CA 障害・失効に備えている
- 利用者として経験してきたこと: レート制限、検証のエッジケース、失効の遅延、チェーン構築、ルート配布の遅れ
- 今後さらに増える要因: <strong>最大有効期間の短縮</strong>、エージェントの活動増加、PQ 証明書の主流化

---

# 回復力の設計: fail small

- 目標は「ミスをしない」ことだけでなく、<strong>問題の影響を限定</strong>すること
- 障害が起きる前に、回復を設計しテストする
- 例: <strong>更新の自動化を発行の条件</strong>にする
  - <strong>ARI（ACME Renewal Information, RFC 9773）</strong>に対応するクライアントにのみ発行
  - 加入者は、CA の更新エンドポイントをポーリングし、更新ウィンドウに従い、置き換え対象の証明書を識別する

---

# ARI による一斉更新

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3NDPPYQ33SWKYEFT2W6D6RM.png" style="max-height: 340px; margin: 0 auto;" />

<div class="text-xs opacity-60 pt-2">出典: Cloudflare Blog https://blog.cloudflare.com/cloudflare-certificate-authority/（CA が更新ウィンドウを公開 → ACME クライアントが継続的にポーリング → フリート全体が無停止で更新。図の文脈説明は筆者が補った）</div>

---

# 失効時の挙動と透明性

- 失効が必要なとき（コンプライアンス上の問題・インシデント）は、影響を受ける証明書の<strong>更新ウィンドウを前倒し</strong>し、置き換えを分散し、進捗を追跡
- 公開する予定のもの:
  - 証明書に署名するソフトウェアの<strong>再現可能ビルド</strong>
  - 鍵を保持する <strong>HSM の証明（attest）</strong>
  - 発行の健全性とインシデントの<strong>公開ダッシュボード</strong>
- 監査は時点ごとの確認。監査の間の運用を、ルートプログラム・研究者・サイト運営者が見られるように

---

# ポスト量子インターネットのための CA

- 本番の <strong>Merkle Tree Certificates（MTC）</strong>を発行する最初の CA の 1 つに。最初の発行は <strong>2027 年第 1 四半期</strong>
- MTC: 従来のチェーンが PQ 時代に大きくなる問題に対する、はるかにコンパクトな公開証明書の届け方
- Chrome が MTC を PQ 認証の推奨パスとして示し、Cloudflare は IETF で標準提案を推進
- 移行は段階的: <strong>古典証明書と MTC を 1 つの CA・1 つのライフサイクル・1 組の保証</strong>で提供
- 技術詳細は [▶ 解説スライド: MTC によるポスト量子認証局](../pq-ca-with-mtcs/)

---

# Customer Zero・今後

- Cloudflare は多数の CA から証明書を調達して自社を運用している
- 新 CA の証明書（WebPKI と MTC の両方）の最初の利用者として、Cloudflare の規模で基盤を検証
- 各ルートプログラムの審査は公開の場で進み、更新を共有。最初の MTC は 2027 年初頭
- 関連: TLS の PQ 鍵交換の可視化 [▶ 解説スライド](../post-quantum-visibility/)
- 長年協力してきたパートナー公開 CA（16 社）とも引き続き協力

---

# コード例について

- 本記事は CA 事業の方針を述べる<strong>意向表明で、コード例は含まれない</strong>
- 代わりに、方針と技術要素の対応を読み解く

| 方針 | 技術要素 |
|---|---|
| 移行の容易さ | ACME（ディレクトリ URL の変更のみ） |
| 失効時の回復 | ARI（RFC 9773）の更新ウィンドウ |
| PQ 対応 | Merkle Tree Certificates |

- 具体的な URL や設定例は、発行開始前のため記事にない

---

# ユースケース 1: 供給元の冗長化

- ACME クライアントの<strong>ディレクトリ URL を変えるだけ</strong>で、2 社目の無料 CA を確保
- 単一の発行元の障害・失効時の影響を小さくする

---

# ユースケース 2: 失効時の一斉更新

- ARI 対応クライアントは、CA が公開する更新ウィンドウに従って自動的に更新
- CA が窓を前倒しすると、<strong>フリート全体が無停止で</strong>追従
- 置き換えを時間的に分散でき、失効期限とサイトの稼働維持の板挟みを減らせる

---

# ユースケース 3: 古い端末への到達

- GlobalSign の既存ルートにより、新規ルートでは届かない<strong>更新の止まったデバイス</strong>でも証明書が信頼される
- 一方、新ルートは将来のルートプログラムのポリシーに適合する

---

# ユースケース 4: PQ への段階移行

- 古典証明書から MTC へ、<strong>同じ CA・同じライフサイクル</strong>のまま移行
- 2 つのシステムを並行運用したり、移行のたびに作り直したりしない

---

# まとめ・所感

- 証明書を<strong>まだ発行していない</strong>段階の意向表明。ルートプログラムの承認、GlobalSign ルート取得の完了、提供条件は今後
- 「ARI 必須」は、導入側の ACME クライアントが ARI に対応しているかの確認が必要になる方針
- 発行シェアの数値は記事中の出典（crt.sh / CCADB、2026 年 6 月）に基づく
- PQ の技術詳細は MTC の記事に任せ、本記事は「なぜ CA になるのか」「どう運用するのか」を扱う
- デプロイ可能なサンプルは対象外（方針表明の記事で、CA は未稼働のため）

---

# 参考リンク

- 原文（en-us）: https://blog.cloudflare.com/cloudflare-certificate-authority/
- Universal SSL: https://blog.cloudflare.com/introducing-universal-ssl/
- Chrome の Quantum-resistant Root Program: https://blog.google/security/cultivating-a-robust-and-efficient-quantum-safe-https/
- RFC 9773（ARI）: https://www.rfc-editor.org/info/rfc9773/
- MTC ドラフト: https://datatracker.ietf.org/doc/draft-ietf-plants-merkle-tree-certs/
- CA/Browser Forum SC-081v3: https://cabforum.org/2025/04/11/ballot-sc081v3-introduce-schedule-of-reducing-validity-and-data-reuse-periods/
- 更新情報への登録: http://cloudflare.com/resource/certificate-authority
- 関連スライド: [MTC によるポスト量子認証局](../pq-ca-with-mtcs/)、[PQ 暗号の可視化](../post-quantum-visibility/)
- 関連スライド（暗号利用の発見・PQ 移行計画）: [▶ 解説スライド](../ai-driven-cryptography-discovery/)
- Wiki: [docs/articles/2026-09-29-cloudflare-certificate-authority.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-29-cloudflare-certificate-authority.md)
