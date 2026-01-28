"use client";

import { useEffect, useRef, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BookOpen,
  FileText,
  Building2,
  GraduationCap,
  ArrowLeft,
} from "lucide-react";

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
    publisher?: string | null;
    publishedDate?: string | null;
  } | null;
}

interface SourcesPanelProps {
  sources: Source[];
  isOpen: boolean;
  onClose: () => void;
  highlightedSourceNumber?: number | null;
  citedByActions?: Map<string, number[]>; // chunkId -> action indices
  onBackReference?: (actionIndex: number) => void;
}

const SOURCE_TYPE_ICONS: Record<string, React.ReactNode> = {
  UNIVERSITY_EXTENSION: <GraduationCap className="h-4 w-4" />,
  RESEARCH_PAPER: <FileText className="h-4 w-4" />,
  GOVERNMENT: <Building2 className="h-4 w-4" />,
  DEFAULT: <BookOpen className="h-4 w-4" />,
};

function SourceCard({
  source,
  number,
  isHighlighted,
  citedByActions,
  onBackReference,
}: {
  source: Source;
  number: number;
  isHighlighted: boolean;
  citedByActions?: number[];
  onBackReference?: (actionIndex: number) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const content = source.content || "";
  const shouldTruncate = content.length > 200;
  const displayContent = isExpanded ? content : content.slice(0, 200);
  const relevancePercent = source.relevanceScore
    ? Math.round(source.relevanceScore * 100)
    : 0;

  useEffect(() => {
    if (isHighlighted && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isHighlighted]);

  const icon =
    SOURCE_TYPE_ICONS[source.source?.type || ""] || SOURCE_TYPE_ICONS.DEFAULT;

  return (
    <div
      ref={cardRef}
      id={`source-${number}`}
      className={`rounded-lg p-4 border transition-all duration-500 ${
        isHighlighted
          ? "bg-blue-50 border-blue-300 ring-2 ring-blue-200"
          : "bg-gray-50 border-gray-200"
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-bold shrink-0">
          {number}
        </span>
        <div className="flex-1 min-w-0">
          {source.source && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-gray-500">{icon}</span>
                {source.source.url ? (
                  <a
                    href={source.source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 truncate"
                  >
                    {source.source.title}
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                ) : (
                  <h4 className="font-medium text-gray-900 truncate">
                    {source.source.title}
                  </h4>
                )}
              </div>
              {(source.source.publisher || source.source.publishedDate) && (
                <p className="text-xs text-gray-500 mb-2">
                  {source.source.publisher}
                  {source.source.publisher && source.source.publishedDate && " • "}
                  {source.source.publishedDate}
                </p>
              )}
            </>
          )}

          {/* Relevance Progress Bar */}
          {source.relevanceScore !== null && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-gray-500 w-16">Relevance</span>
              <Progress value={relevancePercent} className="h-2 flex-1" />
              <span className="text-xs font-medium text-gray-700 w-10 text-right">
                {relevancePercent}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content Excerpt */}
      {content && (
        <div className="ml-10">
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

      {/* Back-references to actions */}
      {citedByActions && citedByActions.length > 0 && onBackReference && (
        <div className="ml-10 mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Cited in:</p>
          <div className="flex flex-wrap gap-1">
            {citedByActions.map((actionIndex) => (
              <Button
                key={actionIndex}
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => onBackReference(actionIndex)}
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                Action {actionIndex + 1}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function SourcesPanel({
  sources,
  isOpen,
  onClose,
  highlightedSourceNumber,
  citedByActions,
  onBackReference,
}: SourcesPanelProps) {
  // Sort sources by relevance (highest first)
  const sortedSources = [...sources].sort(
    (a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0)
  );

  // Clear highlight after 2 seconds
  const [localHighlight, setLocalHighlight] = useState<number | null>(null);

  useEffect(() => {
    if (highlightedSourceNumber !== null && highlightedSourceNumber !== undefined) {
      setLocalHighlight(highlightedSourceNumber);
      const timer = setTimeout(() => {
        setLocalHighlight(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [highlightedSourceNumber]);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Sources ({sources.length})</SheetTitle>
          <SheetDescription>
            Knowledge base sources that informed this recommendation
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4">
          {sortedSources.map((source, index) => {
            const sourceNumber = index + 1;
            const actionsCiting = source.chunkId
              ? citedByActions?.get(source.chunkId)
              : undefined;

            return (
              <SourceCard
                key={source.id}
                source={source}
                number={sourceNumber}
                isHighlighted={localHighlight === sourceNumber}
                citedByActions={actionsCiting}
                onBackReference={onBackReference}
              />
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
