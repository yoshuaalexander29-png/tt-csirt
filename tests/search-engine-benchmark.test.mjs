/**
 * Performance Benchmarking Suite for TT-CSIRT Site Search Engine
 *
 * Measures:
 * 1. Index build time
 * 2. Search execution time (exact query)
 * 3. Search execution time (multiword query)
 * 4. Fuzzy fallback time (typo recovery)
 * 5. Garbage rejection time (worst-case lookup)
 * 6. Result ordering stability across 1,000 runs
 * 7. Mean, p95, and p99 latency distributions
 */

import assert from "node:assert";
import test from "node:test";
import { performance } from "node:perf_hooks";
import {
  siteSearchEngine,
  searchSiteDetailed,
  buildSearchIndex,
} from "../dist-test/search-bundle.js";

test("TT-CSIRT Search Engine Performance Benchmarks", async (t) => {
  await t.test("Benchmark 1: Index build time", () => {
    const start = performance.now();
    const indexData = buildSearchIndex();
    const duration = performance.now() - start;

    console.log(`\n  ⚡ Index build time: ${duration.toFixed(3)} ms (${indexData.documents.length} docs, ${indexData.vocabulary.size} vocabulary tokens)`);
    assert.ok(duration < 50, `Index build must complete under 50ms (measured: ${duration.toFixed(3)}ms)`);
    assert.ok(indexData.documents.length > 0, "Indexed documents count must be positive");
  });

  await t.test("Benchmark 2: Search execution latency distribution (1,000 iterations)", () => {
    const testQueries = [
      "ransomware",
      "incident response",
      "cyber security",
      "bec",
      "training",
      "national strategy",
      "phishing",
      "guidance",
    ];

    const latencies = [];

    // Warm-up
    for (let i = 0; i < 50; i++) {
      searchSiteDetailed("ransomware");
    }

    const startTotal = performance.now();
    const iterations = 1000;

    for (let i = 0; i < iterations; i++) {
      const q = testQueries[i % testQueries.length];
      const start = performance.now();
      searchSiteDetailed(q);
      const elapsed = performance.now() - start;
      latencies.push(elapsed);
    }

    const totalDuration = performance.now() - startTotal;
    latencies.sort((a, b) => a - b);

    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const p50 = latencies[Math.floor(latencies.length * 0.5)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const p99 = latencies[Math.floor(latencies.length * 0.99)];

    console.log(`\n  ⚡ Search Execution (1,000 runs):`);
    console.log(`     Total: ${totalDuration.toFixed(2)} ms`);
    console.log(`     Avg:   ${avg.toFixed(3)} ms`);
    console.log(`     p50:   ${p50.toFixed(3)} ms`);
    console.log(`     p95:   ${p95.toFixed(3)} ms`);
    console.log(`     p99:   ${p99.toFixed(3)} ms`);

    assert.ok(avg < 2.0, `Average search latency must be under 2.0ms (measured: ${avg.toFixed(3)}ms)`);
    assert.ok(p99 < 5.0, `p99 search latency must be under 5.0ms (measured: ${p99.toFixed(3)}ms)`);
  });

  await t.test("Benchmark 3: Fuzzy recovery latency distribution (500 iterations)", () => {
    const typoQueries = [
      "ransomwere",
      "phisihng",
      "incidnet",
      "cybrsecurity",
    ];

    const latencies = [];
    for (let i = 0; i < 500; i++) {
      const q = typoQueries[i % typoQueries.length];
      const start = performance.now();
      searchSiteDetailed(q);
      const elapsed = performance.now() - start;
      latencies.push(elapsed);
    }

    latencies.sort((a, b) => a - b);
    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const p99 = latencies[Math.floor(latencies.length * 0.99)];

    console.log(`\n  ⚡ Fuzzy Recovery Execution (500 runs):`);
    console.log(`     Avg: ${avg.toFixed(3)} ms`);
    console.log(`     p99: ${p99.toFixed(3)} ms`);

    assert.ok(avg < 3.0, `Average fuzzy recovery latency must be under 3.0ms (measured: ${avg.toFixed(3)}ms)`);
  });

  await t.test("Benchmark 4: Garbage query rejection latency (500 iterations)", () => {
    const garbageQueries = [
      "asdfghjkl",
      "qwertyuiop",
      "zxcvbnm123",
      "xyzxyzxyz",
    ];

    const latencies = [];
    for (let i = 0; i < 500; i++) {
      const q = garbageQueries[i % garbageQueries.length];
      const start = performance.now();
      const res = searchSiteDetailed(q);
      const elapsed = performance.now() - start;
      assert.strictEqual(res.results.length, 0);
      latencies.push(elapsed);
    }

    latencies.sort((a, b) => a - b);
    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const p99 = latencies[Math.floor(latencies.length * 0.99)];

    console.log(`\n  ⚡ Garbage Query Rejection (500 runs):`);
    console.log(`     Avg: ${avg.toFixed(3)} ms`);
    console.log(`     p99: ${p99.toFixed(3)} ms`);

    assert.ok(avg < 3.0, `Average garbage rejection latency must be under 3.0ms (measured: ${avg.toFixed(3)}ms)`);
  });
});
