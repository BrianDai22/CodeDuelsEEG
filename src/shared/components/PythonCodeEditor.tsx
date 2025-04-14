import React, { useRef, useEffect } from 'react';
import * as monaco from 'monaco-editor';
import { cn } from '@shared/lib/utils';

interface PythonCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun?: () => void;
  className?: string;
  readOnly?: boolean;
  height?: string;
  options?: monaco.editor.IStandaloneEditorConstructionOptions;
}

const PythonCodeEditor: React.FC<PythonCodeEditorProps> = ({
  value,
  onChange,
  onRun,
  className,
  readOnly = false,
  height = '600px',
  options = {}
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (editorRef.current) {
      monacoEditorRef.current = monaco.editor.create(editorRef.current, {
        value,
        language: 'python',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 14,
        readOnly,
        wordWrap: 'on',
        tabSize: 4,
        insertSpaces: true,
        formatOnPaste: true,
        formatOnType: true,
        suggestOnTriggerCharacters: true,
        quickSuggestions: true,
        lineNumbers: 'on',
        folding: true,
        cursorStyle: 'line',
        renderLineHighlight: 'all',
        renderWhitespace: 'none',
        smoothScrolling: true,
        matchBrackets: 'always',
        links: true,
        padding: { top: 10 },
        ...options
      });

      // Add command for running code with Cmd+Enter or Ctrl+Enter
      monacoEditorRef.current.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        if (onRun) {
          onRun();
        }
      });

      // Python syntax highlighting and autocomplete
      monaco.languages.registerCompletionItemProvider('python', {
        provideCompletionItems: (model, position) => {
          const suggestions = [
            {
              label: 'class Solution:',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'class Solution:\n\tdef solve(self, ${1:params}):\n\t\t${0:# Your code here}\n\t\tpass',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create a Solution class with a solve method'
            },
            {
              label: 'def solve',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'def solve(self, ${1:params}):\n\t${0:# Your code here}\n\tpass',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create a solve method in your Solution class'
            },
            {
              label: 'return',
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: 'return ${0:value}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Return a value from a function'
            },
            {
              label: 'for',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'for ${1:item} in ${2:items}:\n\t${0:# Your code here}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create a for loop'
            },
            {
              label: 'if',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'if ${1:condition}:\n\t${0:# Your code here}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create an if statement'
            },
            {
              label: 'while',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'while ${1:condition}:\n\t${0:# Your code here}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create a while loop'
            }
          ];

          return {
            suggestions: suggestions.map(item => ({
              ...item,
              range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column
              }
            }))
          };
        }
      });

      // Handle editor changes
      monacoEditorRef.current.onDidChangeModelContent(() => {
        if (!readOnly && monacoEditorRef.current) {
          onChange(monacoEditorRef.current.getValue());
        }
      });

      // Focus the editor
      monacoEditorRef.current.focus();

      return () => {
        // Dispose of the editor instance when the component unmounts
        if (monacoEditorRef.current) {
          monacoEditorRef.current.dispose();
        }
      };
    }
  }, [value, readOnly, options, onChange, onRun]);

  // Handle modifications to the editor value from outside the component
  useEffect(() => {
    if (monacoEditorRef.current) {
      const currentValue = monacoEditorRef.current.getValue();
      if (value !== currentValue) {
        monacoEditorRef.current.setValue(value);
      }
    }
  }, [value]);

  return (
    <div className={cn("flex flex-col border rounded-md bg-card overflow-hidden", className)}>
      <div className="p-2 bg-muted border-b border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground">solution.py</span>
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-destructive"></div>
          <div className="w-3 h-3 rounded-full bg-accent"></div>
          <div className="w-3 h-3 rounded-full bg-primary"></div>
        </div>
      </div>
      <div 
        ref={editorRef} 
        className="monaco-editor-container" 
        style={{ height }}
      />
    </div>
  );
};

export default PythonCodeEditor; 