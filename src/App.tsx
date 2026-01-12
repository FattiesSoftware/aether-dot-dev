import { useState, useRef, useCallback } from 'react';
import './App.css';
import { Terminal } from './components/Terminal';
import { Bot, Layers, HardDrive, Settings, CornerRightDown, Repeat2, Zap, Command, History, LayoutList } from 'lucide-react';

interface HistoryEntry {
  id: number;
  input: string;
  output: string;
  executionTime: string;
}

interface CommandBlockProps {
  input: string;
  output: string;
  onCommandSubmit: (cmd: string) => void;
}

const CommandBlock: React.FC<CommandBlockProps> = ({ input, output, onCommandSubmit }) => {
  const [showControls, setShowControls] = useState(false);

  const handleReRun = () => {
    onCommandSubmit(input);
  };
  
  return (
    <div 
      className={\`group mb-4 p-3 rounded-lg border transition-colors \${
        output ? 'border-transparent hover:bg-white/5' : 'border-yellow-600/30 hover:border-yellow-600/60'
      }\`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Input Section */}
      <div className={\`flex items-start gap-3 text-sm mb-1 \${output ? 'opacity-90' : ''}\`}>
        <span className="font-bold text-green-400 mt-0.5">&gt;</span>
        <pre className="flex-1 font-mono whitespace-pre-wrap text-white">{input}</pre>
        <button 
          onClick={handleReRun} 
          className={\`p-1 text-xs rounded transition-opacity \${showControls ? 'opacity-100' : 'opacity-0'} text-gray-400 hover:text-yellow-400\`}
          title="Re-run command"
        >
          <Repeat2 size={16}/>
        </button>
      </div>
      
      {/* Output Section */}
      {output && (
        <div className="border-l-2 border-gray-700 pl-3 pt-1 text-sm font-mono text-gray-300">
          <pre className="whitespace-pre-wrap">{output}</pre>
        </div>
      )}
    </div>
  );
};

const initialHistory: HistoryEntry[] = [
  { id: 1, input: 'ls -la', output: 'total 16\\ndrwxr-xr-x 3 user user 4096 Jan 10 10:00 .\\ndrwxr-xr-x 4 user user 4096 Jan 9 15:30 ..\\n-rw-r--r-- 1 user user 1200 Jan 12 10:00 package.json', executionTime: '15ms' },
  { id: 2, input: 'npm run dev', output: 'Starting up Aether UI...\\nPort 5173 and 1420 ready.', executionTime: '320ms' },
];

function App() {
  const [history, setHistory] = useState<HistoryEntry[]>(initialHistory);
  const [currentCommand, setCurrentCommand] = useState('');
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleBlockReRun = useCallback((cmd: string) => {
    // Mock execution for re-run
    const newCommand: HistoryEntry = {
        id: Date.now(),
        input: cmd,
        output: \`Re-executed: \${cmd}\\n\\nMock execution successful. Time: 22ms\`, 
        executionTime: '22ms'
    };
    setHistory(prev => [...prev, newCommand]);
    // Focus input after re-run simulation
    inputRef.current?.focus();
  }, []);


  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd+K to activate AI Palette (Warp feature)
    // @ts-ignore
    if (e.metaKey && e.key === 'k') {
      e.preventDefault();
      alert('AI Command Palette Activated! (Mock for now)');
    } 
    // Enter for command submission
    else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const trimmedCmd = currentCommand.trim();
      if (trimmedCmd === '') return;
      
      // Simulate command execution
      const newCommand: HistoryEntry = {
        id: Date.now(),
        input: trimmedCmd,
        output: \`> Running: \${trimmedCmd}\\n\\nCommand execution simulated successfully.\\n\\nCheck the bottom block for real PTY output.\`, 
        executionTime: '45ms'
      };
      setHistory(prev => [...prev, newCommand]);
      setCurrentCommand('');

      // Scroll logic
      setTimeout(() => {
        if (terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
      }, 50);
    }
  };
  
  // Mock AI Palette visibility (Cmd+K trigger)
  const [showAiPalette, setShowAiPalette] = useState(false);

  return (
    <div className="app-container dark-theme">
      {/* Agentic Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Bot size={24} />
          <span>Aether AI</span>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 p-2 bg-white/10 rounded cursor-pointer text-sm font-semibold text-accent border border-blue-500/50">
            <LayoutList size={18} />
            <span>Blocks & History</span>
          </div>
          <div className="flex items-center gap-3 p-2 hover:bg-white/5 rounded cursor-pointer text-sm">
            <HardDrive size={18} />
            <span>Drive</span>
          </div>
          <div className="flex items-center gap-3 p-2 hover:bg-white/5 rounded cursor-pointer text-sm">
            <Settings size={18} />
            <span>Settings</span>
          </div>
        </div>

        <div className="mt-auto p-4 bg-white/5 rounded-lg text-xs text-gray-400">
          <p className="mb-2 font-bold text-accent">Gemini Status:</p>
          <p>Ready to translate intent to shell.</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Tabs Bar */}
        <div className="tabs-bar">
          <div className="tab active flex items-center gap-1">
            <Command />
            <span>local-session</span>
          </div>
          <div className="tab flex items-center gap-1">
             <History size={14} />
             <span>History</span>
          </div>
          <div className="tab-actions">
            <button className="tab-btn" title="New Tab">&#x002B;</button>
            <button className="tab-btn" title="Update App">&#x21BA;</button>
          </div>
        </div>
        
        <div className="terminal-scroll-area" ref={terminalRef}>
          {/* Render Command Blocks */}
          {history.map((entry) => (
            <CommandBlock 
              key={entry.id} 
              input={entry.input} 
              output={entry.output} 
              onCommandSubmit={handleBlockReRun}
            />
          ))}

          {/* AI Command Palette Trigger (Placeholder for Cmd+K activation) */}
          <div className="flex justify-center py-2">
              <button 
                  onClick={() => setShowAiPalette(true)} 
                  className="p-2 text-xs rounded-lg bg-blue-700/50 hover:bg-blue-600 transition-colors shadow-lg text-white flex items-center gap-1 border border-blue-400/50"
                  title="AI Command Palette (Cmd+K)"
              >
                  <Zap size={14}/> AI Prompt
              </button>
          </div>

          {/* The active, live shell session block */}
          <div className="live-session-block">
            <div className="flex justify-between items-center p-1 px-2 border-b border-white/10 text-xs text-gray-400 bg-white/5">
              <span>Active PTY Session</span>
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
            <div className="p-2">
              <Terminal className="h-[150px]" /> {/* Adjusted height */}
            </div>
          </div>
          
        </div>

        {/* Modern Input Editor at the Bottom */}
        <div className="input-area">
          <textarea
            ref={inputRef}
            className="input-editor"
            placeholder="Cmd+K for AI prompt, or type a shell command..."
            rows={1} 
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* Floating AI Command Palette (Mock) */}
        {showAiPalette && (
            <div className="ai-palette">
                <div className="palette-header">
                    <Command size={18} className="text-blue-400"/>
                    <input 
                        type="text"
                        placeholder="Ask Warp AI to generate a command..."
                        className="palette-input"
                    />
                    <button onClick={() => setShowAiPalette(false)} className="palette-close">&times;</button>
                </div>
                <div className="palette-content">
                    <p className='text-gray-500 text-sm'>Suggestions based on context...</p>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}

export default App;

// --- Component Definitions (for clarity, ideally these would be separated later) ---

const CommandBlock: React.FC<CommandBlockProps> = ({ input, output, onCommandSubmit }) => {
  const [showControls, setShowControls] = useState(false);

  const handleReRun = () => {
    onCommandSubmit(input);
  };
  
  return (
    <div 
      className={\`group mb-4 p-3 rounded-lg border transition-colors \${
        output ? 'border-transparent hover:bg-white/5' : 'border-yellow-600/30 hover:border-yellow-600/60'
      }\`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Input Section */}
      <div className={\`flex items-start gap-3 text-sm mb-1 \${output ? 'opacity-90' : ''}\`}>
        <span className="font-bold text-green-400 mt-0.5">&gt;</span>
        <pre className="flex-1 font-mono whitespace-pre-wrap text-white">{input}</pre>
        <button 
          onClick={handleReRun} 
          className={\`p-1 text-xs rounded transition-opacity \${showControls ? 'opacity-100' : 'opacity-0'} text-gray-400 hover:text-yellow-400\`}
          title="Re-run command"
        >
          <Repeat2 size={16}/>
        </button>
      </div>
      
      {/* Output Section */}
      {output && (
        <div className="border-l-2 border-gray-700 pl-3 pt-1 text-sm font-mono text-gray-300">
          <pre className="whitespace-pre-wrap">{output}</pre>
        </div>
      )}
    </div>
  );
};