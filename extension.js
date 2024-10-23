// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
const hexColorPattern = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
const rgbColorPattern = /rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)/g;
const variableUsagePattern =
  /\$[a-zA-Z_][a-zA-Z0-9_-]*:\s*([#0-9a-fA-F]+|rgb\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\))/g;
const variableUsageMatchPattern = /\$([a-zA-Z_][a-zA-Z0-9_-]*)/g; // regex to find variable usages

let currentDecorations = []; //global declaration
let colorVariables = {};

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "bg-color" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand(
    "bg-color.helloWorld",
    function () {
      vscode.window.showInformationMessage(
        "Color Highlight activated sucessfully!"
      );
    }
  );

  function isColorLight(color) {
    let r, g, b;

    // Assume color is in HEX format
    if (color.startsWith("#")) {
      // Convert hex to RGB (6 digits)
      if (color.length === 4) {
        r = parseInt(color[1] + color[1], 16);
        g = parseInt(color[2] + color[2], 16);
        b = parseInt(color[3] + color[3], 16);
      } else {
        // Convert hex to RGB (6 digits)
        const bigint = parseInt(color.slice(1), 16);
        r = (bigint >> 16) & 255;
        g = (bigint >> 8) & 255;
        b = bigint & 255;
      }
    } else {
      // Assume color is in RGB format
      const rgb = color.match(/\d+/g);
      if (rgb) {
        r = parseInt(rgb[0]);
        g = parseInt(rgb[1]);
        b = parseInt(rgb[2]);
      }
    }
    // Calculating brightness using the formula
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128; // Returning true if the color is light
  }

  function updateColor() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }
    //for clearing old background highlight
    currentDecorations.forEach((decoration) => {
      editor.setDecorations(decoration, []);
    });
    currentDecorations = [];

    let match;
    const text = editor.document.getText();
    const decorationArray = [];

    //For hexacode color
    while ((match = hexColorPattern.exec(text))) {
      const startPosition = editor.document.positionAt(match.index);
      const endPosition = editor.document.positionAt(
        match.index + match[0].length
      );
      const range = new vscode.Range(startPosition, endPosition);
      const decoration = vscode.window.createTextEditorDecorationType({
        backgroundColor: match[0],
        color: isColorLight(match[0]) ? "black" : "white",
      });
      decorationArray.push({ decoration, range });
    }

    //for rgb color
    while ((match = rgbColorPattern.exec(text))) {
      const color = `rgb(${match[1]},${match[2]},${match[3]})`;
      const startPosition = editor.document.positionAt(match.index);
      const endPosition = editor.document.positionAt(
        match.index + match[0].length
      );
      const range = new vscode.Range(startPosition, endPosition);
      const decoration = vscode.window.createTextEditorDecorationType({
        backgroundColor: color,
        color: isColorLight(match[0]) ? "black" : "white",
      });
      decorationArray.push({ decoration, range });
    }

    // For variable declarations with colors
    while ((match = variableUsagePattern.exec(text)) !== null) {
      const variableName = match[0].split(":")[0].trim(); // Extract variable name
      const colorValue = match[1].trim(); // Extract color value
      colorVariables[variableName] = colorValue;
    }

    while ((match = variableUsageMatchPattern.exec(text)) !== null) {
      const variableName = match[0].trim();

      // Getting the index just after the matched variable
      const afterMatchIndex = match.index + variableName.length;
      // Checking if ':' or '=' is ahead
      const charAhead = text.slice(afterMatchIndex).trimStart()[0];
      // If the next non-whitespace character is ':' or '=' to skip highlighting
      if (charAhead === ":" || charAhead === "=") {
        continue; //yo true bhayesi loop ko condition check garna janxa feri
      }

      if (colorVariables[variableName]) {
        const startPosition = editor.document.positionAt(match.index);
        const endPosition = editor.document.positionAt(afterMatchIndex);
        const range = new vscode.Range(startPosition, endPosition);
        const decoration = vscode.window.createTextEditorDecorationType({
          backgroundColor: colorVariables[variableName],
          color: isColorLight(colorVariables[variableName]) ? "black" : "white",
        });
        decorationArray.push({ decoration, range });
      }
    }

    decorationArray.forEach((dec) => {
      editor.setDecorations(dec.decoration, [dec.range]); //syntax ho first decoration then range
      currentDecorations.push(dec.decoration);
    });
  }
  // updateColor();
  vscode.window.onDidChangeActiveTextEditor(
    updateColor,
    null,
    context.subscriptions
  ),
    vscode.workspace.onDidChangeTextDocument(
      (event) => {
        vscode.window.visibleTextEditors.forEach((visibleEditor) => {
          if (visibleEditor.document === event.document) {
            updateColor();
          }
        });
      },
      null,
      context.subscriptions
    );

  // Update decorations initially if there is an active editor
  if (vscode.window.activeTextEditor) {
    updateColor();
  }
  vscode.window.showInformationMessage(
    "Color Highlight activated sucessfully!"
  );

  context.subscriptions.push(disposable);
  // vscode.commands.executeCommand("bg-color.helloWorld");
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
