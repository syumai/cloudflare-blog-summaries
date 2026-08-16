---
routerMode: hash
theme: default
themeConfig:
  primary: '#f6821f'
title: Workers RPC が Python と JavaScript 間で利用可能に
info: |
  Cloudflare Blog記事「Workers RPC が Python と JavaScript 間で利用可能に」の解説スライド。
  原文: https://blog.cloudflare.com/python-workers-rpc/
class: text-center
highlighter: shiki
drawings:
  persist: false
transition: slide-left
mdc: true
lineNumbers: true
---

# Workers RPC が
# Python と JavaScript 間で利用可能に

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/python-workers-rpc/<br>
公開日: 2026-08-03
</div>

---

# TL;DR

- Cloudflare Workers RPCが**Python WorkersとJavaScript Workers間のクロス言語呼び出し**に対応
- 通常の関数呼び出しと同じ感覚で扱え、JavaScript/TypeScript側は`Promise`、Python側は`Future`を返し、例外も呼び出し元に伝播
- Structured Cloneableな型はそのまま受け渡し可能で自動変換される（例: JavaScriptの`Date`はPythonの`datetime`に変換）
- 関数そのものも言語をまたいで渡すことができ、呼び出されると新たなRPC呼び出しが発生
- 同一スレッド内で動くWorker同士のRPCはほぼゼロオーバーヘッド。`workerd`と`workers-runtime-sdk`としてOSS公開

---

# アジェンダ


- 背景: Python Workers と Pyodide FFI
- 課題: 異なる言語の Worker 同士を RPC で繋ぐには
- 発表内容: クロス言語 RPC
- 型変換の仕組み: Pyodide FFI と `workers-runtime-sdk`
- コード例で見る: TypeScript ⇄ Python
- ユースケース
- まとめ


---

# 背景: Python Workers を支える Pyodide


- Python Workers は登場当初から **Pyodide**（CPython を WebAssembly にコンパイルしたもの）の上で動作
- Pyodide は JavaScript とやり取りするための堅牢な **Foreign Function Interface（FFI）** を備える
- 一方 Workers RPC はこれまで JavaScript 環境内、その後ブラウザ・サーバー間で機能してきた
- **Python と JavaScript の Worker 間の RPC** にはまだ対応していなかった


---

# 課題: 言語をまたぐ Worker の組み合わせ


> Python で書かれた Worker と JavaScript で書かれた Worker を組み合わせようとすると、
> 独自のAPI定義や protobuf のようなシリアライゼーション形式を
> 用意する必要があった



追加のスキーマ定義やシリアライゼーションコードを書かずに、
言語の境界を越えて**透過的にメソッド呼び出し**をしたい


---

# 発表内容: クロス言語 RPC


- クロス言語の RPC 呼び出しは通常の関数呼び出しのように振る舞う
  - JavaScript/TypeScript では `Promise`、Python では `Future` を返す
  - 例外は呼び出し元にそのまま伝播する
- Structured Cloneable な型は引数・戻り値としてそのまま渡せ、自動的に変換される
  - 例: JavaScript の `Date` → Python の `datetime`
- JavaScript の関数を Python Worker に渡す（その逆も可能）
  - 渡された関数を呼ぶと新しい RPC 呼び出しが発生する
- 同一スレッド内で動く Worker 同士の RPC は**ほぼゼロオーバーヘッド**
- 実装は `workerd` と `workers-runtime-sdk` としてOSS公開


---

# 型変換の仕組み①: Pyodide FFI


- JavaScript の開発者はオブジェクト（Object）を、Python の開発者はキーワード引数を使うのが自然
- Pyodide FFI が RPC 呼び出しの際に型を自動変換する


<div class="pt-4">

| Python の型 | JavaScript の等価な型 |
|---|---|
| `int`, `float` | `Number` |
| `bool` | `Boolean` |
| `dict` | `Object` |
| `list` | `Array` |

</div>


直接変換できない独自クラス・関数は **Proxy オブジェクト**として転送される


---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KYT1YP3XQB1NVNJ4C94AQ7G2.png
backgroundSize: contain
---

# Pyodide FFI の型変換フロー

Python のキーワード引数 ⇄ JavaScript のオブジェクト形式パラメータ

双方が慣用的な書き方のまま利用できるようマッピングされる

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/python-workers-rpc/
</footer>

---

# 型変換の仕組み②: Workers 固有オブジェクトの扱い


- Pyodide FFI は `Request` / `Response` / `Blob` / `File` などの Web API オブジェクトは自動理解できない
- デフォルトのままだと単なる JavaScript の Proxy になり、実装の詳細が Python 側に漏れる
- Cloudflare は **`workers-runtime-sdk`**（Python パッケージ）を導入
  - RPC スタブをラップし、言語境界を越えるオブジェクトをインターセプト
  - それぞれの言語のネイティブな形に変換
- `from workers import Response` を使う開発者はこの変換層を自動的に利用している


---
class: text-center
---

# コード例で見る:
# TypeScript ⇄ Python

---

# コード例① TypeScript 側の RPC エントリポイント

```ts {1|3-7|all}
import { WorkerEntrypoint } from "cloudflare:workers";

export class RpcService extends WorkerEntrypoint {
    async add(a: number, b: number): Promise<number> {
        return a + b;
    }
}
```


`WorkerEntrypoint` を継承した `RpcService` に `add` メソッドを実装するだけで、
他の Worker から RPC 経由で呼び出せるエントリポイントになる


---

# コード例② Python から TypeScript を呼ぶ

```py {1|4-8|all}
from workers import Response, WorkerEntrypoint

class Default(WorkerEntrypoint):
    async def fetch(self, request):
        # Get the RPC stub from the TypeScript Worker.
        rpc = self.env.RPC

        # Call the TypeScript RPC method.
        result = await rpc.add(42, 144)

        return Response.json({"result": result})
```

```json
"services": [
  { "binding": "RPC", "service": "ts-rpc-server", "entrypoint": "RpcService" }
]
```

---

# コード例② 解説


- `self.env.RPC` で TypeScript 側 Worker への RPC スタブを取得
- `await rpc.add(42, 144)` は、ローカルの Python 関数を呼ぶのと同じ構文
- 引数・戻り値の数値型はいずれも意識せず自動変換される


---

# コード例③ JavaScript から Python の Pygments を呼ぶ（コード読解）

```js {1-10}
export default {
    async fetch(request, env) {
        // Get the RPC stub from the Python Worker.
        const rpc = env.PYTHON_RPC;

        // Call the Python RPC method.
        const result = await rpc.highlight_code('print(42)', 'python');

        return Response.json(result);
    }
}
```

```py {1-3|5-6|8-13|15-16|all} {maxHeight:'260px'}
from pygments.formatters import HtmlFormatter
from pygments import highlight
from pygments.lexers import get_lexer_by_name
from workers import WorkerEntrypoint

class Default(WorkerEntrypoint):
    async def highlight_code(self, code: str, language: str) -> dict:
        lexer = get_lexer_by_name(language, stripall=True)

        formatter = HtmlFormatter(linenos=True, cssclass="highlight", style="monokai")
        highlighted_html = highlight(code, lexer, formatter)

        css = formatter.get_style_defs(".highlight")

        return {"html": highlighted_html, "css": css}
```

---

# コード例③ 解説


- JavaScript 側は `env.PYTHON_RPC` 越しに `highlight_code` を文字列2つで呼ぶだけ
- Python 側は Pygments（Python エコシステムのライブラリ）でハイライト処理を実装
- Python の `dict` は自動的に JavaScript の `Object` に変換され、そのまま `Response.json()` に渡せる
- **同等の処理を JavaScript で書き直す必要がない**、という点がこの例の要点


<div class="pt-4">

```bash
# Terminal 1
cd ts/ && npx wrangler dev
# Terminal 2
cd py/ && uv run pywrangler dev
```

</div>

---
class: text-center
---

# ユースケース

---

# ユースケース①: Python ライブラリの JS からの利用


- Pygments のような Python 専用ライブラリを、JavaScript/TypeScript から書き直しなしで呼び出す
- Python にしかない、あるいは Python の方が成熟しているライブラリ資産を活用できる


---

# ユースケース②: 複数言語のエージェントコンポーネント統合


- AI エージェントのロジックを Python、インフラ/API 層を TypeScript で書くといった構成を組みやすい
- RPC 呼び出しがほぼゼロオーバーヘッドなため、頻繁なやり取りが発生するエージェントアーキテクチャに向く


---

# ユースケース③: 既存 JS Worker への Python 処理の後付け


- サービスバインディングを追加するだけで、既存 JavaScript Worker から新規 Python Worker のメソッドを呼び出せる
- 大規模な書き換えを行わずに機能を追加できる


---

# まとめ


- Workers RPC が Python と JavaScript の間でも透過的に使えるようになった
- 型変換は「Pyodide FFI（標準型）＋ `workers-runtime-sdk`（Workers 固有型）」の2層構造
- Python のキーワード引数、JavaScript のオブジェクト引数、双方の慣用的な書き方をそのまま活かせる
- 言語ごとの強いライブラリエコシステムを、書き直しなしで組み合わせられる


---

<div class="text-center">

# 参考リンク

</div>

- 原文: [Workers RPC now works across Python and JavaScript](https://blog.cloudflare.com/python-workers-rpc/)
- [Cap'n Proto RPC](https://capnproto.org/)
- [Workers RPC の初出発表](https://blog.cloudflare.com/javascript-native-rpc/)
- [workerd リポジトリ](https://github.com/cloudflare/workerd/)
- [workers-runtime-sdk](https://github.com/cloudflare/workers-py/blob/4bb01fe72a9af71918746e3851c526335302a3bc/packages/runtime-sdk/src/workers/rpc.py)
- [Python Workers Examples（13-js-api-pygments）](https://github.com/cloudflare/python-workers-examples/tree/main/13-js-api-pygments)
- [Workers サンプル（examples/python-workers-rpc/）](https://github.com/syumai/cloudflare-blog-summaries/tree/main/examples/python-workers-rpc)

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-08-03-python-workers-rpc.md
</div>
