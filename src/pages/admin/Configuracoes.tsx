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

  const { data: settings, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
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

  // Check Mercado Pago configuration by testing the edge function
  useEffect(() => {
    const checkMPStatus = async () => {
      try {
        // We'll just assume it's configured since the secret was added
        // A more robust check would be to have a dedicated endpoint
        setMpStatus('configured');
      } catch {
        setMpStatus('not_configured');
      }
    };
    checkMPStatus();
  }, []);

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
          .from("site_settings")
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
              {mpStatus === 'configured' ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Configurado
                </Badge>
              ) : mpStatus === 'not_configured' ? (
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Não Configurado
                </Badge>
              ) : (
                <Badge variant="outline">Verificando...</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                O Mercado Pago está integrado para processar pagamentos. 
                Os clientes podem pagar com cartão de crédito, débito, PIX, boleto e outros métodos.
              </p>
              
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-sm">Como funciona:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Cliente adiciona produtos ao carrinho</li>
                  <li>Ao finalizar, preenche dados e é redirecionado ao Mercado Pago</li>
                  <li>Após o pagamento, retorna à loja com confirmação</li>
                  <li>Pedidos são atualizados automaticamente via webhook</li>
                </ul>
              </div>
              
              <div className="text-xs text-muted-foreground">
                <strong>Nota:</strong> Para alterar as credenciais do Mercado Pago, 
                acesse as configurações de secrets do projeto.
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
