import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { RepoLensLogo } from '../components/common/RepoLensLogo';
import { ChatMessage } from '../types';
import * as analysisService from '../services/analysisService';

export const AiAssistantPage: React.FC = () => {
  const { activeRepo, currentAnalysisId } = useApp();
  const navigate = useNavigate();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const msgIdCounter = React.useRef(10);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        `Hello! I am RepoLens AI Assistant. I have indexed the complete AST semantic graph${activeRepo ? ` for **${activeRepo.name}**` : ''}. How can I help you analyze blast radius, fix security vectors, or review dependencies today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        'Analyze blast radius of refactoring auth_service.py',
        'Generate remediation patch for CWE-78',
        'Explain circular dependency in core.tokens',
      ],
    },
  ]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    msgIdCounter.current += 1;
    const userMsg: ChatMessage = {
      id: `msg-${msgIdCounter.current}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    if (currentAnalysisId) {
      try {
        const res = await analysisService.chat(currentAnalysisId, { message: text });
        msgIdCounter.current += 1;
        const aiReply: ChatMessage = {
          id: `msg-${msgIdCounter.current}`,
          role: 'assistant',
          content: res.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiReply]);
      } catch (err) {
        msgIdCounter.current += 1;
        setMessages((prev) => [...prev, {
          id: `msg-${msgIdCounter.current}`,
          role: 'assistant',
          content: 'Sorry, I encountered an error communicating with the AI backend. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }]);
      } finally {
        setIsLoading(false);
      }
    } else {
      // No analysis loaded — fall back to helpful message
      msgIdCounter.current += 1;
      setMessages((prev) => [...prev, {
        id: `msg-${msgIdCounter.current}`,
        role: 'assistant',
        content: 'Please ingest a repository first so I can analyze it for you. Navigate to "Connect Repo" to get started.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-space-md max-w-5xl mx-auto flex flex-col h-[calc(100vh-6.5rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-sm border-b border-surface-container-high">
        <div>
          <div className="flex items-center gap-space-xs">
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold">
              RepoLens AI Assistant
            </h1>
            <span className="font-label-caps text-label-caps px-space-xs py-space-2xs rounded bg-surface-container text-secondary font-mono">
              AST REASONING
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-outline font-code">
            <span>Active Context:</span>
            <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface font-semibold">
              {activeRepo?.name}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-surface-container text-primary-container font-semibold">
              services/auth_service.py
            </span>
          </div>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                id: '1',
                role: 'assistant',
                content: 'Chat context reset. How can I assist you with repository intelligence?',
                timestamp: 'Just now',
              },
            ])
          }
          className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-outline hover:text-on-surface transition-colors self-start sm:self-auto text-xs flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">restart_alt</span>
          <span>Clear Context</span>
        </button>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto space-y-space-md p-space-sm">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-space-sm ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="mt-1 flex-shrink-0">
                <RepoLensLogo size="sm" variant="icon" />
              </div>
            )}

            <div
              className={`max-w-2xl rounded-xl p-4 shadow-sm space-y-space-sm ${
                msg.role === 'user'
                  ? 'bg-primary-container text-on-primary-container font-medium'
                  : 'bg-surface-container-low border border-surface-container-high text-on-surface'
              }`}
            >
              <div className="text-body-sm leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </div>

              {/* Code Snippet / Diff Display */}
              {msg.codeSnippet && (
                <div className="rounded-lg bg-black/70 border border-surface-container-highest p-3 font-code text-xs overflow-x-auto text-left leading-relaxed">
                  {msg.codeSnippet.filePath && (
                    <div className="text-outline text-[11px] pb-1 border-b border-surface-container-highest mb-2">
                      {msg.codeSnippet.filePath}
                    </div>
                  )}
                  <pre className="text-on-surface">{msg.codeSnippet.code}</pre>
                </div>
              )}

              {/* Action Buttons */}
              {msg.suggestedActions && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {msg.suggestedActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (action.includes('Blast')) navigate('/blast-radius');
                        else if (action.includes('Patch')) navigate('/issues');
                        else if (action.includes('Tests')) navigate('/testing');
                        else handleSend(action);
                      }}
                      className="px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high border border-surface-container-highest text-xs font-code text-primary-container transition-colors"
                    >
                      {action} →
                    </button>
                  ))}
                </div>
              )}

              <div
                className={`text-[10px] font-code ${
                  msg.role === 'user' ? 'text-on-primary-container/70 text-right' : 'text-outline'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {/* AI typing indicator */}
        {isLoading && (
          <div className="flex items-start gap-space-sm justify-start">
            <div className="mt-1 flex-shrink-0">
              <RepoLensLogo size="sm" variant="icon" />
            </div>
            <div className="rounded-xl p-4 bg-surface-container-low border border-surface-container-high flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-container animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-primary-container animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-primary-container animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 text-xs text-outline">
        <span className="text-[10px] font-label-caps uppercase flex-shrink-0">Suggestions:</span>
        {[
          'Explain blast radius of validate_token',
          'Generate patch for CWE-78',
          'Break circular dependency in core.tokens',
          'Which tests should run?',
        ].map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip)}
            className="px-2.5 py-1 rounded-full bg-surface-container-low hover:bg-surface-container border border-surface-container-highest text-on-surface-variant hover:text-on-surface whitespace-nowrap transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Form Bar */}
      <div className="p-space-sm bg-surface-container-low border border-surface-container-high rounded-xl flex items-center gap-space-sm">
        <input
          type="text"
          placeholder="Ask RepoLens AI about blast radius, architecture, or code vulnerabilities..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          className="flex-1 bg-transparent px-2 py-1.5 text-on-surface text-body-sm focus:outline-none placeholder:text-outline font-body"
        />
        <button
          onClick={() => handleSend()}
          className="p-2.5 rounded-lg bg-primary-container hover:bg-primary-fixed-dim text-on-primary-container transition-all shadow-glow-lime flex items-center justify-center flex-shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">send</span>
        </button>
      </div>
    </div>
  );
};
