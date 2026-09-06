import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { RepoLensLogo } from '../components/common/RepoLensLogo';
import { ChatMessage } from '../types';
import { analysisService, DEMO_ANALYSIS_ID } from '../services/api';

export const AiAssistantPage: React.FC = () => {
  const { activeRepo } = useApp();
  const navigate = useNavigate();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contextFile, setContextFile] = useState<string>('src/services/paymentService.js');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const msgIdCounter = useRef(10);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        `Hello! I am RepoLens AI Assistant powered by Google Gemini.\n\nI have real-time access to the deterministic static analysis pipeline for **${activeRepo?.name || 'repolens-demo'}**.\n\nAsk me anything about:\n• **Blast Radius Impact:** Downstream ripple simulation for code changes\n• **Security Vulnerabilities:** Hardcoded secrets, injection vectors, and CWE remediation\n• **Architectural Insights:** Circular dependency resolution and component coupling`,
      timestamp: '14:20',
      suggestedActions: [
        'Explain blast radius of paymentService.js',
        'How to fix the hardcoded API secret?',
        'Break circular dependency in paymentService ↔ notificationService',
        'Which test suites should run for payment changes?',
      ],
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const extractCodeBlocks = (text: string) => {
    const codeBlockRegex = /```(?:(\w+)\n)?([\s\S]*?)```/g;
    const match = codeBlockRegex.exec(text);
    if (match) {
      const language = match[1] || 'javascript';
      const code = match[2].trim();
      const isDiff = code.startsWith('+') || code.startsWith('-') || language === 'diff';
      return { language, code, isDiff };
    }
    return null;
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

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

    try {
      const analysisId = await analysisService.getAnalysisIdForRepo(activeRepo?.id);
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await analysisService.chatWithAi(
        analysisId || DEMO_ANALYSIS_ID,
        text,
        contextFile,
        history
      );

      msgIdCounter.current += 1;
      const codeSnippet = extractCodeBlocks(res.answer);

      const aiReply: ChatMessage = {
        id: `msg-${msgIdCounter.current}`,
        role: 'assistant',
        content: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        codeSnippet: codeSnippet
          ? {
              language: codeSnippet.language,
              code: codeSnippet.code,
              diff: codeSnippet.isDiff,
              filePath: res.referenced_files?.[0] || contextFile,
            }
          : undefined,
        suggestedActions:
          text.toLowerCase().includes('blast')
            ? ['Open in Blast Simulator', 'View Architecture Graph']
            : text.toLowerCase().includes('secret') || text.toLowerCase().includes('security')
            ? ['View Security Findings', 'Simulate Blast Radius']
            : ['Simulate Blast Radius', 'Check Testing Recommendations'],
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (err: any) {
      console.error('Error querying AI chatbot:', err);
      msgIdCounter.current += 1;
      const errorReply: ChatMessage = {
        id: `msg-${msgIdCounter.current}`,
        role: 'assistant',
        content:
          "I experienced a connection issue reaching the AI service. The deterministic analysis graphs and security findings remain fully available in the navigation tabs above.",
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
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
            <span className="font-label-caps text-label-caps px-space-xs py-space-2xs rounded bg-surface-container text-primary-container font-mono font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
              GEMINI AI INTELLIGENCE
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-outline font-code">
            <span>Repository Context:</span>
            <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface font-semibold">
              {activeRepo?.name || 'repolens-demo'}
            </span>
            <span>Focus File:</span>
            <select
              value={contextFile}
              onChange={(e) => setContextFile(e.target.value)}
              className="bg-surface-container border border-surface-container-highest text-primary-container rounded px-1.5 py-0.5 font-code text-xs focus:outline-none"
            >
              <option value="src/services/paymentService.js">src/services/paymentService.js</option>
              <option value="src/services/notificationService.js">src/services/notificationService.js</option>
              <option value="src/controllers/paymentController.js">src/controllers/paymentController.js</option>
              <option value="src/utils/logger.js">src/utils/logger.js</option>
              <option value="services/auth_service.py">services/auth_service.py</option>
            </select>
          </div>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                id: '1',
                role: 'assistant',
                content: 'Chat context reset. How can I assist you with repository intelligence and Gemini explanations?',
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
                <RepoLensLogo size="sm" showVersion={false} />
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
                <div className="rounded-lg bg-black/80 border border-surface-container-highest p-3 font-code text-xs overflow-x-auto text-left leading-relaxed">
                  {msg.codeSnippet.filePath && (
                    <div className="text-outline text-[11px] pb-1 border-b border-surface-container-highest mb-2 flex items-center justify-between">
                      <span>{msg.codeSnippet.filePath}</span>
                      <span className="text-[10px] text-primary-container uppercase font-mono">
                        {msg.codeSnippet.diff ? 'DIFF PATCH' : msg.codeSnippet.language}
                      </span>
                    </div>
                  )}
                  <pre className="text-on-surface font-mono">{msg.codeSnippet.code}</pre>
                </div>
              )}

              {/* Action Buttons */}
              {msg.suggestedActions && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {msg.suggestedActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (action.includes('Blast') || action.includes('Simulator')) navigate('/blast-radius');
                        else if (action.includes('Architecture')) navigate('/architecture');
                        else if (action.includes('Security') || action.includes('Findings')) navigate('/security');
                        else if (action.includes('Testing') || action.includes('Test')) navigate('/testing');
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

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-space-sm justify-start">
            <div className="mt-1 flex-shrink-0">
              <RepoLensLogo size="sm" showVersion={false} />
            </div>
            <div className="max-w-md rounded-xl p-4 bg-surface-container-low border border-surface-container-high text-on-surface flex items-center gap-3">
              <span className="material-symbols-outlined text-primary-container text-[20px] animate-spin">
                autorenew
              </span>
              <span className="text-xs font-code text-outline">
                Gemini AI is analyzing code topology and findings...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 text-xs text-outline">
        <span className="text-[10px] font-label-caps uppercase flex-shrink-0">Quick Queries:</span>
        {[
          'Explain blast radius of paymentService.js',
          'How to fix the hardcoded API secret?',
          'Break circular dependency in paymentService',
          'Which tests should run for payment changes?',
        ].map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-full bg-surface-container-low hover:bg-surface-container border border-surface-container-highest text-on-surface-variant hover:text-on-surface whitespace-nowrap transition-colors disabled:opacity-50"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Form Bar */}
      <div className="p-space-sm bg-surface-container-low border border-surface-container-high rounded-xl flex items-center gap-space-sm">
        <input
          type="text"
          placeholder="Ask RepoLens AI (Gemini) about blast radius, architecture, or code vulnerabilities..."
          value={input}
          disabled={isLoading}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          className="flex-1 bg-transparent px-2 py-1.5 text-on-surface text-body-sm focus:outline-none placeholder:text-outline font-body"
        />
        <button
          onClick={() => handleSend()}
          disabled={isLoading || !input.trim()}
          className="p-2.5 rounded-lg bg-primary-container hover:bg-primary-fixed-dim text-on-primary-container transition-all shadow-glow-lime flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:shadow-none"
        >
          {isLoading ? (
            <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
          ) : (
            <span className="material-symbols-outlined text-[18px]">send</span>
          )}
        </button>
      </div>
    </div>
  );
};
