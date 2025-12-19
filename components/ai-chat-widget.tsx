'use client';

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bot, Send, X, Square, MessageSquarePlus, Plus, ChevronDown, ChevronUp, Brain } from "lucide-react";
import { Message } from "@/app/actions/ai";
import { getSystemSettings } from "@/app/actions/system-settings";
import { getCurrentUser } from "@/app/actions/user";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export function AiChatWidget() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string | null; email: string | null; image: string | null } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '你好！我是你的家庭理财助手。我可以帮你分析财务状况、总结花销，或者回答关于理财的问题。' }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [quickQuestions, setQuickQuestions] = useState<string[]>([]);
  const [aiAvatar, setAiAvatar] = useState<string>("");
  const [aiModel, setAiModel] = useState<string>("");
  const [expandedReasoning, setExpandedReasoning] = useState<Set<number>>(new Set());
  const [isMounted, setIsMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef(false);

  useEffect(() => {
    setIsMounted(true);
    if (pathname === "/login" || pathname === "/register" || pathname === "/forgot-password" || pathname === "/reset-password") {
      return;
    }
    const cachedAvatar = localStorage.getItem('ai_avatar');
    const cachedModel = localStorage.getItem('ai_model');
    if (cachedAvatar) setAiAvatar(cachedAvatar);
    if (cachedModel) setAiModel(cachedModel);
    loadAiSettings();
    loadUserData();
  }, [pathname]);

  async function loadUserData() {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (e) {
      console.error("Failed to load user data", e);
    }
  }

  useEffect(() => {
    if (pathname === "/login" || pathname === "/register" || pathname === "/forgot-password" || pathname === "/reset-password") {
      return;
    }
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

  async function loadAiSettings() {
    try {
      const data = await getSystemSettings();
      if (data.ai_avatar) {
        setAiAvatar(data.ai_avatar);
        localStorage.setItem('ai_avatar', data.ai_avatar);
      } else {
        localStorage.removeItem('ai_avatar');
      }
      if (data.ai_model) {
        setAiModel(data.ai_model);
        localStorage.setItem('ai_model', data.ai_model);
      } else {
        localStorage.removeItem('ai_model');
      }
    } catch (e) {
      console.error("Failed to load AI settings", e);
    }
  }

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

  const isReasoningModel = (model: string) => {
    return model.includes('reasoner') || model.includes('r1');
  };

  const toggleReasoning = (index: number) => {
    setExpandedReasoning(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  async function handleSend(question?: string) {
    const messageToSend = question || input.trim();
    if (!messageToSend || isLoading) return;

    setInput("");
    setIsLoading(true);
    abortRef.current = false;

    const userMessage: Message = { role: 'user', content: messageToSend };
    setMessages(prev => [...prev, userMessage]);

    const assistantMessageIndex = messages.length + 1;

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error('AI 服务请求失败');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('无法读取响应流');
      }

      let accumulatedContent = '';
      let accumulatedReasoning = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done || abortRef.current) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const json = JSON.parse(data);
              const delta = json.choices?.[0]?.delta;

              if (delta?.reasoning_content) {
                accumulatedReasoning += delta.reasoning_content;
              }

              if (delta?.content) {
                accumulatedContent += delta.content;
              }

              if (delta?.reasoning_content || delta?.content) {
                setMessages(prev => {
                  const newMessages = [...prev];
                  if (newMessages.length === assistantMessageIndex) {
                    newMessages.push({
                      role: 'assistant',
                      content: accumulatedContent,
                      reasoning_content: accumulatedReasoning || undefined
                    });
                  } else {
                    newMessages[assistantMessageIndex] = {
                      role: 'assistant',
                      content: accumulatedContent,
                      reasoning_content: accumulatedReasoning || undefined
                    };
                  }
                  return newMessages;
                });
                
                if (isLoading) {
                  setIsLoading(false);
                }
              }
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }
      }

      if (isLoading) {
        setIsLoading(false);
      }

      if (abortRef.current) {
        setMessages(prev => {
          const newMessages = [...prev];
          if (newMessages.length === assistantMessageIndex) {
            newMessages.push({
              role: 'assistant',
              content: accumulatedContent || '⚠️ 已取消',
              reasoning_content: accumulatedReasoning || undefined
            });
          } else {
            newMessages[assistantMessageIndex] = {
              role: 'assistant',
              content: accumulatedContent || '⚠️ 已取消',
              reasoning_content: accumulatedReasoning || undefined
            };
          }
          return newMessages;
        });
      } else if (accumulatedContent === '' && !abortRef.current) {
        setMessages(prev => {
          const newMessages = [...prev];
          if (newMessages.length === assistantMessageIndex) {
            newMessages.push({
              role: 'assistant',
              content: '⚠️ 未收到回复'
            });
          }
          return newMessages;
        });
      }

    } catch (error: any) {
      if (!abortRef.current) {
        toast.error("发送消息失败");
        setMessages(prev => {
          const newMessages = [...prev];
          if (newMessages.length === assistantMessageIndex) {
            newMessages.push({
              role: 'assistant',
              content: "⚠️ 抱歉，发送消息时出现错误。"
            });
          } else {
            newMessages[assistantMessageIndex] = {
              role: 'assistant',
              content: "⚠️ 抱歉，发送消息时出现错误。"
            };
          }
          return newMessages;
        });
      }
    } finally {
      setIsLoading(false);
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

  if (pathname === "/login" || pathname === "/register" || pathname === "/forgot-password" || pathname === "/reset-password") {
    return null;
  }

  return (
    <>
      {/* 悬浮按钮 */}
      {!isOpen && isMounted && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white p-0 z-50 transition-transform hover:scale-105 overflow-hidden"
        >
          {aiAvatar ? (
            <Avatar className="h-14 w-14">
              <AvatarImage src={aiAvatar} className="object-cover" />
              <AvatarFallback>
                <Bot className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
          ) : (
            <Bot className="h-8 w-8" />
          )}
        </Button>
      )}

      {/* 聊天窗口 */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[90vw] md:w-[400px] h-[600px] max-h-[80vh] z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <Card className="h-full flex flex-col shadow-2xl border-slate-200 dark:border-slate-800 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 flex flex-row items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                {aiAvatar ? (
                  <Avatar className="h-8 w-8 border-2 border-white">
                    <AvatarImage src={aiAvatar} className="object-cover" />
                    <AvatarFallback>
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Bot className="h-6 w-6" />
                )}
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
                className="flex-1 overflow-y-auto p-4 space-y-3"
              >
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex gap-2 items-start",
                      msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    {msg.role === 'assistant' ? (
                      <Avatar className="h-9 w-9 shrink-0 mt-0.5 ring-2 ring-purple-100 dark:ring-purple-900">
                        <AvatarImage src={aiAvatar} className="object-cover" />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500">
                          <Bot className="h-5 w-5 text-white" />
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <Avatar className="h-9 w-9 shrink-0 mt-0.5 ring-2 ring-blue-100 dark:ring-blue-900">
                        <AvatarImage src={user?.image || undefined} className="object-cover" />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-sm font-medium">
                          {user?.name?.charAt(0) || '我'}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div className={cn(
                      "flex flex-col gap-1 max-w-[75%]",
                      msg.role === 'user' ? "items-end" : "items-start"
                    )}>
                      {msg.role === 'assistant' && isReasoningModel(aiModel) && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30">
                          <Brain className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                          <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">深度思考</span>
                        </div>
                      )}

                      <div
                        className={cn(
                          "rounded-2xl px-3 py-2 text-sm shadow-sm",
                          msg.role === 'user'
                            ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                            : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                        )}
                      >
                        {msg.role === 'assistant' && msg.reasoning_content && (
                          <div className="mb-2 border-l-2 border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 rounded-r-lg overflow-hidden">
                            <button
                              onClick={() => toggleReasoning(index)}
                              className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                            >
                              <div className="flex items-center gap-1.5">
                                <Brain className="h-3 w-3" />
                                <span>思考过程</span>
                                {!expandedReasoning.has(index) && isLoading && index === messages.length - 1 && (
                                  <span className="ml-1 text-[10px] text-purple-500 dark:text-purple-400 animate-pulse">
                                    · 正在深度思考...
                                  </span>
                                )}
                              </div>
                              {expandedReasoning.has(index) ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </button>
                            {expandedReasoning.has(index) && (
                              <div className="px-2.5 py-2 text-xs text-purple-900 dark:text-purple-100 border-t border-purple-200 dark:border-purple-800">
                                <div className="prose prose-xs dark:prose-invert max-w-none break-words">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {msg.reasoning_content}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none break-words prose-p:leading-relaxed prose-p:my-1 prose-pre:bg-slate-100 dark:prose-pre:bg-slate-900 prose-pre:p-2 prose-pre:rounded-lg prose-pre:my-2">
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
                  </div>
                ))}
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
