// クイズ HTML テンプレート。
//
// quizzes/<slug>.yaml のデータ（title / slug / sourceUrl / wiki / questions[]）から
// 自己完結の理解度テスト HTML（外部 CDN 不使用、CSS/JS インライン）を生成する。
//
// フィールドの扱い:
//   - title / sourceUrl / wiki のリンクテキストなど「プレーンテキスト」はエスケープして挿入する。
//   - q（問題文）/ choices（選択肢）/ explanation（解説）は、記事中の識別子を <code>...</code> や
//     <strong>...</strong> で強調する目的で意図的にインライン HTML を含む場合があるため、
//     エスケープせずそのまま挿入する（信頼できる自リポジトリ内のデータのみを対象とする）。
//   - code（コード読解問題のコード）は <pre><code> 内にそのまま表示するテキストなので、
//     必ず HTML エスケープしてから挿入する。

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const QUIZ_CSS = readFileSync(path.join(__dirname, "quiz.css"), "utf8");
const QUIZ_JS = readFileSync(path.join(__dirname, "quiz.js"), "utf8");

const CHOICE_LETTERS = ["A", "B", "C", "D", "E", "F"];

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderQuestion(question, index) {
  const qid = `q${index + 1}`;
  const answerIndex = question.answer;
  const answerLetter = CHOICE_LETTERS[answerIndex] ?? "?";
  const answerChoiceHtml = question.choices[answerIndex] ?? "";

  const codeBlock = question.code
    ? `<pre><code${question.codeLang ? ` class="language-${escapeHtml(question.codeLang)}"` : ""}>${escapeHtml(
        question.code.replace(/\n$/, "")
      )}</code></pre>`
    : "";

  const choicesHtml = question.choices
    .map((choice, choiceIndex) => {
      const letter = CHOICE_LETTERS[choiceIndex] ?? "?";
      return `      <li><label><input type="radio" name="${qid}" value="${choiceIndex}"> ${letter}. ${choice}</label></li>`;
    })
    .join("\n");

  return `  <div class="question" data-qid="${qid}" data-answer="${answerIndex}">
    <h2><span class="qnum">Q${index + 1}.</span>${question.q}</h2>
${codeBlock ? `    ${codeBlock}\n` : ""}    <ul class="choices">
${choicesHtml}
    </ul>
    <div class="result">
      <div class="verdict"></div>
      <div class="explanation">
        <strong>正解: ${answerLetter}. ${answerChoiceHtml}</strong><br>
        ${question.explanation}
      </div>
    </div>
  </div>`;
}

/**
 * @param {object} quiz - quizzes/<slug>.yaml をパースしたオブジェクト
 * @param {object} ctx
 * @param {string} ctx.wikiHref - サイト内で有効な Wiki ページへのリンク（BASE_PATH 込みの絶対パス）
 * @returns {string} 完成した HTML 文字列
 */
export function renderQuizPage(quiz, ctx) {
  const { wikiHref } = ctx;
  const title = quiz.title;
  const questionsHtml = quiz.questions.map(renderQuestion).join("\n\n");

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(`理解度テスト: ${title}`)}</title>
<style>
${QUIZ_CSS}</style>
</head>
<body>
<div class="container">

<header>
  <h1>${escapeHtml(`理解度テスト: ${title}`)}</h1>
  <p>原文: <a href="${escapeHtml(quiz.sourceUrl)}" target="_blank" rel="noopener">${escapeHtml(quiz.sourceUrl)}</a></p>
  <p>Wikiページ: <a href="${escapeHtml(wikiHref)}">${escapeHtml(wikiHref)}</a></p>
  <p>全${quiz.questions.length}問。基本→応用の順に並んでいます。すべて回答したら「採点する」ボタンを押してください。</p>
</header>

<form id="quiz-form">

${questionsHtml}

</form>

<div class="controls">
  <button id="grade-btn" type="button">採点する</button>
  <button id="reset-btn" type="button">リセット</button>
  <span id="score"></span>
</div>
<div id="unanswered-warning">すべての問題に回答してから採点してください（未回答の設問があります）。</div>

</div>

<script>
${QUIZ_JS}</script>

</body>
</html>
`;
}
