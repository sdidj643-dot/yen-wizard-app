import { Settings } from '@/types/inventory';
import { Calculator, RefreshCw } from 'lucide-react';
import { UserManagement } from './UserManagement';

type AppRole = 'admin' | 'owner' | 'employee';

interface SettingsPanelProps {
  settings: Settings;
  onUpdateSettings: (settings: Partial<Settings>) => void;
  onRecalculateAll: () => void;
  userRole?: AppRole | null;
}

export function SettingsPanel({
  settings,
  onUpdateSettings,
  onRecalculateAll,
  userRole,
}: SettingsPanelProps) {
  const handleChange = (key: keyof Settings, value: number) => {
    onUpdateSettings({ [key]: value });
  };

  // Example calculation
  const exampleCost = 100; // 100 CNY
  const baseCost = exampleCost * settings.exchangeRate;
  const totalCost = baseCost + settings.internationalShipping + settings.domesticShipping + settings.targetProfit;
  const sellingPrice = Math.ceil(totalCost / (1 - settings.platformFeeRate));
  const platformFee = Math.ceil(sellingPrice * settings.platformFeeRate);
  const actualProfit = sellingPrice - platformFee - baseCost - settings.internationalShipping - settings.domesticShipping;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">設定</h2>
        <p className="text-muted-foreground text-sm mt-1">
          価格計算に使用するパラメータを調整します。
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Settings Form */}
        <div className="card-elevated p-6 space-y-6">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            計算パラメータ
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                匯率 (1 CNY = ? JPY)
              </label>
              <input
                type="number"
                value={settings.exchangeRate}
                onChange={(e) => handleChange('exchangeRate', parseFloat(e.target.value) || 0)}
                step="0.1"
                min="0"
                className="input-field w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                人民幣から日圓への為替レート
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                國際運費 (JPY)
              </label>
              <input
                type="number"
                value={settings.internationalShipping}
                onChange={(e) => handleChange('internationalShipping', parseInt(e.target.value) || 0)}
                step="100"
                min="0"
                className="input-field w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                中国から日本への送料
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                日本國內運費 (JPY)
              </label>
              <input
                type="number"
                value={settings.domesticShipping}
                onChange={(e) => handleChange('domesticShipping', parseInt(e.target.value) || 0)}
                step="100"
                min="0"
                className="input-field w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                日本国内配送料
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                目標利潤 (JPY)
              </label>
              <input
                type="number"
                value={settings.targetProfit}
                onChange={(e) => handleChange('targetProfit', parseInt(e.target.value) || 0)}
                step="500"
                min="0"
                className="input-field w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                1商品あたりの目標純利益
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                手續費率 (%)
              </label>
              <input
                type="number"
                value={settings.platformFeeRate * 100}
                onChange={(e) => handleChange('platformFeeRate', (parseFloat(e.target.value) || 0) / 100)}
                step="0.1"
                min="0"
                max="100"
                className="input-field w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                メルカリのプラットフォーム手数料（通常22%）
              </p>
            </div>
          </div>

          <button
            onClick={onRecalculateAll}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            全商品の価格を再計算
          </button>
        </div>

        {/* Calculation Example */}
        <div className="card-elevated p-6 space-y-6">
          <h3 className="font-semibold text-lg">計算例 (原価 {exampleCost} CNY)</h3>

          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">原価（日圓換算）</span>
              <span className="font-medium">{exampleCost} × {settings.exchangeRate} = ¥{baseCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">+ 國際運費</span>
              <span className="font-medium">¥{settings.internationalShipping.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">+ 國內運費</span>
              <span className="font-medium">¥{settings.domesticShipping.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">+ 目標利潤</span>
              <span className="font-medium">¥{settings.targetProfit.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">小計</span>
              <span className="font-medium">¥{totalCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">÷ (1 - {(settings.platformFeeRate * 100).toFixed(0)}%)</span>
              <span className="text-xs text-muted-foreground">手数料込みで計算</span>
            </div>
            <div className="flex justify-between py-3 bg-primary/10 rounded-lg px-3">
              <span className="font-semibold text-primary">販賣價格</span>
              <span className="font-bold text-primary text-lg">¥{sellingPrice.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-sm">内訳確認</h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">販売価格</span>
                <span>¥{sellingPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">- プラットフォーム手数料</span>
                <span>-¥{platformFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">- 原価（日圓）</span>
                <span>-¥{baseCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">- 國際運費</span>
                <span>-¥{settings.internationalShipping.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">- 國內運費</span>
                <span>-¥{settings.domesticShipping.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border font-semibold profit-positive">
                <span>= 実際利潤</span>
                <span>¥{actualProfit.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Management - only for admin/owner */}
      {(userRole === 'admin' || userRole === 'owner') && (
        <UserManagement />
      )}
    </div>
  );
}
