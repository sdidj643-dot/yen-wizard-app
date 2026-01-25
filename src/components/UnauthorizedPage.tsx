import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldX, LogOut } from 'lucide-react';

interface UnauthorizedPageProps {
  email?: string;
  onSignOut: () => Promise<void>;
}

export const UnauthorizedPage = ({ email, onSignOut }: UnauthorizedPageProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <ShieldX className="w-16 h-16 text-destructive" />
          </div>
          <CardTitle className="text-2xl">アクセス権限がありません</CardTitle>
          <CardDescription>
            このアカウントはシステムへのアクセスが許可されていません
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {email && (
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">ログイン中のアカウント</p>
              <p className="font-medium">{email}</p>
            </div>
          )}
          <p className="text-sm text-muted-foreground text-center">
            管理者にアクセス権限の付与を依頼してください
          </p>
          <Button
            onClick={onSignOut}
            variant="outline"
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            別のアカウントでログイン
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
