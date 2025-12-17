'use client';

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSystemSettings, updateSystemSetting } from "@/app/actions/system-settings";
import { testNowApiConnection, testAiConnection, getAiModels } from "@/app/actions/ai";
import { refreshDailyLoveQuote } from "@/app/actions/love-quote";
import { toast } from "sonner";
import { Loader2, Save, Bot, Database, CheckCircle2, XCircle, RefreshCw, MessageSquarePlus, Trash2, Plus, Heart, Wallet, Activity, Utensils, Upload } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const QUOTE_TEMPLATES = [
  { id: 'love_quote', name: '每日情话', icon: Heart },
  { id: 'financial_status', name: '财务状况', icon: Wallet },
  { id: 'spending_diagnosis', name: '消费诊断', icon: Activity },
  { id: 'what_to_eat', name: '今天吃什么', icon: Utensils },
];

export function ApiSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingQuote, setGeneratingQuote] = useState(false);
  const [testingNow, setTestingNow] = useState(false);
  const [testingAi, setTestingAi] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [availableModels, setAvailableModels] = useState<{id: string, name: string}[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  const [settings, setSettings] = useState({
    k780_appkey: '',
    k780_sign: '',
    ai_provider: 'deepseek',
    ai_api_key: '',
    ai_model: 'deepseek-chat',
    ai_quick_questions: [] as string[],
    ai_avatar: '',
    love_start_date: '',
    love_quote_prompt: '',
    active_quote_template: 'love_quote',
    template_prompt_financial_status: '',
    template_prompt_spending_diagnosis: '',
    template_prompt_what_to_eat: '',
  });

  const [newQuestion, setNewQuestion] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  // 当 Provider 或 API Key 变化时，尝试加载模型列表
  useEffect(() => {
    if (settings.ai_api_key && settings.ai_provider) {
      fetchModels();
    }
  }, [settings.ai_provider, settings.ai_api_key]);

  async function loadSettings() {
    try {
      const data = await getSystemSettings();
      let quickQuestions: string[] = [];
      try {
        if (data.ai_quick_questions) {
          quickQuestions = JSON.parse(data.ai_quick_questions);
        } else {
          // 默认快捷问答
          quickQuestions = [
            "分析我最近的消费情况",
            "我的资产配置合理吗？",
            "最近有什么大额支出？"
          ];
        }
      } catch (e) {
        console.error("Failed to parse quick questions", e);
      }

      setSettings({
        k780_appkey: data.k780_appkey || '',
        k780_sign: data.k780_sign || '',
        ai_provider: data.ai_provider || 'deepseek',
        ai_api_key: data.ai_api_key || '',
        ai_model: data.ai_model || 'deepseek-chat',
        ai_quick_questions: quickQuestions,
        ai_avatar: data.ai_avatar || '',
        love_start_date: data.love_start_date || '',
        love_quote_prompt: data.love_quote_prompt || '',
        active_quote_template: data.active_quote_template || 'love_quote',
        template_prompt_financial_status: data.template_prompt_financial_status || '',
        template_prompt_spending_diagnosis: data.template_prompt_spending_diagnosis || '',
        template_prompt_what_to_eat: data.template_prompt_what_to_eat || '',
      });
    } catch (error) {
      toast.error("加载设置失败");
    } finally {
      setLoading(false);
    }
  }

  async function fetchModels() {
    if (!settings.ai_api_key) return;
    
    setLoadingModels(true);
    try {
      const result = await getAiModels(settings.ai_provider, settings.ai_api_key);
      if (result.models) {
        setAvailableModels(result.models);
        // 如果当前选中的模型不在列表中，默认选中第一个
        if (result.models.length > 0 && !result.models.find(m => m.id === settings.ai_model)) {
          // Don't auto-change if user has a custom model set, unless it's empty
          if (!settings.ai_model) {
             setSettings(prev => ({ ...prev, ai_model: result.models[0].id }));
          }
        }
      } else {
        console.error(result.error);
      }
    } catch (error) {
      console.error("Failed to fetch models", error);
    } finally {
      setLoadingModels(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateSystemSetting('k780_appkey', settings.k780_appkey);
      await updateSystemSetting('k780_sign', settings.k780_sign);
      await updateSystemSetting('ai_provider', settings.ai_provider);
      await updateSystemSetting('ai_api_key', settings.ai_api_key);
      await updateSystemSetting('ai_model', settings.ai_model);
      await updateSystemSetting('ai_quick_questions', JSON.stringify(settings.ai_quick_questions));
      await updateSystemSetting('ai_avatar', settings.ai_avatar);
      await updateSystemSetting('love_start_date', settings.love_start_date);
      await updateSystemSetting('love_quote_prompt', settings.love_quote_prompt);
      await updateSystemSetting('active_quote_template', settings.active_quote_template);
      await updateSystemSetting('template_prompt_financial_status', settings.template_prompt_financial_status);
      await updateSystemSetting('template_prompt_spending_diagnosis', settings.template_prompt_spending_diagnosis);
      await updateSystemSetting('template_prompt_what_to_eat', settings.template_prompt_what_to_eat);
      toast.success("设置已保存");
    } catch (error) {
      toast.error("保存设置失败");
      throw error; // Re-throw to handle in caller
    } finally {
      setSaving(false);
    }
  }

  function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("图片大小不能超过 5MB");
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error("请上传图片文件");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        let width = img.width;
        let height = img.height;
        const maxSize = 200;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        setSettings(prev => ({ ...prev, ai_avatar: compressedBase64 }));
        toast.success("头像已上传");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  async function handleGenerateQuote() {
    setGeneratingQuote(true);
    try {
      // 先保存设置，确保使用最新的 Prompt
      await handleSave();
      
      // 生成情话
      const result = await refreshDailyLoveQuote();
      if (result && result.content) {
        toast.success("内容已重新生成");
      }
    } catch (error) {
      console.error(error);
      toast.error("生成失败");
    } finally {
      setGeneratingQuote(false);
    }
  }

  async function handleTestNowApi() {
    if (!settings.k780_appkey || !settings.k780_sign) {
      toast.error("请先填写 AppKey 和 Sign");
      return;
    }
    setTestingNow(true);
    try {
      const result = await testNowApiConnection(settings.k780_appkey, settings.k780_sign);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("测试失败");
    } finally {
      setTestingNow(false);
    }
  }

  async function handleTestAiApi() {
    if (!settings.ai_api_key) {
      toast.error("请先填写 API Key");
      return;
    }
    setTestingAi(true);
    try {
      const result = await testAiConnection(settings.ai_provider, settings.ai_api_key);
      if (result.success) {
        toast.success(result.message);
        // 测试成功后刷新模型列表
        fetchModels();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("测试失败");
    } finally {
      setTestingAi(false);
    }
  }

  function handleAddQuestion() {
    if (!newQuestion.trim()) return;
    if (settings.ai_quick_questions.includes(newQuestion.trim())) {
      toast.error("该问题已存在");
      return;
    }
    setSettings(prev => ({
      ...prev,
      ai_quick_questions: [...prev.ai_quick_questions, newQuestion.trim()]
    }));
    setNewQuestion("");
  }

  function handleDeleteQuestion(index: number) {
    setSettings(prev => ({
      ...prev,
      ai_quick_questions: prev.ai_quick_questions.filter((_, i) => i !== index)
    }));
  }

  function handleDragStart(e: React.DragEvent, index: number) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    setDraggedIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }

  function handleDragLeave() {
    setDragOverIndex(null);
  }

  function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    
    setDraggedIndex(null);
    setDragOverIndex(null);
    
    if (dragIndex === dropIndex) return;

    const newQuestions = [...settings.ai_quick_questions];
    const [draggedItem] = newQuestions.splice(dragIndex, 1);
    newQuestions.splice(dropIndex, 0, draggedItem);

    setSettings(prev => ({
      ...prev,
      ai_quick_questions: newQuestions
    }));
  }

  function handleDragEnd() {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const renderPromptEditor = () => {
    switch (settings.active_quote_template) {
      case 'love_quote':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="love_start_date">相爱起始日期</Label>
              <Input
                id="love_start_date"
                type="date"
                value={settings.love_start_date}
                onChange={(e) => setSettings({ ...settings, love_start_date: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">设置后将在首页显示相爱天数</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="love_quote_prompt">情话生成提示词 (Prompt)</Label>
              <Textarea
                id="love_quote_prompt"
                value={settings.love_quote_prompt}
                onChange={(e) => setSettings({ ...settings, love_quote_prompt: e.target.value })}
                placeholder="请输入生成情话的 Prompt，可以使用 ${daysLoved} 作为相爱天数的占位符..."
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                可用变量：<code>{"${daysLoved}"}</code> (相爱天数)
              </p>
            </div>
          </>
        );
      case 'financial_status':
        return (
          <div className="space-y-2">
            <Label htmlFor="template_prompt_financial_status">财务状况提示词 (Prompt)</Label>
            <Textarea
              id="template_prompt_financial_status"
              value={settings.template_prompt_financial_status}
              onChange={(e) => setSettings({ ...settings, template_prompt_financial_status: e.target.value })}
              placeholder="请输入生成财务状况的 Prompt..."
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              可用变量：<code>{"${todayIncome}"}</code>, <code>{"${todayExpense}"}</code>, <code>{"${monthIncome}"}</code>, <code>{"${monthExpense}"}</code>, <code>{"${totalBalance}"}</code>
            </p>
          </div>
        );
      case 'spending_diagnosis':
        return (
          <div className="space-y-2">
            <Label htmlFor="template_prompt_spending_diagnosis">消费诊断提示词 (Prompt)</Label>
            <Textarea
              id="template_prompt_spending_diagnosis"
              value={settings.template_prompt_spending_diagnosis}
              onChange={(e) => setSettings({ ...settings, template_prompt_spending_diagnosis: e.target.value })}
              placeholder="请输入生成消费诊断的 Prompt..."
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              可用变量：<code>{"${todayExpense}"}</code>, <code>{"${monthExpense}"}</code>
            </p>
          </div>
        );
      case 'what_to_eat':
        return (
          <div className="space-y-2">
            <Label htmlFor="template_prompt_what_to_eat">今天吃什么提示词 (Prompt)</Label>
            <Textarea
              id="template_prompt_what_to_eat"
              value={settings.template_prompt_what_to_eat}
              onChange={(e) => setSettings({ ...settings, template_prompt_what_to_eat: e.target.value })}
              placeholder="请输入生成菜单推荐的 Prompt..."
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              可用变量：<code>{"${weekday}"}</code> (星期几)
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* 首页寄语设置 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Heart className="w-5 h-5 text-pink-500" />
          <h3 className="font-medium text-slate-900 dark:text-slate-100">首页寄语设置</h3>
        </div>
        <div className="grid gap-4 pl-1">
          <div className="space-y-2">
            <Label htmlFor="active_quote_template">展示模板</Label>
            <Select 
              value={settings.active_quote_template} 
              onValueChange={(value) => setSettings({ ...settings, active_quote_template: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择展示模板" />
              </SelectTrigger>
              <SelectContent>
                {QUOTE_TEMPLATES.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      <template.icon className="w-4 h-4" />
                      {template.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {renderPromptEditor()}

          <div className="pt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleGenerateQuote}
              disabled={generatingQuote}
            >
              {generatingQuote ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              保存并重新生成内容
            </Button>
          </div>
        </div>
      </div>

      {/* 外部数据接口 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-medium text-slate-900 dark:text-slate-100">外部数据接口 (NowAPI)</h3>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleTestNowApi} 
            disabled={testingNow || !settings.k780_appkey}
          >
            {testingNow ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            测试连接
          </Button>
        </div>
        <div className="grid gap-4 pl-1">
          <div className="space-y-2">
            <Label htmlFor="k780_appkey">NowAPI AppKey</Label>
            <Input
              id="k780_appkey"
              value={settings.k780_appkey}
              onChange={(e) => setSettings({ ...settings, k780_appkey: e.target.value })}
              placeholder="请输入 AppKey"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="k780_sign">NowAPI Sign</Label>
            <Input
              id="k780_sign"
              type="password"
              value={settings.k780_sign}
              onChange={(e) => setSettings({ ...settings, k780_sign: e.target.value })}
              placeholder="请输入 Sign"
            />
          </div>
        </div>
      </div>

      {/* AI 助手配置 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="font-medium text-slate-900 dark:text-slate-100">AI 智能助手配置</h3>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleTestAiApi} 
            disabled={testingAi || !settings.ai_api_key}
          >
            {testingAi ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            测试连接
          </Button>
        </div>
        <div className="grid gap-4 pl-1">
          <div className="space-y-2">
            <Label>AI 助手头像</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-primary">
                <AvatarImage src={settings.ai_avatar || undefined} />
                <AvatarFallback>
                  <Bot className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  上传头像
                </Button>
                <p className="text-xs text-muted-foreground">
                  图片将自动压缩至 200x200
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai_provider">服务提供商</Label>
            <Select 
              value={settings.ai_provider} 
              onValueChange={(value) => {
                setSettings({ ...settings, ai_provider: value, ai_model: '' }); // Reset model on provider change
                setAvailableModels([]); // Clear models
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择服务商" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deepseek">DeepSeek</SelectItem>
                <SelectItem value="openrouter">OpenRouter</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="ai_api_key">API Key</Label>
            <Input
              id="ai_api_key"
              type="password"
              value={settings.ai_api_key}
              onChange={(e) => setSettings({ ...settings, ai_api_key: e.target.value })}
              placeholder={`请输入 ${settings.ai_provider === 'deepseek' ? 'DeepSeek' : 'OpenRouter'} API Key`}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="ai_model">模型名称</Label>
              {loadingModels && <span className="text-xs text-muted-foreground flex items-center"><Loader2 className="w-3 h-3 animate-spin mr-1"/> 加载模型列表...</span>}
            </div>
            
            {availableModels.length > 0 ? (
              <Select 
                value={settings.ai_model} 
                onValueChange={(value) => setSettings({ ...settings, ai_model: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择模型" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map(model => (
                    <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="ai_model"
                value={settings.ai_model}
                onChange={(e) => setSettings({ ...settings, ai_model: e.target.value })}
                placeholder="例如: deepseek-chat, deepseek-coder, openai/gpt-4o"
              />
            )}
            
            <p className="text-xs text-muted-foreground">
              {availableModels.length > 0 
                ? '已自动获取可用模型列表' 
                : (settings.ai_provider === 'deepseek' 
                    ? 'DeepSeek 常用模型: deepseek-chat, deepseek-coder' 
                    : 'OpenRouter 请填写完整的模型 ID，如: openai/gpt-4o, anthropic/claude-3-opus')}
            </p>
          </div>
        </div>

        {/* 快捷问答配置 */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 pb-2">
            <MessageSquarePlus className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="font-medium text-slate-900 dark:text-slate-100">快捷问答配置</h3>
          </div>
          <div className="grid gap-4 pl-1">
            <div className="space-y-2">
              <Label>自定义快捷问题</Label>
              <div className="flex gap-2">
                <Input 
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="输入新的快捷问题..."
                  onKeyDown={(e) => e.key === 'Enter' && handleAddQuestion()}
                />
                <Button onClick={handleAddQuestion} variant="secondary">
                  <Plus className="w-4 h-4 mr-1" /> 添加
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-3">
                {settings.ai_quick_questions.map((q, index) => (
                  <div 
                    key={index} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm cursor-move transition-all duration-200 ${
                      draggedIndex === index 
                        ? 'opacity-40 scale-95 bg-slate-200 dark:bg-slate-700' 
                        : dragOverIndex === index
                        ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-400 dark:ring-blue-600 scale-105'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="select-none">{q}</span>
                    <button 
                      onClick={() => handleDeleteQuestion(index)}
                      className="text-slate-400 hover:text-red-500 transition-colors ml-1"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {settings.ai_quick_questions.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">暂无快捷问题</p>
                )}
              </div>
              {settings.ai_quick_questions.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  💡 提示：拖拽问题可以调整顺序
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              保存中
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              保存设置
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
