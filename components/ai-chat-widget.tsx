'use client';

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bot, Send, X, MessageSquare, Loader2, User, Square, RefreshCcw, MessageSquarePlus, Plus } from "lucide-react";
import { chatWithAI, Message } from "@/app/actions/ai";
import { getSystemSettings } from "@/app/actions/system-settings";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '你好！我是你的家庭理财助手。我可以帮你分析财务状况、总结花销，或者回答关于理财的问题。' }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [quickQuestions, setQuickQuestions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      loadQuickQuestions();
    }
    
    // 处理移动端滚动穿透问题
    const handleResize = () => {
      if (isOpen && window.innerWidth < 768) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }
    };

    // 初始化检查
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  async function loadQuickQuestions() {
    try {
      const data = await getSystemSettings();
      if (data.ai_quick_questions) {
        setQuickQuestions(JSON.parse(data.ai_quick_questions));
      } else {
        setQuickQuestions([
          "分析我最近的消费情况",
          "我的资产配置合理吗？",
          "最近有什么大额支出？"
        ]);
      }
    } catch (e) {
      console.error("Failed to load quick questions", e);
    }
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  async function handleSend(text?: string) {
    const content = text || input;
    if (!content.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: content };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    abortRef.current = false;

    try {
      // 仅发送最近的 10 条消息作为历史记录，避免 token 超出
      const history = messages.slice(-10);
      const response = await chatWithAI([...history, userMessage]);

      if (abortRef.current) return;

      if (response.error) {
        toast.error(response.error);
        setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ 错误: ${response.error}` }]);
      } else if (response.content) {
        setMessages(prev => [...prev, { role: 'assistant', content: response.content }]);
      }
    } catch (error) {
      if (!abortRef.current) {
        toast.error("发送失败");
      }
    } finally {
      if (!abortRef.current) {
        setIsLoading(false);
      }
    }
  }

  function handleStop() {
    abortRef.current = true;
    setIsLoading(false);
    toast.info("已停止生成");
  }

  function handleNewChat() {
    if (isLoading) {
      abortRef.current = true;
      setIsLoading(false);
    }
    setMessages([
      { role: 'assistant', content: '你好！我是你的家庭理财助手。我可以帮你分析财务状况、总结花销，或者回答关于理财的问题。' }
    ]);
    toast.success("已开启新对话");
  }

  return (
    <>
      {/* 悬浮按钮 */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white p-0 z-50 transition-transform hover:scale-105"
        >
          <Bot className="h-8 w-8" />
        </Button>
      )}

      {/* 聊天窗口 */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[90vw] md:w-[400px] h-[600px] max-h-[80vh] z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <Card className="h-full flex flex-col shadow-2xl border-slate-200 dark:border-slate-800 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 flex flex-row items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Bot className="h-6 w-6" />
                <CardTitle className="text-lg">理财助手</CardTitle>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleNewChat}
                  className="text-white hover:bg-white/20 h-8 w-8"
                  title="新建对话"
                >
                  <Plus className="h-5 w-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 h-8 w-8"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 p-0 overflow-hidden bg-slate-50 dark:bg-slate-950 flex flex-col">
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex w-full",
                      msg.role === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                        msg.role === 'user'
                          ? "bg-blue-600 text-white rounded-br-none"
                          : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-700"
                      )}
                    >
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-1.5 mb-1 text-xs text-slate-400 dark:text-slate-500 font-medium">
                          <Bot className="h-3 w-3" />
                          AI 助手
                        </div>
                      )}
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none break-words prose-p:leading-relaxed prose-pre:bg-slate-100 dark:prose-pre:bg-slate-900 prose-pre:p-2 prose-pre:rounded-lg">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap leading-relaxed">
                          {msg.content}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start w-full">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm border border-slate-200 dark:border-slate-700">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 快捷问答区域 */}
              {quickQuestions.length > 0 && !isLoading && (
                <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar border-t border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                  {quickQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(q)}
                      className="flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors border border-blue-100 dark:border-blue-800/50"
                    >
                      <MessageSquarePlus className="w-3.5 h-3.5" />
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>

            <CardFooter className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex w-full gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="输入您的问题..."
                  className="flex-1 focus-visible:ring-purple-500"
                  disabled={isLoading}
                />
                <Button 
                  type="button"
                  size="icon" 
                  onClick={isLoading ? handleStop : () => handleSend()}
                  disabled={!isLoading && !input.trim()}
                  className={cn(
                    "shrink-0 text-white transition-colors",
                    isLoading 
                      ? "bg-red-500 hover:bg-red-600" 
                      : "bg-blue-600 hover:bg-blue-700"
                  )}
                >
                  {isLoading ? <Square className="h-4 w-4 fill-current" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
}
