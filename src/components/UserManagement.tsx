import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, Users } from 'lucide-react';

type AppRole = 'admin' | 'owner' | 'employee';

interface AuthorizedEmail {
  id: string;
  email: string;
  role: AppRole;
  created_at: string;
}

export const UserManagement = () => {
  const [emails, setEmails] = useState<AuthorizedEmail[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<AppRole>('employee');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchEmails = async () => {
    const { data, error } = await supabase
      .from('authorized_emails')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching emails:', error);
      return;
    }

    setEmails(data as AuthorizedEmail[]);
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const addEmail = async () => {
    if (!newEmail.trim()) {
      toast({
        title: 'エラー',
        description: 'メールアドレスを入力してください',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase
      .from('authorized_emails')
      .insert({ email: newEmail.trim().toLowerCase(), role: newRole });

    setIsLoading(false);

    if (error) {
      if (error.code === '23505') {
        toast({
          title: 'エラー',
          description: 'このメールアドレスは既に登録されています',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'エラー',
          description: 'メールアドレスの追加に失敗しました',
          variant: 'destructive',
        });
      }
      return;
    }

    toast({
      title: '成功',
      description: 'メールアドレスを追加しました',
    });

    setNewEmail('');
    fetchEmails();
  };

  const removeEmail = async (id: string) => {
    const { error } = await supabase
      .from('authorized_emails')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'エラー',
        description: '削除に失敗しました',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: '成功',
      description: 'メールアドレスを削除しました',
    });

    fetchEmails();
  };

  const getRoleLabel = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return '管理者';
      case 'owner':
        return 'オーナー';
      case 'employee':
        return '従業員';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          ユーザー管理
        </CardTitle>
        <CardDescription>
          アクセスを許可するメールアドレスを管理します
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="メールアドレスを入力"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="flex-1"
          />
          <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="employee">従業員</SelectItem>
              <SelectItem value="owner">オーナー</SelectItem>
              <SelectItem value="admin">管理者</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={addEmail} disabled={isLoading}>
            <Plus className="w-4 h-4 mr-1" />
            追加
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>メールアドレス</TableHead>
              <TableHead>権限</TableHead>
              <TableHead className="w-20">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {emails.map((email) => (
              <TableRow key={email.id}>
                <TableCell>{email.email}</TableCell>
                <TableCell>{getRoleLabel(email.role)}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEmail(email.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {emails.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  許可されたメールアドレスはありません
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
