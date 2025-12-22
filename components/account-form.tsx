'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Trash2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteAccount, createChildAccount } from "@/app/actions/account";
import { useRouter } from "next/navigation";

const PRESET_ICONS = [
  "https://api.dicebear.com/7.x/icons/svg?seed=bank",
  "https://api.dicebear.com/7.x/icons/svg?seed=cash",
  "https://api.dicebear.com/7.x/icons/svg?seed=wallet",
  "https://api.dicebear.com/7.x/icons/svg?seed=card",
  "https://api.dicebear.com/7.x/icons/svg?seed=piggy",
  "https://api.dicebear.com/7.x/icons/svg?seed=safe",
  "https://api.dicebear.com/7.x/icons/svg?seed=chart",
  "https://api.dicebear.com/7.x/icons/svg?seed=money",
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "保存中..." : "保存"}
    </Button>
  );
}

interface AccountFormProps {
  action: (formData: FormData) => Promise<void>;
  parentAccounts?: { id: string; name: string }[];
  users?: { id: string; name: string | null; email: string }[];
  defaultValues?: {
    id: string;
    name: string;
    type: string;
    balance: number;
    currency: string;
    parentId: string | null;
    userId: string;
    icon?: string | null;
    children?: {
      id: string;
      name: string;
      type: string;
      balance: number;
      currency: string;
    }[];
  };
}

export function AccountForm({ action, parentAccounts = [], users = [], defaultValues }: AccountFormProps) {
  const [selectedIcon, setSelectedIcon] = useState(defaultValues?.icon || PRESET_ICONS[0]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const [isAddChildDialogOpen, setIsAddChildDialogOpen] = useState(false);
  const [isAddingChild, setIsAddingChild] = useState(false);

  const handleAddChild = async (formData: FormData) => {
    setIsAddingChild(true);
    try {
      if (defaultValues?.id) {
        formData.append('parentId', defaultValues.id);
        formData.append('icon', selectedIcon); // Use parent's icon by default or let user choose? For now, inherit or simple.
        // Actually createChildAccount expects icon. Let's just use a default or the parent's.
        // The form below will have inputs.
        await createChildAccount(formData);
        setIsAddChildDialogOpen(false);
        router.refresh();
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "创建子账户失败");
    } finally {
      setIsAddingChild(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmation !== defaultValues?.name) return;
    
    setIsDeleting(true);
    setDeleteError("");
    
    try {
      if (defaultValues?.id) {
        await deleteAccount(defaultValues.id);
      }
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "删除失败");
      setIsDeleting(false);
    }
  };

  const handleDeleteChild = async (childId: string) => {
    if (!confirm("确定要删除这个子账户吗？此操作不可撤销。")) return;
    
    try {
      await deleteAccount(childId, true);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "删除失败");
    }
  };

  return (
    <>
      <form action={action} className="space-y-4">
        {users.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="userId">归属人</Label>
            <select 
              name="userId" 
              id="userId" 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              defaultValue={defaultValues?.userId}
            >
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-2">
        <Label>账户图标</Label>
        <input type="hidden" name="icon" value={selectedIcon} />
        <div className="flex flex-wrap gap-2">
            {PRESET_ICONS.map((icon, index) => (
                <div 
                    key={index}
                    className={`cursor-pointer rounded-full p-1 border-2 transition-all ${selectedIcon === icon ? 'border-primary' : 'border-transparent hover:border-muted'}`}
                    onClick={() => setSelectedIcon(icon)}
                >
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={icon} alt="账户图标" />
                        <AvatarFallback>icon</AvatarFallback>
                    </Avatar>
                </div>
            ))}
        </div>
      </div>



      <div className="space-y-2">
        <Label htmlFor="name">账户名称</Label>
        <Input 
          id="name" 
          name="name" 
          placeholder="例如：招商银行储蓄卡" 
          required 
          defaultValue={defaultValues?.name}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">账户类型</Label>
        <select 
          name="type" 
          id="type" 
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          required
          defaultValue={defaultValues?.type || "INVESTMENT"}
        >
          <option value="INVESTMENT">投资</option>
          <option value="SAVINGS">存储</option>
          <option value="CASH">现金</option>
          <option value="DEBT">负债</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="balance">初始余额</Label>
        <Input 
          type="number" 
          id="balance" 
          name="balance" 
          placeholder="0.00" 
          step="0.01" 
          defaultValue={defaultValues?.balance || 0}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency">币种</Label>
        <select 
          name="currency" 
          id="currency" 
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          defaultValue={defaultValues?.currency || "CNY"}
        >
          <option value="CNY">人民币 (CNY)</option>
          <option value="USD">美元 (USD)</option>
          <option value="HKD">港币 (HKD)</option>
          <option value="JPY">日元 (JPY)</option>
          <option value="EUR">欧元 (EUR)</option>
        </select>
      </div>

      {defaultValues?.id && (
        <div className="mt-8 space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">子账户管理</h3>
            <Dialog open={isAddChildDialogOpen} onOpenChange={setIsAddChildDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  添加子账户
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>添加子账户</DialogTitle>
                  <DialogDescription>
                    在 {defaultValues.name} 下创建一个新的子账户
                  </DialogDescription>
                </DialogHeader>
                <form action={handleAddChild} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="child_name">账户名称</Label>
                    <Input 
                      id="child_name" 
                      name="name" 
                      placeholder="例如：朝朝宝" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="child_type">账户类型</Label>
                    <select 
                      name="type" 
                      id="child_type" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      required
                      defaultValue="INVESTMENT"
                    >
                      <option value="INVESTMENT">投资</option>
                      <option value="SAVINGS">存储</option>
                      <option value="CASH">现金</option>
                      <option value="DEBT">负债</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="child_balance">初始余额</Label>
                    <Input 
                      type="number" 
                      id="child_balance" 
                      name="balance" 
                      placeholder="0.00" 
                      step="0.01" 
                      defaultValue={0}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="child_currency">币种</Label>
                    <select 
                      name="currency" 
                      id="child_currency" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      defaultValue="CNY"
                    >
                      <option value="CNY">人民币 (CNY)</option>
                      <option value="USD">美元 (USD)</option>
                      <option value="HKD">港币 (HKD)</option>
                      <option value="JPY">日元 (JPY)</option>
                      <option value="EUR">欧元 (EUR)</option>
                    </select>
                  </div>
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAddChildDialogOpen(false)}
                      disabled={isAddingChild}
                    >
                      取消
                    </Button>
                    <Button type="submit" disabled={isAddingChild}>
                      {isAddingChild ? "添加中..." : "确认添加"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          {defaultValues.children && defaultValues.children.length > 0 ? (
            <div className="grid gap-4">
              {defaultValues.children.map((child) => (
                <div key={child.id} className="p-4 border rounded-lg bg-muted/50 space-y-3 relative group">
                  <div className="flex items-center justify-between">
                     <h4 className="font-medium text-sm">子账户: {child.name}</h4>
                     <Button 
                       type="button" 
                       variant="ghost" 
                       size="icon" 
                       className="h-8 w-8 text-muted-foreground hover:text-destructive"
                       onClick={() => handleDeleteChild(child.id)}
                     >
                       <Trash2 className="h-4 w-4" />
                     </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`child_${child.id}_name`}>名称</Label>
                      <Input 
                        id={`child_${child.id}_name`}
                        name={`child_${child.id}_name`}
                        defaultValue={child.name}
                        placeholder="子账户名称"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`child_${child.id}_type`}>类型</Label>
                      <select 
                        name={`child_${child.id}_type`}
                        id={`child_${child.id}_type`}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        defaultValue={child.type}
                      >
                        <option value="INVESTMENT">投资</option>
                        <option value="SAVINGS">存储</option>
                        <option value="CASH">现金</option>
                        <option value="DEBT">负债</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`child_${child.id}_balance`}>余额</Label>
                      <Input 
                        type="number"
                        id={`child_${child.id}_balance`}
                        name={`child_${child.id}_balance`}
                        defaultValue={child.balance}
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
              暂无子账户
            </div>
          )}
        </div>
      )}

        <div className="flex gap-4 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            className="w-full"
            onClick={() => {
               router.push('/wealth?tab=accounts');
               router.refresh();
             }}
          >
            取消
          </Button>
          <SubmitButton />
        </div>
      </form>

      {defaultValues?.id && (
        <div className="mt-8 pt-8 border-t">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-destructive">删除账户</h3>
              <p className="text-sm text-muted-foreground">
                删除账户是不可逆的操作，请谨慎操作。
              </p>
            </div>
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">删除账户</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>确认删除账户？</DialogTitle>
                  <DialogDescription>
                    此操作无法撤销。如果账户下有交易记录或子账户，将无法删除。
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>请输入账户名称 "{defaultValues.name}" 以确认</Label>
                    <Input 
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder={defaultValues.name}
                    />
                  </div>
                  
                  {deleteError && (
                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                      {deleteError}
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDeleteDialogOpen(false)}
                    disabled={isDeleting}
                  >
                    取消
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleDelete}
                    disabled={deleteConfirmation !== defaultValues.name || isDeleting}
                  >
                    {isDeleting ? "删除中..." : "确认删除"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}
    </>
  );
}
