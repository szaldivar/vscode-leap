import {
  Position,
  TextLine,
  TextEditor,
  window,
  Range,
  TextEditorDecorationType,
  DecorationRangeBehavior,
  OverviewRulerLane,
} from "vscode";
import { SearchDirection } from "./extension";

let usedDecorationTypes: TextEditorDecorationType[] = [];

const LABELS = "eariotnslcudpmhgbfywkvxzjqEARIOTNSLCUDPMHGBFYWKVXZJQ" as const;

export type PotentialMatch = {
  range: Range;
  label: string;
  active: boolean;
  decoretor?: TextEditorDecorationType;
};

export function findFirstChar(
  searchChar: string,
  direction: SearchDirection,
  editor: TextEditor,
): Map<string, PotentialMatch[]> {
  let matches: Map<string, PotentialMatch[]> = new Map();

  const [cursorLine, cursorColumn] = editor.selection.isEmpty
    ? [editor.selection.active.line, editor.selection.active.character]
    : [-1, -1];
  const visibleLines = getVisibleLines(editor, direction, cursorLine);

  for (const line of visibleLines) {
    const text = line.text + "  ";
    for (let character = 0; character < text.length - 1; character++) {
      if (
        checkSkipCharacter(
          character,
          line.lineNumber,
          cursorLine,
          cursorColumn,
          direction,
        )
      )
        continue;
      const comparator = text.charAt(character).toLowerCase();

      if (comparator === searchChar) {
        const target = text.slice(character, character + 2).toLowerCase();
        if (!matches.has(target)) {
          matches.set(target, []);
        }
        let targetMatches = matches.get(target);
        if (targetMatches?.length === LABELS.length) continue;
        targetMatches?.push({
          range: new Range(
            new Position(line.lineNumber, character),
            new Position(line.lineNumber, character + 2),
          ),
          label: numberToCharacter(targetMatches.length),
          active: true,
        });
      }
    }
  }

  for (let [_target, targetMatches] of matches) {
    for (let match of targetMatches) {
      const decoration = createDecorationType(match.label);
      editor.setDecorations(decoration, [{ range: match.range }]);
      match.decoretor = decoration;
    }
  }

  return matches;
}

export function findSecond(
  secondChar: string,
  matches: Map<string, PotentialMatch[]>,
): void {
  for (let [target, targetMatches] of matches) {
    if (target.charAt(1) !== secondChar) {
      for (let match of targetMatches) {
        match.active = false;
        match.decoretor?.dispose();
      }
    }
  }
}

export function findLabel(
  search: string,
  searchLabel: string,
  matches: Map<string, PotentialMatch[]>,
): PotentialMatch | undefined {
  let targetMatches = matches.get(search);
  if (targetMatches === undefined) return undefined;
  for (const match of targetMatches) {
    if (match.label === searchLabel) return match;
  }
  return undefined;
}

function checkSkipCharacter(
  atChar: number,
  lineNumber: number,
  cursorLine: number,
  cursorColumn: number,
  direction: SearchDirection,
): boolean {
  if (lineNumber !== cursorLine) return false;
  if (direction === "backwards") return atChar >= cursorColumn;
  return atChar <= cursorColumn;
}

function numberToCharacter(value: number): string {
  return "eariotnslcudpmhgbfywkvxzjqEARIOTNSLCUDPMHGBFYWKVXZJQ".charAt(value);
}

function getVisibleLines(
  editor: TextEditor,
  direction: SearchDirection,
  cursorLine: number,
): TextLine[] {
  let textLines = [];
  const ranges = editor.visibleRanges;

  for (let range of ranges) {
    for (
      let lineNumber = range.start.line;
      lineNumber <= range.end.line;
      lineNumber++
    ) {
      if (checkSkipLine(direction, lineNumber, cursorLine)) {
        continue;
      }
      textLines.push(editor.document.lineAt(lineNumber));
    }
  }

  return textLines;
}

function checkSkipLine(
  direction: SearchDirection,
  lineNumber: number,
  cursorPosition: number,
): boolean {
  if (lineNumber === -1) return false;
  return direction === "backwards"
    ? lineNumber > cursorPosition
    : lineNumber < cursorPosition;
}

function createDecorationType(label: string): TextEditorDecorationType {
  return window.createTextEditorDecorationType({
    backgroundColor: "var(--vscode-editor-findMatchHighlightBackground)",
    light: {
      after: {
        contentText: label,
        margin: `0 -1ch 0 0;
          position: absolute;`,
        color: "var(--vscode-editor-background)",
        backgroundColor: "var(--vscode-editor-foreground)",
        height: "100%",
      },
    },
    dark: {
      after: {
        contentText: label,
        margin: `0 -1ch 0 0;
          position: absolute;`,
        color: "var(--vscode-editor-background)",
        backgroundColor: "var(--vscode-editor-foreground)",
        height: "100%",
      },
    },
  });
}
