import { PDFParse } from "pdf-parse";
import type { ParsedContent } from "../scrapers/types";

// Custom error class for invalid PDF
class InvalidPDFException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPDFException";
  }
}

/**
 * Parse PDF content using pdf-parse v2
 * Docs: https://www.npmjs.com/package/pdf-parse
 */
export async function parsePDF(
  sourceUrl: string
): Promise<ParsedContent> {
  const parser = new PDFParse({ url: sourceUrl });

  try {
    // Extract text from PDF
    const result = await parser.getText();

    if (!result?.text) {
      throw new Error("PDF parsed but returned no text");
    }

    const text = result.text;

    // Split content into pages (form feed character)
    const pages = text
      .split("\f")
      .filter((page) => page.trim().length > 0);

    if (pages.length === 0) {
      throw new Error("PDF contains no readable text");
    }

    const sections: ParsedContent["sections"] = [];
    let currentSection: ParsedContent["sections"][0] = {
      text: "",
      images: [],
    };

    // Process each page
    pages.forEach((pageText, pageIndex) => {
      const lines = pageText.split("\n");
      let pageContent = "";

      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // Detect headings
        const isHeading =
          trimmed.length < 80 &&
          trimmed.length > 3 &&
          (
            trimmed === trimmed.toUpperCase() ||
            /^[A-Z][a-z]+(?: [A-Z][a-z]+)*:?$/.test(trimmed)
          );

        if (isHeading) {
          if (currentSection.text.trim()) {
            sections.push(currentSection);
          }

          currentSection = {
            heading: trimmed,
            text: "",
            images: [],
          };
        } else {
          pageContent += (pageContent ? " " : "") + trimmed;
        }
      });

      if (pageContent.trim()) {
        currentSection.text +=
          (currentSection.text ? "\n\n" : "") +
          `[Page ${pageIndex + 1}] ` +
          pageContent;
      }
    });

    if (currentSection.text.trim()) {
      sections.push(currentSection);
    }

    if (sections.length === 0) {
      sections.push({
        text,
        images: [],
      });
    }

    // Extract tables
    const tables = extractTablesFromText(text);

    const wordCount = sections.reduce(
      (sum, section) => sum + section.text.split(/\s+/).length,
      0
    );

    // Extract title
    let title = "Untitled PDF";
    if (sections[0]) {
      if (sections[0].heading) {
        title = sections[0].heading;
      } else {
        const firstLine = sections[0].text.split("\n")[0]?.trim();
        if (firstLine && firstLine.length < 100) {
          title = firstLine;
        }
      }
    }

    title = title.substring(0, 200);

    return {
      title,
      sections,
      tables,
      metadata: {
        wordCount,
        imageCount: 0,
        tableCount: tables.length,
      },
    };
  } catch (error) {
    if (error instanceof InvalidPDFException) {
      throw new Error(
        `Invalid PDF structure at ${sourceUrl}. ` +
        `This PDF may be corrupted, password-protected, or unsupported. ` +
        `Original error: ${error.message}`
      );
    }

    throw new Error(
      `Failed to parse PDF from ${sourceUrl}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  } finally {
    // IMPORTANT: always free resources
    await parser.destroy();
  }
}

/**
 * Extract tables from text (basic heuristic detection)
 */
function extractTablesFromText(text: string): ParsedContent["tables"] {
  const tables: ParsedContent["tables"] = [];
  const lines = text.split("\n");

  let inTable = false;
  let currentTable: string[][] = [];
  let tableName: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const hasMultipleColumns =
      /\t.+\t/.test(line) || /\s{3,}.+\s{3,}/.test(line);

    if (hasMultipleColumns) {
      if (!inTable) {
        inTable = true;

        if (i > 0) {
          const prevLine = lines[i - 1].trim();
          if (
            prevLine.length < 100 &&
            (
              prevLine.toLowerCase().includes("table") ||
              prevLine.toLowerCase().includes("figure")
            )
          ) {
            tableName = prevLine;
          }
        }
      }

      const cells = line
        .split(/\t+|\s{3,}/)
        .map((cell) => cell.trim())
        .filter(Boolean);

      if (cells.length > 1) {
        currentTable.push(cells);
      }
    } else if (inTable) {
      if (currentTable.length > 1) {
        tables.push({
          heading: tableName,
          rows: currentTable,
        });
      }

      inTable = false;
      currentTable = [];
      tableName = undefined;
    }
  }

  if (currentTable.length > 1) {
    tables.push({
      heading: tableName,
      rows: currentTable,
    });
  }

  return tables;
}
