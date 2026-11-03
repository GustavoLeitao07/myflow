const test = require("node:test");
const assert = require("node:assert/strict");
const { recommendLocalModels } = require("../../src/helpers/myflowHardware");
const modelData = require("../../src/models/modelRegistryData.json");

const GB = 1024 ** 3;

test("picks a larger cleanup model as memory grows", () => {
  assert.equal(
    recommendLocalModels({ totalMemoryBytes: 32 * GB, cpuCount: 8 }).llm.model,
    "qwen3.5-9b-q4_k_m"
  );
  assert.equal(
    recommendLocalModels({ totalMemoryBytes: 16 * GB, cpuCount: 8 }).llm.model,
    "qwen3.5-4b-q4_k_m"
  );
  assert.equal(
    recommendLocalModels({ totalMemoryBytes: 8 * GB, cpuCount: 8 }).llm.model,
    "qwen3.5-2b-q4_k_m"
  );
  assert.equal(
    recommendLocalModels({ totalMemoryBytes: 4 * GB, cpuCount: 4 }).llm.model,
    "lfm2.5-1.2b-instruct-q4_k_m"
  );
});

test("drops a tier on machines with very few cores", () => {
  assert.equal(
    recommendLocalModels({ totalMemoryBytes: 16 * GB, cpuCount: 2 }).llm.model,
    "qwen3.5-2b-q4_k_m"
  );
});

test("falls back to a mid-size model when memory is unknown", () => {
  assert.equal(recommendLocalModels({}).llm.model, "qwen3.5-2b-q4_k_m");
});

test("every recommended model exists in the registry", () => {
  for (const gb of [2, 8, 16, 64]) {
    const { asr, llm } = recommendLocalModels({ totalMemoryBytes: gb * GB, cpuCount: 8 });
    const provider = modelData.localProviders.find((p) => p.id === llm.provider);
    assert.ok(
      provider?.models.some((m) => m.id === llm.model),
      `${llm.provider}/${llm.model}`
    );
    assert.ok(modelData.parakeetModels[asr.model], asr.model);
  }
});
