import React from 'react';
import { useState, useEffect } from 'react';
import { cn } from '@shared/lib/utils';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  className?: string;
  readOnly?: boolean;
}

const CodeEditor = ({ code, onChange, className, readOnly = false }: CodeEditorProps) => {
  const [lineNumbers, setLineNumbers] = useState<number[]>([]);
  
  useEffect(() => {
    // Update line numbers
    const lines = code.split('\n').length;
    setLineNumbers(Array.from({ length: lines }, (_, i) => i + 1));
  }, [code]);
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!readOnly) {
      onChange(e.target.value);
    }
  };
  
  return (
    <div className={cn("flex flex-col border rounded-md bg-card overflow-hidden", className)}>
      <div className="p-2 bg-muted border-b border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground">editor.js</span>
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-destructive"></div>
          <div className="w-3 h-3 rounded-full bg-accent"></div>
          <div className="w-3 h-3 rounded-full bg-primary"></div>
        </div>
      </div>
      
      <div className="flex-grow flex relative">
        <div className="bg-muted/50 py-2 px-3 text-right min-w-[40px] text-muted-foreground text-sm font-mono">
          {lineNumbers.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
        
        <textarea
          value={code}
          onChange={handleChange}
          className="flex-grow outline-none bg-transparent p-2 font-mono text-sm resize-none"
          spellCheck="false"
          readOnly={readOnly}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
