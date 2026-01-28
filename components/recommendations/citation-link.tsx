"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CitationLinkProps {
  sourceNumber: number;
  sourceTitle?: string;
  onClick?: () => void;
}

export function CitationLink({
  sourceNumber,
  sourceTitle,
  onClick,
}: CitationLinkProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-blue-600 hover:text-blue-800 font-medium align-super text-xs"
            onClick={onClick}
            aria-label={`View source ${sourceNumber}${sourceTitle ? `: ${sourceTitle}` : ""}`}
          >
            [{sourceNumber}]
          </Button>
        </TooltipTrigger>
        {sourceTitle && (
          <TooltipContent>
            <p className="max-w-xs">{sourceTitle}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
