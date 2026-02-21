/**
 * GET /api/v1/admin/discovery/status
 *
 * Returns the current state of the automated Gemini source-discovery pipeline.
 * Shows per-status counts, overall progress, and a paginated list of
 * crop × region combinations with their last-run timestamps.
 *
 * Restricted to admin users (ADMIN_USER_IDS env var). If ADMIN_USER_IDS is
 * not set, any authenticated user can access this endpoint.
 */

import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { Pool } from 'pg';
import { withAuth } from '../auth/with-auth';
import type { AuthVerifier } from '../auth/types';
import { jsonResponse } from '../lib/http';
import { resolvePoolSslConfig, sanitizeDatabaseUrlForPool } from '../lib/store';

interface DiscoveryRow {
  id: string;
  crop: string;
  region: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  sourcesFound: number;
  lastDiscoveredAt: string | null;
  createdAt: string;
}

interface StatusCountRow {
  status: string;
  count: string;
}

interface TotalSourcesRow {
  total: string;
}

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL is required');
    pool = new Pool({
      connectionString: sanitizeDatabaseUrlForPool(databaseUrl),
      max: Number(process.env.PG_POOL_MAX ?? 6),
      ssl: resolvePoolSslConfig(),
    });
  }
  return pool;
}

function isAdminUser(userId: string): boolean {
  const adminIds = process.env.ADMIN_USER_IDS;
  if (!adminIds) return true; // open if env var not configured
  return adminIds
    .split(',')
    .map((id) => id.trim())
    .includes(userId);
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function buildGetDiscoveryStatusHandler(verifier?: AuthVerifier): APIGatewayProxyHandlerV2 {
  return withAuth(async (event, auth) => {
    if (!isAdminUser(auth.userId)) {
      return jsonResponse(
        { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { statusCode: 403 }
      );
    }

    const query = event.queryStringParameters ?? {};
    const statusFilter = query.status as string | undefined;
    const cropFilter = query.crop?.trim() || undefined;
    const regionFilter = query.region?.trim() || undefined;
    const page = parsePositiveInt(query.page, 1);
    const pageSize = Math.min(parsePositiveInt(query.pageSize, 50), 200);
    const offset = (page - 1) * pageSize;

    const db = getPool();

    try {
      // ── Status counts ──────────────────────────────────────────────────────
      const [statusCounts, totalSources] = await Promise.all([
        db.query<StatusCountRow>(
          `SELECT status, COUNT(*)::text AS count FROM "CropRegionDiscovery" GROUP BY status`
        ),
        db.query<TotalSourcesRow>(
          `SELECT COALESCE(SUM("sourcesFound"), 0)::text AS total FROM "CropRegionDiscovery"`
        ),
      ]);

      const stats: Record<string, number> = {
        pending: 0,
        running: 0,
        completed: 0,
        error: 0,
      };
      let total = 0;
      for (const row of statusCounts.rows) {
        const count = Number(row.count);
        stats[row.status] = count;
        total += count;
      }
      const sourcesTotal = Number(totalSources.rows[0]?.total ?? 0);
      const pct = total > 0 ? Math.round((stats.completed / total) * 1000) / 10 : 0;

      // ── Filtered rows ──────────────────────────────────────────────────────
      const conditions: string[] = [];
      const params: unknown[] = [];

      if (statusFilter && ['pending', 'running', 'completed', 'error'].includes(statusFilter)) {
        params.push(statusFilter);
        conditions.push(`status = $${params.length}`);
      }
      if (cropFilter) {
        params.push(`%${cropFilter}%`);
        conditions.push(`crop ILIKE $${params.length}`);
      }
      if (regionFilter) {
        params.push(`%${regionFilter}%`);
        conditions.push(`region ILIKE $${params.length}`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const [countResult, rowsResult] = await Promise.all([
        db.query<{ total: string }>(
          `SELECT COUNT(*)::text AS total FROM "CropRegionDiscovery" ${whereClause}`,
          params
        ),
        db.query<DiscoveryRow>(
          `SELECT
             id,
             crop,
             region,
             status,
             "sourcesFound" AS "sourcesFound",
             "lastDiscoveredAt",
             "createdAt"
           FROM "CropRegionDiscovery"
           ${whereClause}
           ORDER BY "lastDiscoveredAt" DESC NULLS LAST, crop ASC, region ASC
           OFFSET $${params.length + 1}
           LIMIT $${params.length + 2}`,
          [...params, offset, pageSize]
        ),
      ]);

      const filteredTotal = Number(countResult.rows[0]?.total ?? 0);
      const totalPages = Math.max(1, Math.ceil(filteredTotal / pageSize));

      const rows = rowsResult.rows.map((r) => ({
        id: r.id,
        crop: r.crop,
        region: r.region,
        status: r.status,
        sourcesFound: Number(r.sourcesFound),
        lastDiscoveredAt: r.lastDiscoveredAt ?? null,
        createdAt: r.createdAt,
      }));

      return jsonResponse(
        {
          stats: { total, ...stats },
          progress: { pct, sourcesTotal },
          rows,
          pagination: { page, pageSize, total: filteredTotal, totalPages },
        },
        { statusCode: 200 }
      );
    } catch (error) {
      console.error('[DiscoveryStatus] Query failed:', (error as Error).message);
      return jsonResponse(
        { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' } },
        { statusCode: 500 }
      );
    }
  }, verifier);
}

export const handler = buildGetDiscoveryStatusHandler();
