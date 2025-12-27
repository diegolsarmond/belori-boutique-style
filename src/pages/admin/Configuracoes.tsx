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
import { Save, CreditCard, CheckCircle } from "lucide-react";

export default function Configuracoes() {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    footer_email: "",
    footer_phone: "",
    footer_address: "",
    footer_whatsapp: "",
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
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                <CheckCircle className="w-3 h-3 mr-1" />
                Configurado via .env
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-2">
                  ✓ Credenciais configuradas via variáveis de ambiente
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  As credenciais do Mercado Pago estão sendo lidas do arquivo <code className="bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded">.env</code>:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-blue-600 dark:text-blue-400">
                  <li>• <code className="bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded">MERCADO_PAGO_PUBLIC_KEY</code></li>
                  <li>• <code className="bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded">MERCADO_PAGO_ACCESS_TOKEN</code></li>
                </ul>
              </div>

              <div className="grid gap-3">
                <div>
                  <Label className="text-muted-foreground">Public Key</Label>
                  <div className="mt-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
                    {import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY ?
                      `${import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY.substring(0, 20)}...` :
                      'Não configurado'
                    }
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Access Token</Label>
                  <div className="mt-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
                    ••••••••••••••••••••
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Token ocultado por segurança
                  </p>
                </div>
              </div>
            </div>
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
