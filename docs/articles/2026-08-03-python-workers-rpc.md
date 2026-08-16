# Workers RPC が Python と JavaScript 間で利用可能に

- 原文: [https://blog.cloudflare.com/python-workers-rpc/](https://blog.cloudflare.com/python-workers-rpc/)（日本語版なし）
- 公開日: 2026-08-03
- 関連: [Agents Week 2026 まとめ](./2026-08-10-agents-week-review.md)（月曜日: 実行環境とインフラ）
- GitHub: [docs/articles/2026-08-03-python-workers-rpc.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-08-03-python-workers-rpc.md)

![ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01KZ0T9TN8SAPV2GRS5YR8YM4E.png)
*図: 記事ヘッダー画像（出典: Cloudflare Blog https://blog.cloudflare.com/python-workers-rpc/）*

## TL;DR

- Cloudflare Workers RPC（Cap'n Proto RPC を基盤として約2年前に導入された仕組み）が、**Python Workers と JavaScript Workers の間でのクロス言語呼び出し**に対応した。
- 呼び出し側からは通常の関数呼び出しと同じ感覚で扱え、JavaScript/TypeScript 側では Promise、Python 側では Future が返り、例外も呼び出し元に伝播する。
- Structured Cloneable な型は引数・戻り値としてそのまま受け渡せ、型は自動変換される（例: JavaScript の `Date` は Python の `datetime` に変換される）。
- 関数そのものを言語をまたいで渡すこともでき、呼び出されると新たな RPC 呼び出しが発生する。
- 同じスレッド内で動く Worker 同士の RPC は、ほぼゼロに近いオーバーヘッドで実行できる。実装は `workerd` と `workers-runtime-sdk` としてオープンソースで公開されている。

## 背景・課題

Python Workers は登場当初から、CPython を WebAssembly にコンパイルした **Pyodide** の上で動作しており、JavaScript とやり取りするための堅牢な Foreign Function Interface（FFI）を備えていた。一方、Workers RPC はこれまで JavaScript の実行環境内、その後はブラウザとサーバーの間で機能してきたが、**異なるプログラミング言語（Python と JavaScript）を書いた Worker 同士**を直接 RPC で繋ぐことには対応していなかった。

そのため、Python で書かれた Worker と JavaScript で書かれた Worker を組み合わせようとすると、これまでは独自の API を定義したり、protobuf のようなシリアライゼーション形式を用意したりする必要があった。今回の対応により、そうした追加のスキーマ定義やシリアライゼーションコードを書かずに、言語の境界を越えて透過的にメソッド呼び出しができるようになった。

## 発表内容 / アーキテクチャ

### RPC でできること

- クロス言語の RPC 呼び出しは通常の関数呼び出しのように振る舞い、JavaScript/TypeScript では Promise、Python では Future を返す。例外は呼び出し元にそのまま伝播する。
- Structured Cloneable な型はパラメータや戻り値としてそのまま渡せ、自動的に変換される。
- JavaScript の関数を Python Worker に渡したり、その逆を行ったりでき、渡された関数を呼び出すとその場で新しい RPC 呼び出しが発生する。
- 別の Worker への RPC は、多くの場合同一スレッド内で実行されるため、パフォーマンスオーバーヘッドはほぼゼロに近い。
- 実装は `workerd` および `workers-runtime-sdk` としてオープンソース化されている。

### 型変換の仕組み: Pyodide FFI

JavaScript の開発者は通常オブジェクト（Object）を引数として渡し、Python の開発者はキーワード引数を使う。両者の型システムの違いを開発者に意識させずに橋渡しするのが、今回の型変換戦略のゴールである。

Pyodide は登場当初から Python Workers を支えてきた技術であり、堅牢な FFI を備え、RPC 呼び出しの際に JavaScript と Python の型を自動的に変換する。対応関係の一部は次の通り。

| Python の型 | JavaScript での等価な型 |
|---|---|
| `int`, `float` | `Number` |
| `bool` | `Boolean` |
| `dict` | `Object` |
| `list` | `Array` |

直接変換できない独自クラスや関数については、Pyodide が **Proxy オブジェクト**を生成し、属性アクセスやメソッド呼び出しを転送する。また、Pyodide FFI は Python のキーワード引数を JavaScript のオブジェクト形式のパラメータにマッピングしてくれるため、開発者はどちらの言語でもそれぞれに慣用的な書き方のまま利用できる。

### Workers 固有オブジェクトの扱い

Pyodide FFI は標準的な組み込み型はうまく扱えるが、`Request`・`Response`・`Blob`・`File` のような Web API のオブジェクトについては自動的に理解できない。デフォルトのままだとこれらは単なる JavaScript の Proxy になってしまい、実装の詳細が Python 側のコードに漏れ出してしまう。

この問題に対応するため、Cloudflare は **`workers-runtime-sdk`** という Python パッケージを導入した。この SDK は RPC スタブをラップし、言語の境界を越えるオブジェクトをインターセプトして、それぞれの言語のネイティブな形に変換する。`from workers import Response` のように既存の Python Workers の書き方をしている開発者は、すでにこの変換レイヤーの恩恵を自動的に受けている。

## コード例

記事では、TypeScript の Worker から Python の Worker を呼ぶ最小例と、逆に Python の Worker から Pygments（Python 製のシンタックスハイライトライブラリ）を JavaScript 側から呼び出す実践的な例が示されている。

### 例1: TypeScript 側で RPC エントリポイントを定義する

```typescript
import { WorkerEntrypoint } from "cloudflare:workers";

export class RpcService extends WorkerEntrypoint {
    async add(a: number, b: number): Promise<number> {
        return a + b;
    }
}
```

**解説**: `WorkerEntrypoint` を継承した `RpcService` クラスに `add` メソッドを実装するだけで、他の Worker から RPC 経由で呼び出せるエントリポイントになる。

### 例2: Python 側から TypeScript の RPC メソッドを呼び出す

```python
from workers import Response, WorkerEntrypoint

class Default(WorkerEntrypoint):
    async def fetch(self, request):
        # Get the RPC stub from the TypeScript Worker.
        rpc = self.env.RPC

        # Call the TypeScript RPC method.
        result = await rpc.add(42, 144)

        return Response.json({"result": result})
```

サービスバインディングの設定は次のように行う。

```json
"services": [
  {
    "binding": "RPC",
    "service": "ts-rpc-server",
    "entrypoint": "RpcService"
  }
]
```

**解説**: `self.env.RPC` で TypeScript 側の Worker への RPC スタブを取得し、`await rpc.add(42, 144)` と、あたかもローカルの Python 関数を呼ぶのと同じ構文で TypeScript 側のメソッドを呼び出せている。引数の数値型・戻り値の数値型はいずれも意識せず自動的に変換される。

### 例3: JavaScript から Python の Pygments 実装を呼び出す（コード読解）

```javascript
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

Python 側の実装は次の通り。

```python
from pygments.formatters import HtmlFormatter
from pygments import highlight
from pygments.lexers import get_lexer_by_name
from workers import WorkerEntrypoint

class Default(WorkerEntrypoint):
    async def highlight_code(self, code: str, language: str) -> dict:
        # Retrieve the lexer for the language specified.
        lexer = get_lexer_by_name(language, stripall=True)

        # Create the formatter and run the highlighter on the specified code.
        formatter = HtmlFormatter(linenos=True, cssclass="highlight", style="monokai")
        highlighted_html = highlight(code, lexer, formatter)

        # Get the CSS for styling.
        css = formatter.get_style_defs(".highlight")

        return {
            "html": highlighted_html,
            "css": css
        }
```

サービスバインディングの設定:

```json
"services": [
  {
    "binding": "PYTHON_RPC",
    "service": "py-rpc-server"
  }
]
```

**解説**: JavaScript 側は `env.PYTHON_RPC` という素直な RPC スタブ越しに、Python 製の `highlight_code` メソッドを文字列引数2つで呼び出しているだけである。呼び出された Python 側では Pygments（Python エコシステムのシンタックスハイライトライブラリ）の `get_lexer_by_name` / `highlight` / `HtmlFormatter` を使い、`{"html": ..., "css": ...}` という辞書（`dict`）を返す。この `dict` は自動的に JavaScript の `Object` に変換され、呼び出し元でそのまま `Response.json(result)` としてレスポンスに詰められる。同等のシンタックスハイライト処理を JavaScript で書き直す必要がない、という点がこの例の要点である。

開発時は、それぞれのディレクトリで `wrangler dev` と `pywrangler dev` を別ターミナルで起動する。

```bash
git clone git@github.com:cloudflare/python-workers-examples.git
cd python-workers-examples/13-js-api-pygments/

# Terminal 1
cd ts/
npx wrangler dev

# Terminal 2
cd py/
uv run pywrangler dev
```

## ユースケース

### Python エコシステムのライブラリを JavaScript から利用する

コード例3が示す通り、Pygments のような Python 専用のライブラリを、JavaScript/TypeScript で書かれたアプリケーションのコードから書き直しなしで呼び出せる。Python にしかない、あるいは Python の方が成熟しているライブラリ資産を、JavaScript側のプロダクトに組み込む用途に向く。

### 複数言語で構成されたエージェントコンポーネントの統合

Agents Week 2026 の文脈では、AI エージェントのロジックを Python で書き、インフラや API 層を TypeScript/JavaScript で書くといった、言語をまたいだコンポーネント構成を組みやすくなる。RPC 呼び出しがほぼゼロオーバーヘッドである点は、頻繁にコンポーネント間でやり取りが発生するエージェントのアーキテクチャに向いている。

### 既存の JavaScript Worker 資産に Python の処理を後付けする

サービスバインディングを追加するだけで、既存の JavaScript Worker から新規に作成した Python Worker のメソッドを呼び出せるため、大規模な書き換えを行わずに機能を追加できる。

## 所感・ポイント

- 型変換を「Pyodide FFI が標準組み込み型を担当し、`workers-runtime-sdk` が Workers 固有型（Request/Response など）を担当する」という2層構造にした設計が明快である。すべてを1つのレイヤーで解決しようとせず、既存の Pyodide の資産を最大限再利用している点が実用的。
- Python のキーワード引数と JavaScript のオブジェクト引数という、互いに異なる「慣用的な書き方」を両方生かせるように変換している点は、開発者体験を損なわずに相互運用性を実現する好例といえる。
- Pygments の例は地味だが説得力があり、「言語ごとに強いライブラリエコシステムをそのまま活かせる」という Workers RPC のクロス言語対応の価値を端的に示している。

> **Workers サンプル**: [examples/python-workers-rpc/](../../examples/python-workers-rpc/) — TypeScript WorkerとPython Workerの間でRPC呼び出しを体験できる最小構成

## 関連リンク

- [Cap'n Proto RPC](https://capnproto.org/)
- [Workers RPC の初出発表（javascript-native-rpc）](https://blog.cloudflare.com/javascript-native-rpc/)
- [Cap'n Web](https://blog.cloudflare.com/capnweb-javascript-rpc-library/)
- [protobuf](https://protobuf.dev/)
- [Structured Cloneable types（MDN）](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#supported_types)
- [workerd リポジトリ](https://github.com/cloudflare/workerd/)
- [workers-runtime-sdk（rpc.py）](https://github.com/cloudflare/workers-py/blob/4bb01fe72a9af71918746e3851c526335302a3bc/packages/runtime-sdk/src/workers/rpc.py)
- [Service Bindings ドキュメント](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/)
- [Python Workers ガイド（FFI の解説）](https://blog.cloudflare.com/python-workers/#pyodide-and-the-magic-of-foreign-function-interfaces-ffi)
- [Pyodide ドキュメント（型変換）](https://pyodide.org/en/stable/usage/type-conversions.html)
- [pywrangler CLI ツール](https://developers.cloudflare.com/workers/languages/python/#the-pywrangler-cli-tool)
- [RPC ドキュメント](https://developers.cloudflare.com/workers/runtime-apis/rpc/)
- [Python Workers Examples（13-js-api-pygments）](https://github.com/cloudflare/python-workers-examples/tree/main/13-js-api-pygments)
