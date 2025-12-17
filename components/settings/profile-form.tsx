'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/app/actions/settings";
import { useState, useRef } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Upload } from "lucide-react";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("图片大小不能超过 5MB");
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert("请上传图片文件");
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
        setSelectedAvatar(compressedBase64);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

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
           
           <div className="flex flex-col gap-3 w-full">
             <div className="flex justify-center">
               <input
                 ref={fileInputRef}
                 type="file"
                 accept="image/*"
                 onChange={handleFileUpload}
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
                 上传自定义头像
               </Button>
             </div>
             <p className="text-xs text-muted-foreground text-center">
               图片将自动压缩至 200x200，支持 JPG、PNG
             </p>
           </div>
           
           <div className="w-full">
             <p className="text-sm font-medium text-center mb-2">或选择预设头像</p>
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
