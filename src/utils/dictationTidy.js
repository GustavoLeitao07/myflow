// MyFlow: instant, rule-based tidy-up for dictations that skip the AI cleanup
// pass ("fast mode"). It only removes hesitation sounds the speech model wrote
// out ("uh", "hmm", "hã", "ahn"...) and repairs the punctuation and casing the
// removal leaves behind. It never rewrites real words, so it is safe to run on
// every raw transcript in any language.

// Hesitations that are never real words in English or Portuguese.
const ALWAYS_FILLERS = [
  "u+h+", // uh, uhh
  "u+h+m+", // uhm
  "e+r+m+", // erm
  "h+m+", // hm, hmm
  "m{2,}", // mm, mmm
  "h+ã+", // hã
  "ã+h+", // ãh
  "ã{2,}", // ãã
  "a+h+n+", // ahn
  "é{2,}", // éé
];

// "um" is a hesitation in English but the article "a/one" in Portuguese, so it is
// only removed from text that reads as English.
const ENGLISH_ONLY_FILLERS = ["u+m+"];
// "hum" is a Portuguese hesitation but an English verb ("I hum a tune").
const NON_ENGLISH_FILLERS = ["h+u+m+"];

const ENGLISH_MARKERS = new Set(
  "the and to is are was you i of that it this we they for with on so what have will would".split(
    " "
  )
);
const PORTUGUESE_MARKERS = new Set(
  "que de não nao uma para com é eu você voce o a os as do da no na em mas isso está esta".split(
    " "
  )
);

function looksEnglish(text) {
  let english = 0;
  let portuguese = 0;
  for (const word of text.toLowerCase().match(/[\p{L}']+/gu) || []) {
    if (ENGLISH_MARKERS.has(word)) english += 1;
    if (PORTUGUESE_MARKERS.has(word)) portuguese += 1;
  }
  return english > portuguese;
}

function fillerPattern(alternatives) {
  // A filler is a whole word, optionally followed by its own comma/ellipsis, and
  // never part of a longer word (Unicode-aware boundaries).
  return new RegExp(
    `(^|[^\\p{L}\\p{N}])(?:${alternatives.join("|")})(?![\\p{L}\\p{N}])(?:\\s*(?:,|\\.{3}|…))?`,
    "giu"
  );
}

const ENGLISH_PATTERN = fillerPattern([...ALWAYS_FILLERS, ...ENGLISH_ONLY_FILLERS]);
const OTHER_LANGUAGE_PATTERN = fillerPattern([...ALWAYS_FILLERS, ...NON_ENGLISH_FILLERS]);

/**
 * Removes the first filler in `text`, repairing only that spot: the spacing is
 * joined, a comma left dangling is dropped, and when the filler opened a
 * sentence the next word takes over its capital letter.
 */
function removeFirstFiller(text, pattern) {
  pattern.lastIndex = 0;
  const match = pattern.exec(text);
  if (!match) return null;

  const before = match[1];
  const filler = match[0].slice(before.length);
  let head = text.slice(0, match.index + before.length).replace(/[ \t]+$/, "");
  let tail = text.slice(match.index + match[0].length).replace(/^[ \t]+/, "");

  // "so, um, then" -> "so, then"; a comma must not open the text either.
  if ((/,$/.test(head) || !head.trim()) && tail.startsWith(",")) {
    tail = tail.slice(1).replace(/^[ \t]+/, "");
  }
  const opensSentence = !head.trim() || /[.!?]$/.test(head);
  // A filler that was a sentence of its own ("Hmm. Let me check") takes its full
  // stop with it.
  if (opensSentence && /^[.!?]/.test(tail)) tail = tail.slice(1).replace(/^[ \t]+/, "");
  if (opensSentence && /^\p{Lu}/u.test(filler)) {
    tail = tail.replace(/^(\P{L}*)(\p{Ll})/u, (_, prefix, letter) => prefix + letter.toUpperCase());
  }
  const joiner = head && tail && !/^[,.;:!?…)]/.test(tail) && !/[\s(]$/.test(head) ? " " : "";
  return head + joiner + tail;
}

/**
 * Removes spoken hesitations from a raw transcript. Only the spots where a
 * filler was removed are touched; everything else stays byte for byte.
 * @param {string} text
 * @returns {string}
 */
export function tidyDictation(text) {
  if (typeof text !== "string" || !text.trim()) return text;
  const pattern = looksEnglish(text) ? ENGLISH_PATTERN : OTHER_LANGUAGE_PATTERN;
  let current = text;
  // Each pass removes one filler, so the loop ends; the cap guards against a
  // pathological pattern ever matching an empty string.
  for (let i = 0; i < 200; i += 1) {
    const next = removeFirstFiller(current, pattern);
    if (next === null) break;
    current = next;
  }
  if (current === text) return text;
  const tidied = current.trim();
  // A dictation made only of hesitations keeps its original text rather than
  // pasting nothing.
  return tidied || text.trim();
}
