---
routerMode: hash
theme: default
title: "Merkle Tree Certificates によるポスト量子認証局の構築"
info: |
  Merkle Tree Certificates によるポスト量子認証局の構築 の解説スライド。
  原文: https://blog.cloudflare.com/pq-ca-with-mtcs/
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

# Merkle Tree Certificates による<br>ポスト量子認証局の構築

Birthday Week 2026

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/pq-ca-with-mtcs/<br>
公開日: 2026-09-29
</div>

---

# TL;DR

- Cloudflare の CA は <strong>MTC（Merkle Tree Certificates）</strong>の発行に対応。Chrome の Quantum-resistant Root Store への 2027 年初頭の収録を目標に、標準的な MTC 発行は<strong>無料</strong>
- PQ 署名は古典署名の<strong>約 40 倍</strong>。そのまま証明書に入れると TLS と CT ログの負荷が許容できない
- MTC は証明書を追記専用の Merkle ツリーにまとめ、<strong>ルートだけに署名</strong>。クライアントは短い<strong>包含証明</strong>で検証
- Chrome Beta 146 の実験（数十億枚）で、landmark MTC は中央値で<strong>約 9% 高速</strong>

---

# アジェンダ

- 背景: 現在の信頼エコシステムと CT の課題
- PQ のスケーリング問題と MTC の基本アイデア
- CA の役割と、MTC 発行フロー
- landmark 最適化
- Chrome との実験結果
- 今後の課題・ユースケース・まとめ

---

# 背景: 現在の信頼エコシステム

- ブラウザ（TLS クライアント）が<strong>ルートプログラム</strong>で CA のポリシーを定める
- CA はドメインの所有を確認し、<strong>ドメイン名と公開鍵の結び付け</strong>を証明する
- CA が規則を守っているかを確かめるのが<strong>証明書の透明性（CT）</strong>: 証明書を少なくとも 2 つの公開ログへ提出
- Cloudflare は 2016 年から Nimbus ログを運用し、新たに静的 CT ログ群 <strong>Raio</strong> を開始する
- 監視者がログを見て、ドメイン所有者の想定と違う発行を検知する

---

# 現在の構成図

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3MX1T4PS2NJAV9AH8SENV1T.png" style="max-height: 330px; margin: 0 auto;" />

<div class="text-xs opacity-60 pt-2">出典: Cloudflare Blog https://blog.cloudflare.com/pq-ca-with-mtcs/（CA・CT ログ・監視者・TLS クライアントの関係。図の説明は図中ラベルから筆者が補った）</div>

---

# 課題: CT の透明性は「後付け」だった

- 証明書は複数ログに、異なる形式で、何度も記録される
- 監視者は見落としを避けるため<strong>すべてのログ</strong>をダウンロード・処理する必要がある
- コストが高く、多様なログ運用者を増やしにくい
- PQ 署名により、CT ログの保存データ量は<strong>40 倍</strong>に膨らむ見積もり

---

# PQ のスケーリング問題

- WebPKI は約 <strong>10 億台</strong>のサーバーを、公開鍵を全クライアントに事前配布せずに認証する必要がある
- 従来は証明書チェーンで信頼を配布。失効確認や CT で鍵と署名が増えた
- 典型的な TLS ハンドシェイクには<strong>署名 5 つと鍵 2 つ</strong>
- PQ 署名は約 40 倍大きい → クライアント・CA・ログ・監視者すべてに大きな負担
- 単純な差し替えでは、インターネット規模で性能が許容できない

---

# Merkle Tree Certificates（MTC）

IETF PLANTS ワーキンググループのドラフト仕様。

- 証明書を<strong>追記専用の Merkle ツリー</strong>にまとめる
- CA は個々の証明書ではなく<strong>ツリーのルートに署名</strong>
- クライアントは署名済みツリーヘッドに対し、ハッシュの並びである<strong>包含証明</strong>で検証
- 鍵となる考え方: <strong>"don't log what you issue, issue by logging"</strong>
- 発行とログを一体にし、透明性が「前提」になる

---

# 再設計された PKI における CA の役割

- 責務はほぼ同じ: ドメインの管理確認、公開鍵との結び付け、証明書発行
- 違い1: CA が Merkle ツリーに裏付けられた<strong>透明性ログ</strong>を保持。包含証明が<strong>トラストアンカー</strong>
- 違い2: <strong>ミラーリング・コサイナー</strong>が発行ログの写しを保存し、追記のみであることの整合性を検証
- Cloudflare は PQ PKI の要件とアーキテクチャを最初から設計できる

---

# MTC エコシステムの構成図

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3MX1H8EDNF1CP2D784KW8FR.png" style="max-height: 360px; margin: 0 auto;" />

<div class="text-xs opacity-60 pt-2">出典: Cloudflare Blog https://blog.cloudflare.com/pq-ca-with-mtcs/（CA・ミラー・監視者・TLS サーバー/クライアント。図の説明は図中ラベルから筆者が補った）</div>

---

# MTC の 2 つの形式

どちらも X.509 形式で符号化でき、現在のクライアントが認識できる。

| 形式 | 署名値の中身 | 特徴 |
|---|---|---|
| <strong>standalone</strong> | cosigned tree head と包含証明 | 単独で完結。大きな PQ 署名を送る |
| <strong>landmark-relative</strong> | 軽量な包含証明のみ | tree head を帯域外で入手できるクライアント向け。PQ 署名なし |

---

# 発行フロー（1）ドメイン確認とログ追記

1. サイトが <strong>ACME</strong> で証明書を要求。CA の ACME サーバーがドメイン管理を確認
2. 確認が通れば、CA がデータをシリアライズして<strong>追記専用ログ</strong>に追加

- ACME 基盤は Let's Encrypt が使う <strong>Boulder</strong> のフォーク。Let's Encrypt の MTC 対応を取り込み、Cloudflare 固有の改修を加え、可能なものは upstream へ還元

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3MX1PSVH1CJ1PY7H7PKPQX4.png" style="max-height: 130px; margin: 0 auto;" />

<div class="text-xs opacity-60">出典: Cloudflare Blog https://blog.cloudflare.com/pq-ca-with-mtcs/（図のキャプションは筆者が補った）</div>

---

# 発行フロー（2）署名とコサイナーの検証

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3MX1R818H67HP9AJS1QNAND.png" style="max-height: 280px; margin: 0 auto;" />

- CA がログ状態のチェックポイントに署名 → コサイナーが<strong>整合・形式・追記のみ</strong>を検証し、写しを永続保存して署名
- 別の場所に別の発行の見え方を示していない確信が得られ、CA のログが落ちても監視可能

<div class="text-xs opacity-60">出典: Cloudflare Blog https://blog.cloudflare.com/pq-ca-with-mtcs/</div>

---

# 発行フロー（3）MTC の構築

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3MX1JGCC0G09MSD9VCKBWV9.png" style="max-height: 130px; margin: 0 auto;" />

- コサイナーから cosignature を受け取った CA が、<strong>cosignature・サーバーの公開鍵・包含証明</strong>を含む MTC を構築してサーバーへ送る
- サーバーは以降の TLS でこの MTC を使う

<div class="text-xs opacity-60 pt-2">出典: Cloudflare Blog https://blog.cloudflare.com/pq-ca-with-mtcs/（図のキャプションは筆者が補った）</div>

---

# コサイナーの要件と Azul

- Chrome の Quantum-resistant Root Program ドラフトは<strong>少なくとも 2 つの cosignature</strong>を要求
  - Chrome 認定の、別組織が運用するミラーリング・コサイナー
  - 発行する MTC CA 自身
- Cloudflare は他のパイロット CA のミラーも運用し、自社発行証明書には<strong>独立した cosignature を 1 つ以上</strong>要求
- ミラーリング・コサイナーは、オープンソース Rust 製の透明性ログ <strong>Azul</strong> で実装
- 相互運用性のため c2sp の <strong>tlog mirror プロトコル</strong>に対応

---

# landmark 最適化

standalone は大きな PQ 署名を毎回送る。性能上の本命は <strong>landmark-relative</strong>。

- CA は有効な証明書を覆うサブツリーの並びを <strong>landmark</strong> として指定し、帯域外の更新サービスでクライアントへ配布
- ハンドシェイク時、ブラウザはサーバーの証明書データが信頼できるサブツリーに含まれることを確認
- 包含証明が cosigned な landmark につながり、公開鍵の所有が証明されれば認証完了
- 少数のバッチ署名で<strong>数十億枚</strong>の証明書を覆える

---

# landmark を含む構成図

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3MX1M0Z4J12THF1PT2M52CZ.png" style="max-height: 330px; margin: 0 auto;" />

<div class="text-xs opacity-60 pt-2">出典: Cloudflare Blog https://blog.cloudflare.com/pq-ca-with-mtcs/（ピン型が landmark。クライアントが既知の landmark をサーバーに伝える流れ。説明は図中ラベルから筆者が補った）</div>

---

# standalone のフォールバックは必要

- 新規インストール、オフライン、landmark の更新が未適用のクライアントがありうる
- landmark は standalone を<strong>不要にしない</strong>
- サーバーは<strong>standalone 証明書をフォールバックとして保持</strong>する必要がある

---

# Chrome との実験

- 発行パイプラインを模した <strong>bootstrap CA</strong>（偽の CA）で、従来のチェーンに裏付けた MTC を発行
- Cloudflare の free プランの一部ドメインを、<strong>Chrome Beta 146 の 50%</strong> に配信。<strong>数十億枚</strong>の MTC を提供
- landmark-relative のハンドシェイクは<strong>公開鍵 1 つ・署名 1 つ・1kB 未満の包含証明 1 つ</strong>
- landmark を交渉できない場合は、従来の証明書チェーンにフォールバック
- CT 側: ログは公開鍵のハッシュのみ、エントリごとの署名なし → <strong>証明書の爆発</strong>を防ぐ

---

# 実験結果: ハンドシェイク時間

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3MX1NGZQ01K3ZP2SSRNVK9A.png" style="max-height: 300px; margin: 0 auto;" />

- 中央値で<strong>約 9% 高速</strong>（105ms 対 116ms）。ただし大半は中間証明書の省略によるもの
- 古典署名での実験。PQ 署名ではさらに差が広がる見込み

<div class="text-xs opacity-60">出典: Cloudflare Blog https://blog.cloudflare.com/pq-ca-with-mtcs/（図中の数値を読み取った）</div>

---

# コード例の代わりに: 発行フローの要約

この記事にコードブロックはない。フローを整理すると次のとおり（記事中のコードではなく、筆者の要約）。

```text
ACME 要求 -> ドメイン確認 -> 追記専用ログにエントリ追加
  -> CA がチェックポイントに署名
  -> コサイナーが整合性検証 + cosignature
  -> CA が MTC（cosignature + 公開鍵 + 包含証明）を構築 -> サーバーへ
```

---

# ユースケース1: PQ 認証への移行

- 従来の証明書と MTC の両方を発行できる CA を使い、利用可能な最も安全な方式を既定にする
- 標準的な MTC の発行は無料
- Chrome の Quantum-resistant Root Store に収録されれば、ブラウザが MTC を受け入れる

---

# ユースケース2: ハンドシェイクの軽量化

- landmark-relative 証明書で、TLS では<strong>1kB 未満の包含証明</strong>のみ送る
- 重い PQ 署名を各接続で送らずに認証できる
- landmark を持たないクライアントには standalone または従来チェーンにフォールバック

---

# ユースケース3: CT 監視とダウングレード対策

- PQ 認証へ移行したドメインの所有者は、CT ログで<strong>予期しない従来型証明書の発行</strong>を監視
- 悪意あるダウングレード経路へのフォールバックを防ぐ
- MTC では発行ログが唯一の「正」なので、監視者は単一のログを取り込めばよい

---

# ユースケース4: ミラー・監視者の運用

- 他のパイロット CA のミラーリング・コサイナーを運用し、ログの写しを保存して整合性を確認
- 独立した監視者が、本番規模の MTC 発行ログを取り込んで検証
- 複数の CA とコサイナーが現れることで、エコシステムの耐障害性が高まる

---

# 今後の課題とスケジュール

- <strong>2027 年初頭</strong>: Chrome の Quantum-resistant Root Store への収録を目標。申請と厳格な審査が必要
- 実環境で答えを出すべき問い
  - 独立した監視者が本番規模でログを検証できるか
  - 複数の CA・コサイナーが現れるか
  - landmark の高速化とフォールバック経路を、ブラウザはどう両立するか
- 幅広い参加（ルートプログラム、ブラウザ、CA、ミラー、監視者）が必要

---

# まとめ・所感

- PQ 署名を小さくするのではなく、<strong>署名の数を減らす</strong>（ツリーのルートだけに署名）ことで PQ のスケーリング問題を解く設計
- 発行とログの一体化で、CT が後付けではなくなる。ただし独立したコサイナーに信頼が依存する
- 「約 9% 高速」は中間証明書の省略が大きく、PQ 署名での数値ではない点に注意
- 関連: CA 参入の発表 [▶ 解説スライド](../cloudflare-certificate-authority/)、TLS の PQ 鍵交換の可視化 [▶ 解説スライド](../post-quantum-visibility/)、IPsec の PQ 対応 [▶ 解説スライド](../ipsec-downgrade-protection/)
- デプロイ可能なサンプルは対象外（認証局の構築と仕様解説が中心で、一般利用可能な機能ではないため）

---

# 参考リンク

- 原文（en-us）: https://blog.cloudflare.com/pq-ca-with-mtcs/
- MTC ドラフト: https://datatracker.ietf.org/doc/draft-ietf-plants-merkle-tree-certs/
- IETF PLANTS WG: https://datatracker.ietf.org/group/plants/about/
- Chrome Root Program: https://googlechrome.github.io/chromerootprogram/index.html
- Azul: https://github.com/cloudflare/azul
- c2sp tlog mirror: http://c2sp.org/tlog-mirror
- 関連スライド: [CA 参入の発表](../cloudflare-certificate-authority/)、[IPsec 量子ダウングレード攻撃の防止](../ipsec-downgrade-protection/)、[PQ 暗号の可視化](../post-quantum-visibility/)
- 関連スライド（暗号利用の発見・PQ 移行計画）: [▶ 解説スライド](../ai-driven-cryptography-discovery/)
- Wiki: [docs/articles/2026-09-29-pq-ca-with-mtcs.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-29-pq-ca-with-mtcs.md)
