import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  RefreshCw,
  Mail,
  Hash,
  ExternalLink,
  Copy,
  Check
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

// Status order for timeline
const statusOrder = ["pending", "paid", "processing", "shipped", "delivered"];

interface OrderData {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  status: string;
  total_amount: number;
  created_at: string;
  tracking_code?: string;
  tracking_url?: string;
  shipped_at?: string;
  delivered_at?: string;
}

interface OrderItem {
  id: string;
  product_title: string;
  variant_title?: string;
  quantity: number;
  price: number;
}

export default function AcompanharPedido() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialOrderNumber = searchParams.get("order") || "";
  const initialEmail = searchParams.get("email") || "";

  const [searchType, setSearchType] = useState<"order" | "email">(initialEmail ? "email" : "order");
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [email, setEmail] = useState(initialEmail);
  const [searchedValue, setSearchedValue] = useState(initialOrderNumber || initialEmail);
  const [searchedType, setSearchedType] = useState<"order" | "email">(initialEmail ? "email" : "order");
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Query for order by number using RPC
  const { data: orderByNumber, isLoading: isLoadingByNumber, error: errorByNumber } = useQuery({
    queryKey: ["order-tracking-number", searchedValue],
    queryFn: async () => {
      if (!searchedValue || searchedType !== "order") return null;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .rpc("track_order_by_number", { p_order_number: searchedValue });

      if (error) throw error;
      return data && Array.isArray(data) && data.length > 0 ? data[0] as OrderData : null;
    },
    enabled: !!searchedValue && searchedType === "order",
  });

  // Query for orders by email using RPC
  const { data: ordersByEmail, isLoading: isLoadingByEmail, error: errorByEmail } = useQuery({
    queryKey: ["order-tracking-email", searchedValue],
    queryFn: async () => {
      if (!searchedValue || searchedType !== "email") return null;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .rpc("track_orders_by_email", { p_email: searchedValue.toLowerCase() });

      if (error) throw error;
      return (data || []) as OrderData[];
    },
    enabled: !!searchedValue && searchedType === "email",
  });

  // Query for order items using RPC
  const { data: orderItems } = useQuery({
    queryKey: ["order-items-public", selectedOrderId],
    queryFn: async () => {
      if (!selectedOrderId) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .rpc("get_order_items_public", { p_order_id: selectedOrderId });

      if (error) throw error;
      return (data || []) as OrderItem[];
    },
    enabled: !!selectedOrderId,
  });

  const isLoading = isLoadingByNumber || isLoadingByEmail;
  const hasError = errorByNumber || errorByEmail;
  const order = searchedType === "order" ? orderByNumber : null;
  const orders = searchedType === "email" ? ordersByEmail : null;

  // Set selected order for items when order changes
  if (order && order.id !== selectedOrderId) {
    setSelectedOrderId(order.id);
  } else if (orders && orders.length > 0 && !selectedOrderId) {
    setSelectedOrderId(orders[0].id);
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const value = searchType === "order" ? orderNumber.trim().toUpperCase() : email.trim().toLowerCase();
    if (value) {
      setSearchedValue(value);
      setSearchedType(searchType);
      setSelectedOrderId(null);
      if (searchType === "order") {
        setSearchParams({ order: value });
      } else {
        setSearchParams({ email: value });
      }
    }
  };

  const handleCopyTracking = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const getStatusIndex = (status: string) => {
    return statusOrder.indexOf(status);
  };

  const renderOrderDetails = (orderData: OrderData) => {
    const status = orderData?.status ? statusConfig[orderData.status] : null;
    const currentOrderItems = orderData?.id === selectedOrderId ? orderItems : [];

    return (
      <Card key={orderData.id} className={orders && orders.length > 1 ? "cursor-pointer hover:border-primary/50 transition-colors" : ""}>
        <CardHeader onClick={() => orders && orders.length > 1 && setSelectedOrderId(orderData.id)}>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="font-mono text-xl">{orderData.order_number}</CardTitle>
              <CardDescription>
                Pedido realizado em {new Date(orderData.created_at).toLocaleDateString('pt-BR', {
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
          {/* Status Timeline */}
          {!["cancelled", "refunded"].includes(orderData.status) && (
            <div className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg p-4">
              <h4 className="font-semibold mb-4 flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                Progresso do Pedido
              </h4>
              <div className="flex items-center justify-between relative">
                <div className="absolute top-3 left-0 right-0 h-1 bg-muted rounded-full">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-500"
                    style={{
                      width: `${(getStatusIndex(orderData.status) / (statusOrder.length - 1)) * 100}%`
                    }}
                  />
                </div>

                {statusOrder.map((statusKey, index) => {
                  const config = statusConfig[statusKey];
                  const isActive = getStatusIndex(orderData.status) >= index;
                  const isCurrent = orderData.status === statusKey;

                  return (
                    <div key={statusKey} className="flex flex-col items-center z-10">
                      <div className={`
                        w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300
                        ${isActive
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                          : 'bg-muted text-muted-foreground'
                        }
                        ${isCurrent ? 'ring-2 ring-primary/20 scale-110' : ''}
                      `}>
                        <span className="scale-75 sm:scale-100">{config?.icon}</span>
                      </div>
                      <span className={`
                        text-[10px] sm:text-xs mt-2 text-center max-w-[60px] sm:max-w-[80px] hidden sm:block
                        ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}
                      `}>
                        {config?.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tracking Info */}
          {orderData.tracking_code && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-purple-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-purple-800">Código de Rastreio</h4>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <code className="bg-white px-3 py-1.5 rounded border font-mono text-sm">
                      {orderData.tracking_code}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyTracking(orderData.tracking_code!)}
                    >
                      {copiedTracking ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    {orderData.tracking_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={orderData.tracking_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Rastrear
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Customer Info */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="font-medium">{orderData.customer_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{orderData.customer_email}</p>
            </div>
          </div>

          {/* Order Items */}
          {currentOrderItems && currentOrderItems.length > 0 && selectedOrderId === orderData.id && (
            <div>
              <h4 className="font-semibold mb-3">Itens do pedido</h4>
              <div className="space-y-3">
                {currentOrderItems.map((item) => (
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
          )}

          {/* Total */}
          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-2xl font-bold text-primary">
              {Number(orderData.total_amount).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Package className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h1 className="text-3xl font-bold mb-2">Acompanhar Pedido</h1>
            <p className="text-muted-foreground">
              Digite o número do pedido ou seu email para ver o status
            </p>
          </div>

          {/* Search Form with Tabs */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <Tabs value={searchType} onValueChange={(v) => setSearchType(v as "order" | "email")}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="order" className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Número do Pedido
                  </TabsTrigger>
                  <TabsTrigger value="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="order">
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
                </TabsContent>

                <TabsContent value="email">
                  <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="flex-1"
                    />
                    <Button type="submit" disabled={!email.trim() || isLoading}>
                      <Search className="w-4 h-4 mr-2" />
                      Buscar
                    </Button>
                  </form>
                  <p className="text-xs text-muted-foreground mt-2">
                    Serão exibidos todos os pedidos associados ao seu email
                  </p>
                </TabsContent>
              </Tabs>
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

          {/* Error State */}
          {hasError && !isLoading && (
            <Card>
              <CardContent className="py-12 text-center">
                <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Erro ao buscar pedido</h3>
                <p className="text-muted-foreground">
                  Ocorreu um erro ao buscar o pedido. Tente novamente.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Not Found */}
          {searchedValue && !isLoading && !hasError && !order && (!orders || orders.length === 0) && (
            <Card>
              <CardContent className="py-12 text-center">
                <XCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchedType === "order" ? "Pedido não encontrado" : "Nenhum pedido encontrado"}
                </h3>
                <p className="text-muted-foreground">
                  {searchedType === "order"
                    ? "Verifique o número do pedido e tente novamente"
                    : "Não encontramos pedidos para este email"
                  }
                </p>
              </CardContent>
            </Card>
          )}

          {/* Single Order Details (search by number) */}
          {order && renderOrderDetails(order)}

          {/* Multiple Orders (search by email) */}
          {orders && orders.length > 0 && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-muted-foreground">
                  Encontramos <strong>{orders.length}</strong> pedido{orders.length > 1 ? 's' : ''} para este email
                </p>
              </div>
              {orders.map((orderData) => renderOrderDetails(orderData))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
