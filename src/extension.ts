import * as vscode from "vscode";

// timeout before rerendering
let timeout: NodeJS.Timeout | undefined = undefined;
let activeEditor: vscode.TextEditor | undefined = undefined;

export function activate(context: vscode.ExtensionContext) {
  activeEditor = vscode.window.activeTextEditor;

  if (activeEditor) {
    triggerUpdateDecorations();
  }

  // Update on editor change
  vscode.window.onDidChangeActiveTextEditor(
    (editor) => {
      activeEditor = editor;
      if (editor) {
        triggerUpdateDecorations();
      }
    },
    null,
    context.subscriptions
  );

  // Update on document change
  vscode.workspace.onDidChangeTextDocument(
    (event) => {
      if (activeEditor && event.document === activeEditor.document) {
        triggerUpdateDecorations(true);
      }
    },
    null,
    context.subscriptions
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}

function updateDecorations() {
  if (!activeEditor) {
    return;
  }

  const text = activeEditor.document.getText();
  const decorations: vscode.DecorationOptions[] = [];

  const regEx = /(\\u[a-fA-F0-9]{4})+/g;
  let match;
  while ((match = regEx.exec(text))) {
    const startPos = activeEditor.document.positionAt(match.index);
    const endPos = activeEditor.document.positionAt(
      match.index + match[0].length
    );

    // convert unicode literals to characters
    const converted = match[0].replace(/\\u([a-fA-F0-9]{4})/g, (_, hexCode) => {
      return String.fromCharCode(parseInt(hexCode, 16));
    });

    const decoration: vscode.DecorationOptions = {
      range: new vscode.Range(startPos, endPos),
      renderOptions: {
        after: {
          contentText: converted,
          color: new vscode.ThemeColor("editorCodeLens.foreground"),
        },
      },
    };
    decorations.push(decoration);
  }

  // Create decoration type
  const decorationType = vscode.window.createTextEditorDecorationType({});

  activeEditor.setDecorations(decorationType, decorations);
}

function triggerUpdateDecorations(throttle = false) {
  if (timeout) {
    clearTimeout(timeout);
    timeout = undefined;
  }
  if (throttle) {
    timeout = setTimeout(updateDecorations, 500);
  } else {
    updateDecorations();
  }
}
