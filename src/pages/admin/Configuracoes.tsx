import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, ShoppingBag, Eye, EyeOff } from "lucide-react";

export default function Configuracoes() {
  const queryClient = useQueryClient();
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [showStorefrontToken, setShowStorefrontToken] = useState(false);
  
  const [formData, setFormData] = useState({
    footer_email: "",
    footer_phone: "",
    footer_address: "",
    footer_whatsapp: "",
  });

  const [shopifyData, setShopifyData] = useState({
    shopify_domain: "",
    shopify_access_token: "",
    shopify_storefront_token: "",
  });

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
          "shopify_domain",
          "shopify_access_token",
          "shopify_storefront_token",
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
      setShopifyData({
        shopify_domain: settingsMap["shopify_domain"] || "",
        shopify_access_token: settingsMap["shopify_access_token"] || "",
        shopify_storefront_token: settingsMap["shopify_storefront_token"] || "",
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
      toast.success("Configurações de contato atualizadas com sucesso!");
    },
    onError: () => toast.error("Erro ao atualizar configurações de contato"),
  });

  const updateShopifyMutation = useMutation({
    mutationFn: async (data: typeof shopifyData) => {
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
      toast.success("Configurações do Shopify atualizadas com sucesso!");
    },
    onError: () => toast.error("Erro ao atualizar configurações do Shopify"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleShopifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateShopifyMutation.mutate(shopifyData);
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
            Gerencie as configurações do site
          </p>
        </div>

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

        <form onSubmit={handleShopifySubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Integração Shopify
              </CardTitle>
              <CardDescription>
                Configure as credenciais de integração com a loja Shopify
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="shopify_domain">Domínio da Loja</Label>
                <Input
                  id="shopify_domain"
                  value={shopifyData.shopify_domain}
                  onChange={(e) =>
                    setShopifyData({ ...shopifyData, shopify_domain: e.target.value })
                  }
                  placeholder="sua-loja.myshopify.com"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ex: minha-loja.myshopify.com
                </p>
              </div>
              <div>
                <Label htmlFor="shopify_access_token">Access Token (Admin API)</Label>
                <div className="relative">
                  <Input
                    id="shopify_access_token"
                    type={showAccessToken ? "text" : "password"}
                    value={shopifyData.shopify_access_token}
                    onChange={(e) =>
                      setShopifyData({ ...shopifyData, shopify_access_token: e.target.value })
                    }
                    placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowAccessToken(!showAccessToken)}
                  >
                    {showAccessToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Token de acesso da API Admin do Shopify
                </p>
              </div>
              <div>
                <Label htmlFor="shopify_storefront_token">Storefront Access Token</Label>
                <div className="relative">
                  <Input
                    id="shopify_storefront_token"
                    type={showStorefrontToken ? "text" : "password"}
                    value={shopifyData.shopify_storefront_token}
                    onChange={(e) =>
                      setShopifyData({ ...shopifyData, shopify_storefront_token: e.target.value })
                    }
                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowStorefrontToken(!showStorefrontToken)}
                  >
                    {showStorefrontToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Token de acesso da API Storefront do Shopify
                </p>
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={updateShopifyMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {updateShopifyMutation.isPending ? "Salvando..." : "Salvar Configurações Shopify"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </AdminLayout>
  );
}
