import { count, eq, sql, type SQL } from "drizzle-orm";

import { db, relationships, watchlists } from "@/lib/db";
import type { RelationType } from "@/lib/schemas/relationships";

const TOP_CONNECTED_LIMIT = 5;

export type GraphStats = {
  nodeCount: number;
  edgeCount: number;
  mostConnected: Array<{
    company: string;
    ticker: string | null;
    connectionCount: number;
  }>;
  relationTypeCounts: Record<RelationType, number>;
  watchlistCoverage: {
    onGraph: number;
    total: number;
  };
};

const RELATION_TYPES: RelationType[] = [
  "partnership",
  "supply_chain",
  "executive_mention",
  "product_collaboration",
  "investment",
];

function emptyRelationTypeCounts(): Record<RelationType, number> {
  return Object.fromEntries(
    RELATION_TYPES.map((type) => [type, 0]),
  ) as Record<RelationType, number>;
}

type QueryResult<T> = { rows: T[] };

async function queryRows<T>(query: SQL): Promise<T[]> {
  const result = (await db.execute(query)) as QueryResult<T>;
  return result.rows;
}

export async function getGraphStats(userId: string): Promise<GraphStats> {
  const userFilter = eq(relationships.userId, userId);

  const [
    [{ edgeCount }],
    typeRows,
    nodeCountRows,
    mostConnectedRows,
    coverageRows,
    [{ watchlistTotal }],
  ] = await Promise.all([
    db.select({ edgeCount: count() }).from(relationships).where(userFilter),
    db
      .select({
        relationType: relationships.relationType,
        count: count(),
      })
      .from(relationships)
      .where(userFilter)
      .groupBy(relationships.relationType),
    queryRows<{ nodeCount: number }>(sql`
      SELECT COUNT(*)::int AS "nodeCount"
      FROM (
        SELECT ${relationships.sourceCompany} AS company
        FROM ${relationships}
        WHERE ${relationships.userId} = ${userId}
        UNION
        SELECT ${relationships.targetCompany} AS company
        FROM ${relationships}
        WHERE ${relationships.userId} = ${userId}
      ) AS companies
    `),
    queryRows<{
      company: string;
      ticker: string | null;
      connectionCount: number;
    }>(sql`
      WITH endpoints AS (
        SELECT
          ${relationships.sourceCompany} AS company,
          ${relationships.sourceTicker} AS ticker
        FROM ${relationships}
        WHERE ${relationships.userId} = ${userId}
        UNION ALL
        SELECT
          ${relationships.targetCompany} AS company,
          ${relationships.targetTicker} AS ticker
        FROM ${relationships}
        WHERE ${relationships.userId} = ${userId}
      )
      SELECT
        company,
        MAX(ticker) AS ticker,
        COUNT(*)::int AS "connectionCount"
      FROM endpoints
      GROUP BY company
      ORDER BY "connectionCount" DESC
      LIMIT ${TOP_CONNECTED_LIMIT}
    `),
    queryRows<{ onGraph: number }>(sql`
      SELECT COUNT(*)::int AS "onGraph"
      FROM ${watchlists}
      WHERE ${watchlists.userId} = ${userId}
        AND ${watchlists.ticker} IN (
          SELECT ticker
          FROM (
            SELECT ${relationships.sourceTicker} AS ticker
            FROM ${relationships}
            WHERE ${relationships.userId} = ${userId}
              AND ${relationships.sourceTicker} IS NOT NULL
            UNION
            SELECT ${relationships.targetTicker} AS ticker
            FROM ${relationships}
            WHERE ${relationships.userId} = ${userId}
              AND ${relationships.targetTicker} IS NOT NULL
          ) AS graph_tickers
        )
    `),
    db
      .select({ watchlistTotal: count() })
      .from(watchlists)
      .where(eq(watchlists.userId, userId)),
  ]);

  const relationTypeCounts = emptyRelationTypeCounts();
  for (const row of typeRows) {
    const type = row.relationType as RelationType;
    if (type in relationTypeCounts) {
      relationTypeCounts[type] = Number(row.count);
    }
  }

  return {
    nodeCount: nodeCountRows[0]?.nodeCount ?? 0,
    edgeCount: Number(edgeCount),
    mostConnected: mostConnectedRows.map((row) => ({
      company: row.company,
      ticker: row.ticker,
      connectionCount: row.connectionCount,
    })),
    relationTypeCounts,
    watchlistCoverage: {
      onGraph: coverageRows[0]?.onGraph ?? 0,
      total: Number(watchlistTotal),
    },
  };
}