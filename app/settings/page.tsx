import { getCurrentUser } from "@/app/actions/user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileForm } from "@/components/settings/profile-form";
import { PasswordForm } from "@/components/settings/password-form";
import { AppearanceForm } from "@/components/settings/appearance-form";
import { CategoriesSettings } from "@/components/settings/categories-settings";
import { AssetTypeSettings } from "@/components/settings/asset-type-settings";
import { UsersSettings } from "@/components/settings/users-settings";
import { ApiSettings } from "@/components/settings/api-settings";
import { redirect } from "next/navigation";
import { 
  User, 
  Layers, 
  Users, 
  Shield, 
  Palette, 
  Settings as SettingsIcon,
  Key
} from "lucide-react";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/users');
  }

  const isAdmin = user.email === 'mobowp027@gmail.com' || (user as any).role === 'ADMIN';
  const params = await searchParams;
  const defaultTab = typeof params.tab === 'string' ? params.tab : 'profile';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8 pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <div className="p-3 bg-blue-600/10 dark:bg-blue-400/10 rounded-xl">
            <SettingsIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              系统设置
            </h2>
            <p className="text-muted-foreground mt-1">
              管理您的账户信息、系统偏好及安全设置
            </p>
          </div>
        </div>

        <Tabs defaultValue={defaultTab} className="flex flex-col lg:flex-row gap-6">
          
          {/* Sidebar Navigation */}
          <aside className="lg:w-1/4">
            <Card className="border-white/20 dark:border-slate-700/30 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-xl lg:sticky lg:top-8">
              <CardContent className="p-2 lg:p-4">
                <TabsList className="flex flex-row lg:flex-col w-full h-auto items-center lg:items-stretch justify-start bg-transparent p-1 space-x-2 lg:space-x-0 lg:space-y-2 overflow-x-auto no-scrollbar">
                  <TabsTrigger 
                    value="profile" 
                    className="flex-shrink-0 justify-center lg:justify-start px-3 py-2 lg:px-4 lg:py-3 h-auto whitespace-nowrap data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all rounded-lg group"
                  >
                    <User className="w-4 h-4 mr-2 lg:mr-3 text-slate-500 group-data-[state=active]:text-blue-600 dark:group-data-[state=active]:text-blue-400" />
                    <span className="font-medium">个人信息</span>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="categories" 
                    className="flex-shrink-0 justify-center lg:justify-start px-3 py-2 lg:px-4 lg:py-3 h-auto whitespace-nowrap data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all rounded-lg group"
                  >
                    <Layers className="w-4 h-4 mr-2 lg:mr-3 text-slate-500 group-data-[state=active]:text-blue-600 dark:group-data-[state=active]:text-blue-400" />
                    <span className="font-medium">分类管理</span>
                  </TabsTrigger>
                  
                  {isAdmin && (
                    <TabsTrigger 
                      value="users" 
                      className="flex-shrink-0 justify-center lg:justify-start px-3 py-2 lg:px-4 lg:py-3 h-auto whitespace-nowrap data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all rounded-lg group"
                    >
                      <Users className="w-4 h-4 mr-2 lg:mr-3 text-slate-500 group-data-[state=active]:text-blue-600 dark:group-data-[state=active]:text-blue-400" />
                      <span className="font-medium">用户管理</span>
                    </TabsTrigger>
                  )}
                  
                  {isAdmin && (
                    <TabsTrigger 
                      value="api" 
                      className="flex-shrink-0 justify-center lg:justify-start px-3 py-2 lg:px-4 lg:py-3 h-auto whitespace-nowrap data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all rounded-lg group"
                    >
                      <Key className="w-4 h-4 mr-2 lg:mr-3 text-slate-500 group-data-[state=active]:text-blue-600 dark:group-data-[state=active]:text-blue-400" />
                      <span className="font-medium">API 配置</span>
                    </TabsTrigger>
                  )}
                  
                  <TabsTrigger 
                    value="security" 
                    className="flex-shrink-0 justify-center lg:justify-start px-3 py-2 lg:px-4 lg:py-3 h-auto whitespace-nowrap data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all rounded-lg group"
                  >
                    <Shield className="w-4 h-4 mr-2 lg:mr-3 text-slate-500 group-data-[state=active]:text-blue-600 dark:group-data-[state=active]:text-blue-400" />
                    <span className="font-medium">账号安全</span>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="appearance" 
                    className="flex-shrink-0 justify-center lg:justify-start px-3 py-2 lg:px-4 lg:py-3 h-auto whitespace-nowrap data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all rounded-lg group"
                  >
                    <Palette className="w-4 h-4 mr-2 lg:mr-3 text-slate-500 group-data-[state=active]:text-blue-600 dark:group-data-[state=active]:text-blue-400" />
                    <span className="font-medium">外观设置</span>
                  </TabsTrigger>
                </TabsList>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 lg:max-w-4xl">
            <Card className="border-white/20 dark:border-slate-700/30 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-xl min-h-[500px]">
              <CardContent className="p-6 md:p-8">
                <TabsContent value="profile" className="space-y-6 mt-0 animate-in fade-in-50 duration-300">
                  <div>
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      个人信息
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      更新您的基本资料，这将显示在交易记录中。
                    </p>
                  </div>
                  <div className="border-t border-slate-200/60 dark:border-slate-700/60" />
                  <ProfileForm user={user} />
                </TabsContent>

                <TabsContent value="categories" className="space-y-8 mt-0 animate-in fade-in-50 duration-300">
                  <div>
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      分类管理
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      自定义收支分类和资产类型，打造专属记账体系。
                    </p>
                  </div>
                  <div className="border-t border-slate-200/60 dark:border-slate-700/60" />
                  <div className="space-y-8">
                    <CategoriesSettings />
                    <div className="border-t border-slate-200/60 dark:border-slate-700/60 border-dashed" />
                    <AssetTypeSettings />
                  </div>
                </TabsContent>

                {isAdmin && (
                  <TabsContent value="users" className="space-y-6 mt-0 animate-in fade-in-50 duration-300">
                    <div>
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        用户管理
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        创建和管理系统用户，分配权限。
                      </p>
                    </div>
                    <div className="border-t border-slate-200/60 dark:border-slate-700/60" />
                    <UsersSettings />
                  </TabsContent>
                )}

                {isAdmin && (
                  <TabsContent value="api" className="space-y-6 mt-0 animate-in fade-in-50 duration-300">
                    <div>
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        API 配置
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        配置外部数据接口的密钥和参数。
                      </p>
                    </div>
                    <div className="border-t border-slate-200/60 dark:border-slate-700/60" />
                    <ApiSettings />
                  </TabsContent>
                )}

                <TabsContent value="security" className="space-y-6 mt-0 animate-in fade-in-50 duration-300">
                  <div>
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      账号安全
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      定期更新密码以保护您的账号安全。
                    </p>
                  </div>
                  <div className="border-t border-slate-200/60 dark:border-slate-700/60" />
                  <PasswordForm />
                </TabsContent>

                <TabsContent value="appearance" className="space-y-6 mt-0 animate-in fade-in-50 duration-300">
                  <div>
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <Palette className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      外观设置
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      自定义系统显示效果，选择您喜欢的主题。
                    </p>
                  </div>
                  <div className="border-t border-slate-200/60 dark:border-slate-700/60" />
                  <AppearanceForm />
                </TabsContent>
              </CardContent>
            </Card>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
