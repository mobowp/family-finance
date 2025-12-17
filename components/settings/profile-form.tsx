'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/app/actions/settings";
import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const PRESET_AVATARS = [
  // Men
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Alexander",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Jack",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Caleb",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Ryan",
  // Women
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Jessica",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Bella",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Sophie",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Willow",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Andrea",
];

export function ProfileForm({ user }: { user: any }) {
  const [loading, setLoading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(user.image || PRESET_AVATARS[0]);

  return (
    <form 
      action={async (formData) => {
        setLoading(true);
        await updateProfile(formData);
        setLoading(false);
        alert("个人信息已更新");
      }} 
      className="space-y-6 max-w-md"
    >
      <div className="space-y-4">
        <Label>个人头像</Label>
        <input type="hidden" name="image" value={selectedAvatar} />
        <div className="flex flex-col items-center gap-4">
           <Avatar className="h-24 w-24 border-2 border-primary">
              <AvatarImage src={selectedAvatar} />
              <AvatarFallback>{user.name?.[0]}</AvatarFallback>
           </Avatar>
           
           <div className="flex flex-wrap gap-2 justify-center">
              {PRESET_AVATARS.map((avatar, index) => (
                  <div 
                      key={index}
                      className={`cursor-pointer rounded-full p-0.5 border-2 transition-all ${selectedAvatar === avatar ? 'border-primary' : 'border-transparent hover:border-muted'}`}
                      onClick={() => setSelectedAvatar(avatar)}
                  >
                      <Avatar className="h-10 w-10">
                          <AvatarImage src={avatar} />
                          <AvatarFallback>icon</AvatarFallback>
                      </Avatar>
                  </div>
              ))}
           </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">称呼</Label>
        <Input id="name" name="name" defaultValue={user.name} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">邮箱</Label>
        <Input id="email" name="email" type="email" defaultValue={user.email} required />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "保存中..." : "保存更改"}
      </Button>

      {user.familyId && user.role === 'ADMIN' && (
        <div className="space-y-2 pt-4 border-t">
          <Label>家庭邀请链接</Label>
          <div className="flex gap-2">
            <Input 
              readOnly 
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/register?invite=${user.familyId}`} 
            />
            <Button 
              type="button" 
              variant="outline"
              onClick={() => {
                const url = `${window.location.origin}/register?invite=${user.familyId}`;
                navigator.clipboard.writeText(url);
                alert("邀请链接已复制");
              }}
            >
              复制
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            将此链接发送给家人，他们注册后将自动加入您的家庭。
          </p>
        </div>
      )}
    </form>
  );
}
