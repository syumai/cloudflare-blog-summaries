(function () {
  var form = document.getElementById('quiz-form');
  var questions = Array.prototype.slice.call(document.querySelectorAll('.question'));
  var gradeBtn = document.getElementById('grade-btn');
  var resetBtn = document.getElementById('reset-btn');
  var scoreEl = document.getElementById('score');
  var warningEl = document.getElementById('unanswered-warning');

  function grade() {
    var unanswered = questions.filter(function (q) {
      var name = q.getAttribute('data-qid');
      return !form.querySelector('input[name="' + name + '"]:checked');
    });

    if (unanswered.length > 0) {
      warningEl.style.display = 'block';
      unanswered[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    warningEl.style.display = 'none';

    var correctCount = 0;

    questions.forEach(function (q) {
      var name = q.getAttribute('data-qid');
      var answer = q.getAttribute('data-answer');
      var checked = form.querySelector('input[name="' + name + '"]:checked');
      var selected = checked ? checked.value : null;
      var isCorrect = selected === answer;
      if (isCorrect) correctCount++;

      var result = q.querySelector('.result');
      var verdict = q.querySelector('.verdict');
      result.classList.add('show');
      q.classList.remove('graded', 'is-correct', 'is-wrong');
      q.classList.add('graded', isCorrect ? 'is-correct' : 'is-wrong');
      result.classList.remove('correct', 'wrong');
      result.classList.add(isCorrect ? 'correct' : 'wrong');
      verdict.textContent = isCorrect ? '正解です！' : '不正解です';
    });

    scoreEl.textContent = correctCount + ' / ' + questions.length + ' 問正解';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function reset() {
    form.reset();
    questions.forEach(function (q) {
      var result = q.querySelector('.result');
      result.classList.remove('show', 'correct', 'wrong');
      q.classList.remove('graded', 'is-correct', 'is-wrong');
    });
    scoreEl.textContent = '';
    warningEl.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  gradeBtn.addEventListener('click', grade);
  resetBtn.addEventListener('click', reset);
})();
