#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { loadEnvironmentConfig } from '../lib/config';
import { FoundationStack } from '../lib/stacks/foundation-stack';
import { ApiRuntimeStack } from '../lib/stacks/api-runtime-stack';
import { DatabaseStack } from '../lib/stacks/database-stack';
import { BudgetStack } from '../lib/stacks/budget-stack';

const app = new App();
const config = loadEnvironmentConfig();

const foundation = new FoundationStack(app, `${config.projectSlug}-${config.envName}-foundation`, {
  env: {
    account: config.accountId,
    region: config.region,
  },
  description: `Crop Copilot foundation infrastructure (${config.envName})`,
  config,
});

// AWS Budgets CloudFormation resources must be deployed to us-east-1 (N. Virginia)
// regardless of the application region. This is an AWS API requirement.
new BudgetStack(app, `${config.projectSlug}-${config.envName}-budget`, {
  env: {
    account: config.accountId,
    region: 'us-east-1', // HARDCODED — do not change
  },
  description: `Crop Copilot monthly cost budget (${config.envName})`,
  config,
  billingAlertsTopicArn: foundation.billingAlertsTopicArn,
});

const provisionAwsDatabase = process.env.PROVISION_AWS_DATABASE !== 'false';
const database =
  provisionAwsDatabase
    ? new DatabaseStack(app, `${config.projectSlug}-${config.envName}-database`, {
        env: {
          account: config.accountId,
          region: config.region,
        },
        description: `Crop Copilot PostgreSQL database (${config.envName})`,
        config,
      })
    : undefined;

new ApiRuntimeStack(app, `${config.projectSlug}-${config.envName}-api-runtime`, {
  env: {
    account: config.accountId,
    region: config.region,
  },
  description: `Crop Copilot API runtime (${config.envName})`,
  config,
  foundation,
  database,
});
