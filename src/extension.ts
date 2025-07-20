// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

/**
 * Calculates the nth Fibonacci number.
 * @param {number} n The index in the Fibonacci sequence (0-indexed).
 * @returns {number} The Fibonacci number.
 */
function fibonacci(n: number): number {
    if (n <= 1) {
        return n;
    }
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) {
        let temp = a + b;
        a = b;
        b = temp;
    }
    return b;
}

/**
 * Given an indentation depth, returns the number of spaces for Fibonacci tabbing.
 * Maps depth 1 to F_3 (2 spaces), depth 2 to F_4 (3 spaces), etc.
 * @param {number} depth The current logical indentation depth (e.g., 0 for no indent, 1 for first level).
 * @returns {number} The number of spaces for the given depth.
 */
function getFibonacciSpacesForDepth(depth: number): number {
    // If depth is 0, no spaces.
    if (depth === 0) {
        return 0;
    }
    // Multiplier for each Fibonacci indentation level
    const multiplier = 2;
    // Custom mapping: depth 1 → F_2 (1), depth 2 → F_3 (2), depth 3 → F_4 (3), depth 4 → F_5 (5), ...
    // But skip the repeated 1 in Fibonacci (i.e., start at F_2)
    // So, depth 1 → F_2, depth 2 → F_3, depth 3 → F_4, depth 4 → F_5, ...
    // This gives: 2, 4, 6, 10, ...
    const fibIndex = depth + 1;
    return fibonacci(fibIndex) * multiplier;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    console.log('Extension "fibonacci-tabbing" is now active!');

    // Register a command that will be triggered when the user presses Tab or Shift+Tab
    // We'll override the default tab behavior.
    let disposableTab = vscode.commands.registerCommand('fibonacci-tabbing.indent', () => {
        applyIndentation(true); // True for tabbing in
    });

    let disposableShiftTab = vscode.commands.registerCommand('fibonacci-tabbing.outdent', () => {
        applyIndentation(false); // False for tabbing out
    });

    context.subscriptions.push(disposableTab, disposableShiftTab);
}

/**
 * Applies Fibonacci indentation or de-indentation to the selected lines.
 * @param {boolean} isTab True for indenting (Tab), false for de-indenting (Shift+Tab).
 */
async function applyIndentation(isTab: boolean) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return; // No active editor
    }

    const document = editor.document;
    const selections = editor.selections;

    await editor.edit(editBuilder => {
        selections.forEach(selection => {
            for (let i = selection.start.line; i <= selection.end.line; i++) {
                const line = document.lineAt(i);
                const lineContent = line.text;

                // Determine current indentation level based on leading spaces
                const currentLeadingSpaces = lineContent.match(/^\s*/)?.[0]?.length || 0;

                // Find the smallest depth where the Fibonacci indent is greater than currentLeadingSpaces
                let currentLogicalDepth = 0;
                for (let d = 0; d < 100; d++) { // Max depth for estimation

                    if (getFibonacciSpacesForDepth(d) > currentLeadingSpaces) {
                        currentLogicalDepth = d - 1; // If it's between Fibonacci numbers, go to previous
                        if (currentLogicalDepth < 0) currentLogicalDepth = 0;
                        break;
                    }
                }

                let newLogicalDepth: number;
                if (isTab) {
                    newLogicalDepth = currentLogicalDepth + 1;
                } else {
                    newLogicalDepth = Math.max(0, currentLogicalDepth - 1);
                }

                const newSpaces = getFibonacciSpacesForDepth(newLogicalDepth);
                const newIndentString = ' '.repeat(newSpaces);

                // Replace the existing leading whitespace with the new Fibonacci indentation
                const rangeToReplace = new vscode.Range(line.lineNumber, 0, line.lineNumber, currentLeadingSpaces);
                editBuilder.replace(rangeToReplace, newIndentString);
            }
        });
    });

    // Optional: Reveal the first selection after editing
    editor.revealRange(selections[0], vscode.TextEditorRevealType.InCenterIfOutsideViewport);
}

// This method is called when your extension is deactivated
export function deactivate() {}
