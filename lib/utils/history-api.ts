import type { HistoryFilters } from "@/lib/schemas/history-filters";
import type { RelationType } from "@/lib/schemas/relationships";
import type { RelationshipCardData } from "@/components/relationships/RelationshipCard";

export type Briefing = {
  id: number;
  summary: string;
  itemsProcessed: number;
  relationshipsFound: number;
  briefingDate: string;
  createdAt: string;
};

async function parseResponse<T>(response: Response): Promise<T> {
  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new Error("Server error — please try again");
  }

  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof (body as { error: unknown }).error === "string"
        ? (body as { error: string }).error
        : "Request failed";
    throw new Error(message);
  }

  return body as T;
}

export async function fetchBriefings(limit: number, offset: number, isDemo = false) {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  if (isDemo) {
    params.set("demo", "true");
  }

  const response = await fetch(`/api/briefings?${params.toString()}`);
  const body = await parseResponse<{
    data: { briefings: Briefing[]; total: number };
  }>(response);

  return body.data;
}

export function filterBriefingsByDate(
  briefings: Briefing[],
  startDate: string,
  endDate: string,
): Briefing[] {
  return briefings.filter((briefing) => {
    if (startDate && briefing.briefingDate < startDate) {
      return false;
    }

    if (endDate && briefing.briefingDate > endDate) {
      return false;
    }

    return true;
  });
}

export function buildRelationshipsParams(
  filters: HistoryFilters,
  briefingId: number,
  briefingDate: string,
): URLSearchParams {
  const params = new URLSearchParams({
    briefingId: String(briefingId),
    startDate: briefingDate,
    endDate: briefingDate,
    limit: "100",
    offset: "0",
  });

  if (filters.ticker) {
    params.set("ticker", filters.ticker);
  }

  if (filters.minConfidence !== null) {
    params.set("minConfidence", String(filters.minConfidence));
  }

  if (filters.relationTypes.length === 1) {
    params.set("relationType", filters.relationTypes[0]);
  }

  return params;
}

export function filterRelationshipsByType(
  relationships: RelationshipCardData[],
  relationTypes: RelationType[],
): RelationshipCardData[] {
  if (relationTypes.length === 0) {
    return relationships;
  }

  return relationships.filter((relationship) =>
    relationTypes.includes(relationship.relationType as RelationType),
  );
}

export async function fetchBriefingRelationships(
  filters: HistoryFilters,
  briefingId: number,
  briefingDate: string,
  isDemo = false,
): Promise<RelationshipCardData[]> {
  const params = buildRelationshipsParams(filters, briefingId, briefingDate);

  if (isDemo) {
    params.set("demo", "true");
  }

  const response = await fetch(`/api/relationships?${params.toString()}`);
  const body = await parseResponse<{
    data: { relationships: RelationshipCardData[]; total: number };
  }>(response);

  return filterRelationshipsByType(body.data.relationships, filters.relationTypes);
}