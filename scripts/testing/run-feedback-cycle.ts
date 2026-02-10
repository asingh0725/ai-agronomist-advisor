import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateScenarios } from "./generate-scenarios";
import type { BaselineRecord, ImmediateFeedback, TestScenario } from "./types";
import {
  generateRecommendation,
  type RecommendationOutput,
} from "@/lib/ai/agents/recommendation";
import { searchImageChunks, searchTextChunks } from "@/lib/retrieval/search";
import { assembleContext } from "@/lib/retrieval/context-assembly";

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [k, ...rest] = arg.replace(/^--/, "").split("=");
    return [k, rest.join("=") || "true"];
  })
);

const mode = (args.get("mode") || "mock") as "live" | "mock";
const count = Number(args.get("count") || 100);
const outputName = args.get("out") || `baseline-${mode}-${count}.json`;
const outputPath = resolve(process.cwd(), "data/testing", outputName);

function simulateRecommendation(scenario: TestScenario): RecommendationOutput {
  const scenarioNum = Number(scenario.id.split("_")[1] || "0");
  const includeCount = scenarioNum % 5 === 0 ? 1 : scenario.mustInclude.length;
  const includedMusts = scenario.mustInclude.slice(0, includeCount);
  const addRiskyPhrase = scenarioNum % 9 === 0;

  return {
    diagnosis: {
      condition: scenario.expectedDiagnosis,
      conditionType: scenario.expectedConditionType,
      confidence: scenario.category === "edge_case" ? 0.62 : 0.81,
      reasoning: `Pattern matched to ${scenario.expectedDiagnosis} based on ${scenario.symptoms}.`,
    },
    recommendations: [
      {
        action:
          "Confirm diagnosis with targeted scouting and diagnostic testing",
        priority: "immediate",
        timing: `Within 24-48 hours at ${scenario.growthStage}`,
        details:
          includedMusts.join("; ") +
          (addRiskyPhrase ? "; single high-rate burn risk advice" : ""),
        citations: ["sim_chunk_1", "sim_chunk_2"],
      },
      {
        action:
          "Implement risk-reducing treatment plan aligned to local thresholds",
        priority: "soon",
        details: `Use local extension thresholds for ${scenario.crop} in ${scenario.region}.`,
        citations: ["sim_chunk_3"],
      },
    ],
    products: [],
    sources:
      scenarioNum % 7 === 0
        ? []
        : [
            {
              chunkId: "sim_chunk_1",
              relevance: 0.83,
              excerpt: `${scenario.crop} guidance aligned with ${scenario.expectedDiagnosis}`,
            },
          ],
    confidence: scenario.category === "edge_case" ? 0.6 : 0.82,
  };
}

function containsAny(text: string, phrases: string[]): boolean {
  const lc = text.toLowerCase();
  return phrases.some((phrase) => lc.includes(phrase.toLowerCase()));
}

function evaluateExpertFeedback(
  scenario: TestScenario,
  recommendation: RecommendationOutput
): ImmediateFeedback {
  const recommendationBlob = [
    recommendation.diagnosis.condition,
    recommendation.diagnosis.reasoning,
    ...recommendation.recommendations.map(
      (r) => `${r.action} ${r.details} ${r.timing || ""}`
    ),
  ].join(" ");

  const whatWasGood: string[] = [];
  const whatWasWrongOrMissing: string[] = [];
  const issueTags: string[] = [];

  const diagnosisMatch = recommendation.diagnosis.condition
    .toLowerCase()
    .includes(scenario.expectedDiagnosis.toLowerCase().split(" ")[0]);

  const conditionTypeMatch =
    recommendation.diagnosis.conditionType === scenario.expectedConditionType;

  if (diagnosisMatch) {
    whatWasGood.push("Diagnosis aligned with expected agronomic pattern.");
  } else {
    whatWasWrongOrMissing.push(
      `Expected diagnosis around "${scenario.expectedDiagnosis}".`
    );
    issueTags.push("Diagnosis incorrect");
  }

  if (conditionTypeMatch) {
    whatWasGood.push("Condition type classification is plausible.");
  } else {
    whatWasWrongOrMissing.push("Condition type did not match scenario class.");
    issueTags.push("Missing key information");
  }

  const missingMust = scenario.mustInclude.filter(
    (x) => !containsAny(recommendationBlob, [x])
  );
  if (missingMust.length === 0) {
    whatWasGood.push(
      "Included all required high-value agronomy checks for this scenario."
    );
  } else {
    whatWasWrongOrMissing.push(
      `Missing critical items: ${missingMust.join(", ")}.`
    );
    issueTags.push("Missing key information");
  }

  const shouldAvoidViolated = scenario.shouldAvoid.filter((x) =>
    containsAny(recommendationBlob, [x])
  );
  if (shouldAvoidViolated.length > 0) {
    whatWasWrongOrMissing.push(
      `Contains risky guidance to avoid: ${shouldAvoidViolated.join(", ")}.`
    );
    issueTags.push("Recommendations impractical");
  }

  if (recommendation.sources.length === 0) {
    whatWasWrongOrMissing.push("No supporting sources were cited.");
    issueTags.push("Missing key information");
  } else {
    whatWasGood.push("Provides evidence traceability via source citations.");
  }

  const accuracyRating = Math.max(
    1,
    5 -
      (diagnosisMatch ? 0 : 2) -
      (conditionTypeMatch ? 0 : 1) -
      Math.min(2, missingMust.length)
  );
  const overallRating = Math.max(
    1,
    5 -
      (issueTags.length > 0 ? 1 : 0) -
      (recommendation.confidence > 0.9 && scenario.category === "edge_case"
        ? 1
        : 0)
  );

  const helpful = overallRating >= 4 && accuracyRating >= 4;

  const recommendToFarmer =
    overallRating >= 5 ? "yes" : overallRating >= 3 ? "yes_with_changes" : "no";

  const simulatedOutcome = {
    applied: helpful,
    success: helpful
      ? ("yes" as const)
      : accuracyRating >= 3
        ? ("partial" as const)
        : ("no" as const),
    notes: helpful
      ? `Expected visible improvement in 5-10 days for ${scenario.crop}.`
      : "Would require agronomist revision before recommending field implementation.",
  };

  return {
    helpful,
    overallRating,
    accuracyRating,
    whatWasGood,
    whatWasWrongOrMissing,
    issueTags: [...new Set(issueTags)],
    recommendToFarmer,
    simulatedOutcome,
  };
}

async function generateLiveRecommendation(
  scenario: TestScenario
): Promise<RecommendationOutput> {
  const query = `${scenario.crop} ${scenario.symptoms} ${scenario.region} ${scenario.growthStage}`;
  const textResults = await searchTextChunks(query, 8);
  const imageResults = await searchImageChunks(query, 4);
  const context = await assembleContext(textResults, imageResults);

  return generateRecommendation(
    {
      type: "photo",
      crop: scenario.crop,
      location: scenario.region,
      description: `${scenario.symptoms}. Growth stage: ${scenario.growthStage}`,
    },
    context
  );
}

async function main() {
  mkdirSync(resolve(process.cwd(), "data/testing"), { recursive: true });

  const scenarioPath = args.get("scenarios");
  const scenarios = scenarioPath
    ? (
        JSON.parse(
          readFileSync(resolve(process.cwd(), scenarioPath), "utf-8")
        ) as TestScenario[]
      ).slice(0, count)
    : generateScenarios().slice(0, count);
  const records: BaselineRecord[] = [];

  console.log(
    `Running ${scenarios.length} recommendation tests in ${mode} mode...`
  );

  for (const scenario of scenarios) {
    const recommendationId = `rec_${scenario.id}`;

    const recommendation =
      mode === "live"
        ? await generateLiveRecommendation(scenario)
        : simulateRecommendation(scenario);

    const feedback = evaluateExpertFeedback(scenario, recommendation);

    records.push({
      recommendationId,
      scenario,
      diagnosis: {
        condition: recommendation.diagnosis.condition,
        conditionType: recommendation.diagnosis.conditionType,
        confidence: recommendation.diagnosis.confidence,
      },
      recommendationText: recommendation.recommendations.map(
        (r) => `${r.action}: ${r.details}`
      ),
      sourceCount: recommendation.sources.length,
      createdAt: new Date().toISOString(),
      feedback,
    });

    console.log(
      `${recommendationId} | ${scenario.category} | overall=${feedback.overallRating} accuracy=${feedback.accuracyRating} helpful=${feedback.helpful ? "yes" : "no"}`
    );
  }

  writeFileSync(outputPath, `${JSON.stringify(records, null, 2)}\n`, "utf-8");
  console.log(
    `Saved ${records.length} evaluated recommendations to ${outputPath}`
  );
}

main().catch((error) => {
  console.error("Feedback cycle failed:", error);
  process.exit(1);
});
