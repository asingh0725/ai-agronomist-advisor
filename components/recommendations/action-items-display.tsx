"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ActionItem,
  getPriorityLabel,
  getPriorityColor,
} from "@/lib/utils/format-diagnosis";
import { Clock, AlertCircle, CheckCircle } from "lucide-react";

interface ActionItemsDisplayProps {
  actions: ActionItem[];
}

export function ActionItemsDisplay({ actions }: ActionItemsDisplayProps) {
  if (!actions || actions.length === 0) {
    return null;
  }

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          Recommended Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {actions.map((action, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-semibold text-gray-900">
                      {index + 1}.
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {action.action}
                    </h3>
                  </div>
                  {action.timing && (
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Timing:</strong> {action.timing}
                    </p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={`${getPriorityColor(action.priority)} flex items-center gap-1.5 px-3 py-1 whitespace-nowrap`}
                >
                  {getPriorityIcon(action.priority)}
                  {getPriorityLabel(action.priority)}
                </Badge>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {action.details}
                </p>
              </div>

              {action.citations && action.citations.length > 0 && (
                <div className="flex items-start gap-2 text-xs text-gray-500">
                  <span className="font-medium">Sources:</span>
                  <span>{action.citations.join(", ")}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
