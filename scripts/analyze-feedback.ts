import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { BaselineRecord } from "./testing/types";

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [k, ...rest] = arg.replace(/^--/, "").split("=");
    return [k, rest.join("=") || "true"];
  })
);

const inputPath = resolve(
  process.cwd(),
  args.get("input") || "data/testing/baseline-mock-100.json"
);
const outputPath = resolve(
  process.cwd(),
  args.get("out") || "data/testing/analysis-summary.json"
);

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function main() {
  const records = JSON.parse(
    readFileSync(inputPath, "utf-8")
  ) as BaselineRecord[];

  const categoryBuckets = new Map<string, BaselineRecord[]>();
  const issueCounts = new Map<string, number>();

  for (const record of records) {
    if (!categoryBuckets.has(record.scenario.category)) {
      categoryBuckets.set(record.scenario.category, []);
    }
    categoryBuckets.get(record.scenario.category)!.push(record);

    for (const issue of record.feedback.issueTags) {
      issueCounts.set(issue, (issueCounts.get(issue) || 0) + 1);
    }
  }

  const summary = {
    totalRecommendations: records.length,
    avgOverallRating: Number(
      average(records.map((r) => r.feedback.overallRating)).toFixed(2)
    ),
    avgAccuracyRating: Number(
      average(records.map((r) => r.feedback.accuracyRating)).toFixed(2)
    ),
    helpfulRate: Number(
      (
        records.filter((r) => r.feedback.helpful).length /
        Math.max(records.length, 1)
      ).toFixed(3)
    ),
    issueRate: Number(
      (
        records.filter((r) => r.feedback.issueTags.length > 0).length /
        Math.max(records.length, 1)
      ).toFixed(3)
    ),
    topIssues: [...issueCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([issue, count]) => ({ issue, count })),
    categories: [...categoryBuckets.entries()].map(([category, rows]) => ({
      category,
      count: rows.length,
      avgOverall: Number(
        average(rows.map((r) => r.feedback.overallRating)).toFixed(2)
      ),
      avgAccuracy: Number(
        average(rows.map((r) => r.feedback.accuracyRating)).toFixed(2)
      ),
      helpfulRate: Number(
        (
          rows.filter((r) => r.feedback.helpful).length /
          Math.max(rows.length, 1)
        ).toFixed(3)
      ),
      issueRate: Number(
        (
          rows.filter((r) => r.feedback.issueTags.length > 0).length /
          Math.max(rows.length, 1)
        ).toFixed(3)
      ),
    })),
  };

  const learnings = {
    promptTuning: [
      "Require a differential diagnosis line for every response, including what was ruled out and why.",
      "Force immediate mention of growth-stage timing windows and when action is too late to matter.",
      "Always include a validation step (soil test, tissue test, pest threshold, or diagnostic lab) before costly interventions.",
      "If confidence <0.75 or case is mixed, require explicit uncertainty language and escalation criteria.",
    ],
    sourcingModelTuning: [
      "Increase source diversity: cap chunks per source so recommendations do not overfit one document.",
      "Prioritize extension/government/research sources in context ranking for higher agronomic reliability.",
      "Require recommendation-level citations to map to at least one high-authority source chunk.",
      "Log retrieval depth and source-type distribution to detect citation blind spots.",
    ],
    validationTargets: {
      minAvgOverallRating: 4.2,
      minAvgAccuracyRating: 4.2,
      maxIssueRate: 0.3,
      minHelpfulRate: 0.75,
    },
  };

  writeFileSync(
    outputPath,
    `${JSON.stringify({ summary, learnings }, null, 2)}\n`,
    "utf-8"
  );

  console.log(`Loaded ${records.length} feedback records from ${inputPath}`);
  console.log(`Average overall rating: ${summary.avgOverallRating}/5`);
  console.log(`Average accuracy rating: ${summary.avgAccuracyRating}/5`);
  console.log(`Helpful rate: ${pct(summary.helpfulRate)}`);
  console.log(`Issue rate: ${pct(summary.issueRate)}`);
  console.log("Top issues:");
  for (const item of summary.topIssues) {
    console.log(`- ${item.issue}: ${item.count}`);
  }
  console.log(`Wrote analysis summary to ${outputPath}`);
}

main();
