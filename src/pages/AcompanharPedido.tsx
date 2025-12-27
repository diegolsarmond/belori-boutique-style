import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck,
  CreditCard,
  RefreshCw
} from "lucide-react";

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending: {
    label: "Aguardando Pagamento",
    icon: <Clock className="w-5 h-5" />,
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  },
  paid: {
    label: "Pagamento Confirmado",
    icon: <CreditCard className="w-5 h-5" />,
    color: "bg-green-500/10 text-green-600 border-green-500/20",
  },
  processing: {
    label: "Em Preparação",
    icon: <Package className="w-5 h-5" />,
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  shipped: {
    label: "Enviado",
    icon: <Truck className="w-5 h-5" />,
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  },
  delivered: {
    label: "Entregue",
    icon: <CheckCircle className="w-5 h-5" />,
    color: "bg-green-500/10 text-green-600 border-green-500/20",
  },
  cancelled: {
    label: "Cancelado",
    icon: <XCircle className="w-5 h-5" />,
    color: "bg-destructive/10 text-destructive border-destructive/20",
  },
  refunded: {
    label: "Reembolsado",
    icon: <RefreshCw className="w-5 h-5" />,
    color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  },
};

export default function AcompanharPedido() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialOrderNumber = searchParams.get("order") || "";
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [searchedOrder, setSearchedOrder] = useState(initialOrderNumber);

  const { data: order, isLoading, error, refetch } = useQuery({
    queryKey: ["order-tracking", searchedOrder],
    queryFn: async () => {
      if (!searchedOrder) return null;
      
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (*)
        `)
        .eq("order_number", searchedOrder)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!searchedOrder,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderNumber.trim()) {
      setSearchedOrder(orderNumber.trim().toUpperCase());
      setSearchParams({ order: orderNumber.trim().toUpperCase() });
    }
  };

  const status = order?.status ? statusConfig[order.status] : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Package className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h1 className="text-3xl font-bold mb-2">Acompanhar Pedido</h1>
            <p className="text-muted-foreground">
              Digite o número do seu pedido para ver o status
            </p>
          </div>

          {/* Search Form */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                  placeholder="Ex: BEL-123456"
                  className="flex-1 font-mono"
                />
                <Button type="submit" disabled={!orderNumber.trim() || isLoading}>
                  <Search className="w-4 h-4 mr-2" />
                  Buscar
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Loading State */}
          {isLoading && (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-muted-foreground">Buscando pedido...</p>
              </CardContent>
            </Card>
          )}

          {/* Not Found */}
          {searchedOrder && !isLoading && !order && (
            <Card>
              <CardContent className="py-12 text-center">
                <XCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Pedido não encontrado</h3>
                <p className="text-muted-foreground">
                  Verifique o número do pedido e tente novamente
                </p>
              </CardContent>
            </Card>
          )}

          {/* Order Details */}
          {order && (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="font-mono text-xl">{order.order_number}</CardTitle>
                    <CardDescription>
                      Pedido realizado em {new Date(order.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </CardDescription>
                  </div>
                  {status && (
                    <Badge variant="outline" className={`${status.color} flex items-center gap-1`}>
                      {status.icon}
                      {status.label}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Customer Info */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-medium">{order.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{order.customer_email}</p>
                  </div>
                  {order.shipping_address && (
                    <div className="sm:col-span-2">
                      <p className="text-sm text-muted-foreground">Endereço de entrega</p>
                      <p className="font-medium">{order.shipping_address}</p>
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="font-semibold mb-3">Itens do pedido</h4>
                  <div className="space-y-3">
                    {order.order_items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium">{item.product_title}</p>
                          {item.variant_title && (
                            <p className="text-sm text-muted-foreground">{item.variant_title}</p>
                          )}
                          <p className="text-sm text-muted-foreground">Qtd: {item.quantity}</p>
                        </div>
                        <p className="font-semibold">
                          {(item.price * item.quantity).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    {Number(order.total_amount).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </span>
                </div>

                {/* Notes */}
                {order.notes && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">{order.notes}</p>
                  </div>
                )}

                {/* Refresh Button */}
                <div className="text-center pt-4">
                  <Button variant="outline" onClick={() => refetch()}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar Status
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
