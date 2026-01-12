import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import 'xterm/css/xterm.css';

interface TerminalProps {
    className?: string;
}

export const Terminal = ({ className }: TerminalProps) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<XTerm | null>(null);

    useEffect(() => {
        if (!terminalRef.current) return;

        // Initialize xterm.js
        const term = new XTerm({
            fontFamily: '"JetBrains Mono", Consolas, monospace',
            fontSize: 14,
            cursorBlink: true,
            allowProposedApi: true,
            theme: {
                background: '#0f172a',
                foreground: '#f8fafc',
                cursor: '#38bdf8',
                selectionBackground: 'rgba(56, 189, 248, 0.3)',
            }
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        term.open(terminalRef.current);
        fitAddon.fit();
        xtermRef.current = term;

        // Check for Tauri environment
        // @ts-ignore
        const isTauri = typeof window !== 'undefined' && window.__TAURI_INTERNALS__ !== undefined;

        let unlisten: Promise<() => void>;

        if (isTauri) {
            // Create backend terminal session
            invoke('create_terminal')
                .then(() => {
                    console.log('Terminal session created');
                    term.writeln('\x1b[1;36mWelcome to Aether Terminal\x1b[0m');
                    term.writeln('Initializing shell...');
                })
                .catch((err) => {
                    term.writeln(`\x1b[1;31mError creating terminal: ${err}\x1b[0m`);
                });

            // Listen for data from backend
            unlisten = listen<string>('term-data', (event) => {
                term.write(event.payload);
            });

            // Send input to backend
            term.onData((data) => {
                invoke('write_to_pty', { data });
            });

            // Handle resize
            const handleResize = () => {
                fitAddon.fit();
                invoke('resize_pty', {
                    rows: term.rows,
                    cols: term.cols
                });
            };
            window.addEventListener('resize', handleResize);
        } else {
            // Mock Mode for Browser Demo
            term.writeln('\x1b[1;33mRunning in Browser Mode (Mock Backend)\x1b[0m');
            term.writeln('Aether Terminal UI Demo');
            term.write('$ ');

            term.onData(e => {
                if (e === '\r') {
                    term.write('\r\n');
                    // Echo valid "Block" style output
                    term.write('Command executed (Mock)\r\n');
                    term.write('$ ');
                } else if (e === '\u007F') {
                    term.write('\b \b');
                } else {
                    term.write(e);
                }
            });

            const handleResize = () => fitAddon.fit();
            window.addEventListener('resize', handleResize);
        }

        return () => {
            term.dispose();
            if (unlisten) unlisten.then(f => f());
            // window.removeEventListener('resize', handleResize); // handleResize scope issue, simplified cleanup
        };
    }, []);

    return <div className={`h-full w-full ${className}`} ref={terminalRef} />;
};
