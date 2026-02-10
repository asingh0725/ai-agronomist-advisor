import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateScenarios } from "./generate-scenarios";
import type { BaselineRecord, ImmediateFeedback, TestScenario } from "./types";
import {
  generateRecommendation,
  type RecommendationOutput,
} from "@/lib/ai/agents/recommendation";
import { CLAUDE_MODEL } from "@/lib/ai/claude";
import { prisma } from "@/lib/prisma";
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
const persist = args.get("persist")
  ? args.get("persist") === "true"
  : mode === "live";
const userEmail = args.get("userEmail") || "testing-bot@ai-agronomist.local";

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

async function persistRecord(
  userId: string,
  recommendationId: string,
  scenario: TestScenario,
  recommendation: RecommendationOutput,
  feedback: ImmediateFeedback
): Promise<void> {
  const input = await prisma.input.create({
    data: {
      userId,
      type: "photo",
      crop: scenario.crop,
      location: scenario.region,
      description: `${scenario.symptoms}. Growth stage: ${scenario.growthStage}`,
      season: scenario.growthStage,
      labData: {
        scenarioId: scenario.id,
        category: scenario.category,
        expectedDiagnosis: scenario.expectedDiagnosis,
      },
    },
  });

  const recommendationRow = await prisma.recommendation.create({
    data: {
      id: recommendationId,
      userId,
      inputId: input.id,
      diagnosis: recommendation.diagnosis,
      confidence: recommendation.confidence,
      modelUsed: mode === "live" ? CLAUDE_MODEL : "mock-simulator",
      tokensUsed: null,
    },
  });

  if (recommendation.sources.length > 0) {
    for (const source of recommendation.sources) {
      const textChunk = await prisma.textChunk.findUnique({
        where: { id: source.chunkId },
        select: { id: true },
      });
      const imageChunk = !textChunk
        ? await prisma.imageChunk.findUnique({
            where: { id: source.chunkId },
            select: { id: true },
          })
        : null;

      await prisma.recommendationSource.create({
        data: {
          recommendationId: recommendationRow.id,
          textChunkId: textChunk?.id,
          imageChunkId: imageChunk?.id,
          relevanceScore: source.relevance,
        },
      });
    }
  }

  await prisma.feedback.create({
    data: {
      userId,
      recommendationId: recommendationRow.id,
      helpful: feedback.helpful,
      accuracyRating: feedback.accuracyRating,
      outcome: JSON.stringify(feedback.simulatedOutcome ?? null),
      comments: JSON.stringify({
        overallRating: feedback.overallRating,
        whatWasGood: feedback.whatWasGood,
        whatWasWrongOrMissing: feedback.whatWasWrongOrMissing,
        issueTags: feedback.issueTags,
        recommendToFarmer: feedback.recommendToFarmer,
      }),
    },
  });
}

async function main() {
  mkdirSync(resolve(process.cwd(), "data/testing"), { recursive: true });

  if (mode === "live") {
    if (
      !process.env.DATABASE_URL ||
      !process.env.ANTHROPIC_API_KEY ||
      !process.env.OPENAI_API_KEY
    ) {
      throw new Error(
        "Live mode requires DATABASE_URL, ANTHROPIC_API_KEY, and OPENAI_API_KEY to be set."
      );
    }
  }

  const scenarioPath = args.get("scenarios");
  const scenarios = scenarioPath
    ? (
        JSON.parse(
          readFileSync(resolve(process.cwd(), scenarioPath), "utf-8")
        ) as TestScenario[]
      ).slice(0, count)
    : generateScenarios().slice(0, count);

  const records: BaselineRecord[] = [];

  let userId = "";
  if (persist) {
    const user = await prisma.user.upsert({
      where: { email: userEmail },
      update: {},
      create: { email: userEmail },
      select: { id: true },
    });
    userId = user.id;
  }

  console.log(
    `Running ${scenarios.length} recommendation tests in ${mode} mode (persist=${persist})...`
  );

  for (const scenario of scenarios) {
    const recommendationId = `rec_${scenario.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    try {
      const recommendation =
        mode === "live"
          ? await generateLiveRecommendation(scenario)
          : simulateRecommendation(scenario);

      const feedback = evaluateExpertFeedback(scenario, recommendation);

      if (persist) {
        await persistRecord(
          userId,
          recommendationId,
          scenario,
          recommendation,
          feedback
        );
      }

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
    } catch (error) {
      console.error(`Failed scenario ${scenario.id}:`, error);
    }
  }

  writeFileSync(outputPath, `${JSON.stringify(records, null, 2)}\n`, "utf-8");
  console.log(
    `Saved ${records.length} evaluated recommendations to ${outputPath}`
  );

  if (persist) {
    const totalRecommendations = await prisma.recommendation.count({
      where: { userId },
    });
    const totalFeedback = await prisma.feedback.count({ where: { userId } });
    console.log(
      `Persisted rows for ${userEmail}: recommendations=${totalRecommendations}, feedback=${totalFeedback}`
    );
  }
}

main()
  .catch((error) => {
    console.error("Feedback cycle failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
