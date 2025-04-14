import React, { useRef, useEffect } from 'react';
import * as monaco from 'monaco-editor';
import { cn } from '@shared/lib/utils';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun?: () => void;
  language?: string;
  className?: string;
  readOnly?: boolean;
  height?: string;
  options?: monaco.editor.IStandaloneEditorConstructionOptions;
}

// Configure Monaco editor's web worker environment
if (window.MonacoEnvironment === undefined) {
  window.MonacoEnvironment = {
    // Use a simple getWorker function that creates workers from blob URLs
    getWorker: function(_moduleId: string, _label: string) {
      return new Worker(
        URL.createObjectURL(
          new Blob(
            ['self.MonacoEnvironment={baseUrl:"https://unpkg.com/monaco-editor@latest/min/"}; importScripts("https://unpkg.com/monaco-editor@latest/min/vs/base/worker/workerMain.js");'],
            { type: 'text/javascript' }
          )
        )
      );
    }
  };
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  onChange,
  onRun,
  language = 'python',
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
        language,
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
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        autoSurround: 'never',
        autoIndent: 'advanced',
        cursorBlinking: 'solid',
        find: { autoFindInSelection: 'never' },
        multiCursorModifier: 'ctrlCmd',
        ...options
      });

      // Add command for running code with Cmd+Enter or Ctrl+Enter
      monacoEditorRef.current.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        if (onRun) {
          onRun();
        }
      });
      
      // Configure Python language features
      if (language === 'python') {
        // Set Python specific options
        monaco.languages.registerCompletionItemProvider('python', {
          provideCompletionItems: (model, position) => {
            const suggestions = [
              {
                label: 'def',
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: 'def ${1:function_name}(${2:parameters}):\n\t${0}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Define a new function'
              },
              {
                label: 'class',
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: 'class ${1:ClassName}:\n\t${0}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Define a new class'
              },
              {
                label: 'for',
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: 'for ${1:item} in ${2:iterable}:\n\t${0}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'For loop'
              },
              {
                label: 'if',
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: 'if ${1:condition}:\n\t${0}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'If statement'
              },
              {
                label: 'while',
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: 'while ${1:condition}:\n\t${0}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'While loop'
              },
              // Common Python builtins
              {
                label: 'print',
                kind: monaco.languages.CompletionItemKind.Function,
                insertText: 'print(${1})',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Print to console'
              },
              {
                label: 'len',
                kind: monaco.languages.CompletionItemKind.Function,
                insertText: 'len(${1})',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Return the length of an object'
              },
              {
                label: 'range',
                kind: monaco.languages.CompletionItemKind.Function,
                insertText: 'range(${1:stop})',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Return a sequence of numbers'
              },
              // Problem-specific suggestions
              {
                label: 'enumerate',
                kind: monaco.languages.CompletionItemKind.Function,
                insertText: 'enumerate(${1:iterable}, start=${2:0})',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Return an enumerate object'
              },
              {
                label: 'dict',
                kind: monaco.languages.CompletionItemKind.Class,
                insertText: '{}',
                documentation: 'Create a dictionary'
              }
            ];
            
            // Create proper CompletionList with the suggestions
            return {
              suggestions: suggestions.map(item => ({
                ...item,
                // Add range property that's required for CompletionItem
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
        
        // Basic Python syntax highlighting and error detection
        monaco.languages.registerHoverProvider('python', {
          provideHover: (model, position) => {
            const word = model.getWordAtPosition(position);
            if (!word) return null;
            
            // Simple hover info for Python keywords
            const pythonKeywords: Record<string, string> = {
              'def': 'Define a function',
              'class': 'Define a class',
              'return': 'Return a value from a function',
              'if': 'Conditional statement',
              'else': 'Else clause in conditional statement',
              'for': 'For loop',
              'while': 'While loop',
              'try': 'Try block for exception handling',
              'except': 'Handle exceptions in a try block',
              'import': 'Import a module',
            };
            
            const info = pythonKeywords[word.word];
            if (info) {
              return {
                contents: [{ value: `**${word.word}**: ${info}` }]
              };
            }
            
            return null;
          }
        });
      }

      // Handle editor changes
      monacoEditorRef.current.onDidChangeModelContent(() => {
        if (!readOnly && monacoEditorRef.current) {
          onChange(monacoEditorRef.current.getValue());
        }
      });

      return () => {
        // Dispose of the editor instance when the component unmounts
        if (monacoEditorRef.current) {
          monacoEditorRef.current.dispose();
        }
      };
    }
  }, [value, language, readOnly, options, onChange, onRun]);

  return (
    <div className={cn("flex flex-col border rounded-md bg-card overflow-hidden", className)}>
      <div className="p-2 bg-muted border-b border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {language === 'python' ? 'main.py' : `code.${language}`}
        </span>
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

export default MonacoEditor; 