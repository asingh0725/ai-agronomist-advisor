"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ActionItem,
  getPriorityLabel,
  getPriorityColor,
} from "@/lib/utils/format-diagnosis";
import { Clock, AlertCircle, CheckCircle } from "lucide-react";
import { CitationLink } from "./citation-link";

interface ActionItemsDisplayProps {
  actions: ActionItem[];
  citationMap?: Map<string, number>;
  onCitationClick?: (sourceNumber: number) => void;
}

// Priority order for sorting
const PRIORITY_ORDER: Record<ActionItem["priority"], number> = {
  immediate: 0,
  soon: 1,
  when_convenient: 2,
};

export function ActionItemsDisplay({
  actions,
  citationMap,
  onCitationClick,
}: ActionItemsDisplayProps) {
  if (!actions || actions.length === 0) {
    return null;
  }

  // Sort actions by priority
  const sortedActions = [...actions].sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
  );

  const getPriorityIcon = (priority: ActionItem["priority"]) => {
    switch (priority) {
      case "immediate":
        return <AlertCircle className="h-4 w-4" />;
      case "soon":
        return <Clock className="h-4 w-4" />;
      case "when_convenient":
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  // Default to first 2 items expanded
  const defaultExpanded = sortedActions.slice(0, 2).map((_, i) => `action-${i}`);

  return (
    <Card className="print:shadow-none print:border-0">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          Recommended Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion
          type="multiple"
          defaultValue={defaultExpanded}
          className="space-y-3 print:space-y-4"
        >
          {sortedActions.map((action, index) => (
            <AccordionItem
              key={index}
              value={`action-${index}`}
              id={`action-${index}`}
              className="border border-gray-200 rounded-lg px-4 data-[state=open]:bg-gray-50/50 print:border-gray-300 print:[&[data-state=closed]]:block"
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-start justify-between gap-4 w-full pr-4">
                  <div className="flex items-center gap-3 text-left">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-sm font-semibold text-gray-700 shrink-0">
                      {index + 1}
                    </span>
                    <h3 className="text-base font-semibold text-gray-900">
                      {action.action}
                    </h3>
                  </div>
                  <Badge
                    variant="outline"
                    className={`${getPriorityColor(action.priority)} flex items-center gap-1.5 px-3 py-1 whitespace-nowrap shrink-0`}
                  >
                    {getPriorityIcon(action.priority)}
                    {getPriorityLabel(action.priority)}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="print:block print:!h-auto">
                <div className="space-y-3 pt-2">
                  {action.timing && (
                    <p className="text-sm text-gray-600">
                      <strong>Timing:</strong> {action.timing}
                    </p>
                  )}
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {action.details}
                    </p>
                  </div>
                  {action.citations && action.citations.length > 0 && citationMap && (
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <span>Sources:</span>
                      {action.citations.map((chunkId, i) => {
                        const sourceNumber = citationMap.get(chunkId);
                        if (sourceNumber === undefined) return null;
                        return (
                          <span key={chunkId}>
                            <CitationLink
                              sourceNumber={sourceNumber}
                              onClick={() => onCitationClick?.(sourceNumber)}
                            />
                            {i < action.citations.length - 1 && ","}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
