// MyFlow: pick local models that fit the machine.
//
// Speech-to-text defaults to the bundled multilingual Orukeet model (≈670 MB,
// 25 languages including Portuguese and English), which runs on CPU anywhere the
// app runs. The cleanup / selection-editing LLM is sized by system memory, since
// llama-server keeps the whole model resident while it is loaded.

const GB = 1024 ** 3;

// Ordered from largest to smallest; the first tier the machine meets wins.
const LLM_TIERS = [
  { minMemoryGb: 24, provider: "qwen", model: "qwen3.5-9b-q4_k_m" },
  { minMemoryGb: 14, provider: "qwen", model: "qwen3.5-4b-q4_k_m" },
  { minMemoryGb: 7, provider: "qwen", model: "qwen3.5-2b-q4_k_m" },
  { minMemoryGb: 0, provider: "liquidai", model: "lfm2.5-1.2b-instruct-q4_k_m" },
];

const DEFAULT_ASR = { provider: "oruk", model: "orukeet-v0.1.0" };

function recommendLocalModels({ totalMemoryBytes, cpuCount } = {}) {
  const memoryGb = Number.isFinite(totalMemoryBytes) ? totalMemoryBytes / GB : 8;
  // Very few cores make a 4B+ model sluggish for interactive cleanup; drop a tier.
  const coreBudget = Number.isFinite(cpuCount) && cpuCount > 0 && cpuCount < 4 ? 1 : 0;
  let index = LLM_TIERS.findIndex((tier) => memoryGb >= tier.minMemoryGb);
  if (index === -1) index = LLM_TIERS.length - 1;
  index = Math.min(LLM_TIERS.length - 1, index + coreBudget);
  const llm = LLM_TIERS[index];
  return {
    memoryGb: Math.round(memoryGb * 10) / 10,
    cpuCount: cpuCount ?? null,
    asr: { ...DEFAULT_ASR },
    llm: { provider: llm.provider, model: llm.model },
  };
}

function readHardwareRecommendation() {
  const os = require("os");
  return recommendLocalModels({
    totalMemoryBytes: os.totalmem(),
    cpuCount: os.cpus()?.length,
  });
}

module.exports = { recommendLocalModels, readHardwareRecommendation, LLM_TIERS };
