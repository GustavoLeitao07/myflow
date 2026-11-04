const test = require("node:test");
const assert = require("node:assert/strict");

let tidyDictation;
test.before(async () => {
  ({ tidyDictation } = await import("../../src/utils/dictationTidy.js"));
});

test("removes English hesitations the speech model wrote out", () => {
  // Orukeet's real output for "um so I think we should uh move the meeting..."
  assert.equal(
    tidyDictation(
      "Um, so I think we should um move the meeting to Thursday at three p.m., because the client is traveling on Wednesday."
    ),
    "So I think we should move the meeting to Thursday at three p.m., because the client is traveling on Wednesday."
  );
  assert.equal(tidyDictation("I was, uh, going to call you."), "I was, going to call you.");
  assert.equal(tidyDictation("Hmm. Let me check that."), "Let me check that.");
});

test("removes Portuguese hesitations and keeps the article 'um'", () => {
  assert.equal(
    tidyDictation("Hã, eu queria um café e um pão de queijo."),
    "Eu queria um café e um pão de queijo."
  );
  assert.equal(tidyDictation("A reunião, ahn, vai ser amanhã."), "A reunião, vai ser amanhã.");
  assert.equal(tidyDictation("Então hum vamos começar."), "Então vamos começar.");
  assert.equal(tidyDictation("Éé, acho que sim."), "Acho que sim.");
});

test("leaves text without hesitations byte for byte", () => {
  for (const text of [
    "Bom dia, pessoal. Eu queria lembrar que a reunião de amanhã será às 10 horas na sala 2.",
    "Meet me at 3 p.m., because the client is busy.",
    "I hum a song while I work.",
    "Ha ha, that's funny. Ah, I see.",
    "Ele comprou um carro e um sofá.",
    "Humberto e Ummah chegaram.",
  ]) {
    assert.equal(tidyDictation(text), text);
  }
});

test("keeps a dictation made only of hesitations instead of pasting nothing", () => {
  assert.equal(tidyDictation("Hmm."), "Hmm.");
  assert.equal(tidyDictation("  "), "  ");
  assert.equal(tidyDictation(""), "");
});

test("drops the comma a removed hesitation leaves dangling", () => {
  assert.equal(tidyDictation("So, um, then we left."), "So, then we left.");
  assert.equal(tidyDictation("Uh, okay."), "Okay.");
});
