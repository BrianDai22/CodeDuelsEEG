import React, { useRef, useEffect } from 'react';
import * as monaco from 'monaco-editor';
// If using Vite or similar, you might need the loader:
// import loader from '@monaco-editor/loader';

// Import worker files
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

// Configure Monaco Environment (self is a reference to the global scope)
self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') {
      return new jsonWorker();
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker();
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker();
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker();
    }
    // Default to editor worker
    return new editorWorker();
  },
};

interface CodeTerminalProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  onCmdEnter?: (code: string) => void;
}

const CodeTerminal: React.FC<CodeTerminalProps> = ({
  value,
  onChange,
  language = 'python',
  readOnly = false,
  onCmdEnter,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    // Optional: Use loader if direct import fails
    // loader.init().then(monaco => { ... });

    if (containerRef.current) {
      // Ensure previous editor instances are disposed
      editorRef.current?.dispose();

      editorRef.current = monaco.editor.create(containerRef.current, {
        value, // Initial value
        language,
        readOnly,
        automaticLayout: true, // Adjusts editor size on container changes
        theme: 'vs-dark', // Dark theme
        minimap: { enabled: false }, // Optional: disable minimap
        scrollBeyondLastLine: false, // Optional: style preference
        wordWrap: 'on', // Optional: enable word wrapping
      });

      // Listener for content changes
      const contentSubscription = editorRef.current.onDidChangeModelContent(() => {
        const newValue = editorRef.current?.getValue() || '';
        onChange(newValue);
      });

      // Add command for Cmd+Enter or Ctrl+Enter
      // Storing the disposable is removed; editor disposal will handle cleanup.
      const commandBinding = editorRef.current.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
        () => {
          if (onCmdEnter && editorRef.current) {
            // Get current value from editor and pass it
            const currentCode = editorRef.current.getValue();
            onCmdEnter(currentCode);
          }
        }
      );

      // Cleanup on unmount
      return () => {
        contentSubscription.dispose();
        // No need to dispose commandBinding explicitly if addCommand returns IDisposable
        // commandBinding?.dispose(); // Removed this line
        editorRef.current?.dispose(); // Disposing the editor cleans up commands/listeners
        editorRef.current = null;
      };
    }
  }, [language, readOnly, onCmdEnter]);

  // Effect to update editor value if the external 'value' prop changes
  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.getValue() !== value) {
      const model = editor.getModel();
      if (model) {
        // Use pushEditOperations for better undo/redo stack management
        editor.pushUndoStop();
        model.pushEditOperations(
          [],
          [
            {
              range: model.getFullModelRange(),
              text: value,
            },
          ],
          () => null
        );
        editor.pushUndoStop();
      } else {
        editor.setValue(value);
      }
    }
  }, [value]);

  // Container div for the editor
  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
};

export default CodeTerminal; 