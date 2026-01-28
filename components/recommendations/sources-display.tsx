"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

interface Source {
  id: string;
  chunkId: string | null;
  type: string;
  content?: string | null;
  imageUrl?: string | null;
  relevanceScore: number | null;
  source: {
    id: string;
    title: string;
    type: string;
    url: string | null;
  } | null;
}

interface SourcesDisplayProps {
  sources: Source[];
}

function SourceCard({ source }: { source: Source }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const content = source.content || "";
  const shouldTruncate = content.length > 200;
  const displayContent = isExpanded ? content : content.slice(0, 200);

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          {source.source && (
            <div className="flex items-center gap-2 mb-1">
              {source.source.url ? (
                <a
                  href={source.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                >
                  {source.source.title}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <h4 className="font-medium text-gray-900">
                  {source.source.title}
                </h4>
              )}
            </div>
          )}
          {source.relevanceScore !== null && (
            <p className="text-sm text-gray-600">
              Relevance: {Math.round(source.relevanceScore * 100)}%
            </p>
          )}
        </div>
      </div>

      {content && (
        <div className="mt-3">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {displayContent}
            {shouldTruncate && !isExpanded && "..."}
          </p>
          {shouldTruncate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 h-auto p-0 text-blue-600 hover:text-blue-800 hover:bg-transparent"
            >
              {isExpanded ? (
                <>
                  Show less <ChevronUp className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  Read more <ChevronDown className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function SourcesDisplay({ sources }: SourcesDisplayProps) {
  // Sort sources by relevance (highest first)
  const sortedSources = [...sources].sort(
    (a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0)
  );

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">
          Sources ({sources.length})
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Knowledge base sources that informed this recommendation
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedSources.map((source) => (
            <SourceCard key={source.id} source={source} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
