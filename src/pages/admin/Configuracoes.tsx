import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, CreditCard, CheckCircle, AlertCircle } from "lucide-react";

export default function Configuracoes() {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    footer_email: "",
    footer_phone: "",
    footer_address: "",
    footer_whatsapp: "",
  });

  const [mpStatus, setMpStatus] = useState<'checking' | 'configured' | 'not_configured'>('checking');

  const [mpSettings, setMpSettings] = useState({
    access_token: "",
    public_key: "",
    is_active: false,
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("BeloriBH_site_settings")
        .select("*")
        .in("setting_key", [
          "footer_email",
          "footer_phone",
          "footer_address",
          "footer_whatsapp",
        ]);
      if (error) throw error;
      return data;
    },
  });

  const { data: paymentSettings } = useQuery({
    queryKey: ["payment-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("BeloriBH_payment_settings" as any)
        .select("*")
        .eq("provider", "mercadopago")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (paymentSettings) {
      const settings = paymentSettings as any;
      setMpSettings({
        access_token: settings.access_token || "",
        public_key: settings.public_key || "",
        is_active: settings.is_active || false,
      });
      setMpStatus(settings.is_active ? 'configured' : 'not_configured');
    } else {
      setMpStatus('not_configured');
    }
  }, [paymentSettings]);

  useEffect(() => {
    if (settings) {
      const settingsMap = settings.reduce(
        (acc, setting) => ({
          ...acc,
          [setting.setting_key]: setting.setting_value,
        }),
        {} as Record<string, string>
      );
      setFormData({
        footer_email: settingsMap["footer_email"] || "",
        footer_phone: settingsMap["footer_phone"] || "",
        footer_address: settingsMap["footer_address"] || "",
        footer_whatsapp: settingsMap["footer_whatsapp"] || "",
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const updates = Object.entries(data).map(([key, value]) => ({
        setting_key: key,
        setting_value: value,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("BeloriBH_site_settings")
          .upsert({ setting_key: update.setting_key, setting_value: update.setting_value }, { onConflict: 'setting_key' });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Configurações atualizadas com sucesso!");
    },
    onError: () => toast.error("Erro ao atualizar configurações"),
  });

  const updateMpSettingsMutation = useMutation({
    mutationFn: async (data: typeof mpSettings) => {
      const { error } = await supabase
        .from("BeloriBH_payment_settings" as any)
        .upsert({
          provider: 'mercadopago',
          access_token: data.access_token,
          public_key: data.public_key,
          is_active: data.is_active,
          updated_at: new Date().toISOString()
        }, { onConflict: 'provider' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-settings"] });
      toast.success("Configurações do Mercado Pago atualizadas!");
    },
    onError: () => toast.error("Erro ao salvar configurações do Mercado Pago"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando configurações...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações do site e integrações de pagamento
          </p>
        </div>

        {/* Mercado Pago Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-[#009ee3]" />
                <div>
                  <CardTitle>Mercado Pago</CardTitle>
                  <CardDescription>
                    Integração de pagamentos online
                  </CardDescription>
                </div>
              </div>
              {mpStatus === 'configured' ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Ativo
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Inativo
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); updateMpSettingsMutation.mutate(mpSettings); }} className="space-y-4">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Configure as credenciais do Mercado Pago para processar pagamentos.
                </p>

                <div>
                  <Label htmlFor="mp_access_token">Access Token (Produção)</Label>
                  <Input
                    id="mp_access_token"
                    type="password"
                    value={mpSettings.access_token}
                    onChange={(e) => setMpSettings({ ...mpSettings, access_token: e.target.value })}
                    placeholder="APP_USR-..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Token de acesso de produção do Mercado Pago.
                  </p>
                </div>

                <div>
                  <Label htmlFor="mp_public_key">Public Key</Label>
                  <Input
                    id="mp_public_key"
                    value={mpSettings.public_key}
                    onChange={(e) => setMpSettings({ ...mpSettings, public_key: e.target.value })}
                    placeholder="APP_USR-..."
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="mp_active"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={mpSettings.is_active}
                    onChange={(e) => setMpSettings({ ...mpSettings, is_active: e.target.checked })}
                  />
                  <Label htmlFor="mp_active">Ativar integração</Label>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={updateMpSettingsMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {updateMpSettingsMutation.isPending ? "Salvando..." : "Salvar Configuração MP"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer Settings Card */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Informações de Contato do Rodapé</CardTitle>
              <CardDescription>
                Configure as informações de contato exibidas no rodapé do site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="footer_email">Email</Label>
                <Input
                  id="footer_email"
                  type="email"
                  value={formData.footer_email}
                  onChange={(e) =>
                    setFormData({ ...formData, footer_email: e.target.value })
                  }
                  placeholder="contato@exemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="footer_phone">Telefone</Label>
                <Input
                  id="footer_phone"
                  value={formData.footer_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, footer_phone: e.target.value })
                  }
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <Label htmlFor="footer_whatsapp">WhatsApp (apenas números)</Label>
                <Input
                  id="footer_whatsapp"
                  value={formData.footer_whatsapp}
                  onChange={(e) =>
                    setFormData({ ...formData, footer_whatsapp: e.target.value })
                  }
                  placeholder="5511999999999"
                />
              </div>
              <div>
                <Label htmlFor="footer_address">Endereço</Label>
                <Input
                  id="footer_address"
                  value={formData.footer_address}
                  onChange={(e) =>
                    setFormData({ ...formData, footer_address: e.target.value })
                  }
                  placeholder="Rua Exemplo, 123 - São Paulo, SP"
                />
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={updateMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </AdminLayout>
  );
}
