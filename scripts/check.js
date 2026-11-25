const fs = require("fs");
const vm = require("vm");
const path = require("path");
const dir = path.join(__dirname, "..", "js", "data");
const context = { window: {} };
vm.createContext(context);
for (const file of fs.readdirSync(dir)) {
  vm.runInContext(fs.readFileSync(path.join(dir, file), "utf8"), context, { filename: file });
}

function score(quiz, answers) {
  const totals = {};
  quiz.results.forEach((r) => { totals[r.id] = 0; });
  answers.forEach((choice, i) => {
    Object.entries(quiz.questions[i].options[choice].w).forEach(([id, n]) => {
      if (totals[id] != null) totals[id] += n;
    });
  });
  const ranked = quiz.results.map((r) => ({ id: r.id, score: totals[r.id] })).sort((a, b) => b.score - a.score);
  return { ranked, top: ranked[0], second: ranked[1] };
}

let failed = 0;
for (const quiz of context.window.QUIZ_PACKS) {
  if (quiz.questions.length !== 10) {
    console.log("BAD LEN", quiz.id, quiz.questions.length);
    failed++;
  }
  const primary = {};
  const wins = {};
  quiz.results.forEach((r) => { primary[r.id] = 0; wins[r.id] = 0; });
  quiz.questions.forEach((q, qi) => {
    if (q.options.length !== 4) {
      console.log("BAD OPTS", quiz.id, qi);
      failed++;
    }
    const texts = new Set();
    q.options.forEach((opt) => {
      texts.add(opt.t);
      const entries = Object.entries(opt.w);
      if (!entries.length) {
        console.log("EMPTY W", quiz.id, qi);
        failed++;
      }
      entries.forEach(([id]) => {
        if (!quiz.results.some((r) => r.id === id)) {
          console.log("UNKNOWN", quiz.id, id);
          failed++;
        }
      });
      const max = Math.max(...entries.map((e) => e[1]));
      entries.filter((e) => e[1] === max).forEach(([id]) => { primary[id] += 1; });
    });
    if (texts.size !== q.options.length) {
      console.log("DUP OPTION", quiz.id, qi);
      failed++;
    }
  });
  const total = 4 ** quiz.questions.length;
  const answers = new Array(quiz.questions.length).fill(0);
  for (let n = 0; n < total; n++) {
    let x = n;
    for (let i = 0; i < answers.length; i++) {
      answers[i] = x % 4;
      x = Math.floor(x / 4);
    }
    wins[score(quiz, answers).top.id] += 1;
  }
  console.log("\n" + quiz.id);
  quiz.results.forEach((result) => {
    const count = wins[result.id];
    const mark = count ? "ok" : "MISS";
    if (!count) failed++;
    const share = ((count / total) * 100).toFixed(1);
    console.log(mark, result.name, share + "%", "primaries", primary[result.id]);
  });
}
console.log(failed ? "\nFAILED " + failed : "\nALL REACHABLE");
process.exit(failed ? 1 : 0);
