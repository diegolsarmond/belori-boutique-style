import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Search,
  Eye,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  CreditCard,
  RefreshCw,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  ShoppingBag,
  Save,
  Copy,
  Check,
  Ban,
  Send,
  Undo2,
  History,
  ExternalLink,
  AlertTriangle,
  DollarSign,
  PackageCheck,
  MoreVertical,
  Settings
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

// Tipos
interface OrderItem {
  id: string;
  product_title: string;
  variant_title?: string;
  quantity: number;
  price: number;
  product_image?: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address?: string;
  status: string;
  total_amount: number;
  subtotal?: number;
  shipping_cost?: number;
  discount?: number;
  payment_method?: string;
  payment_status?: string;
  notes?: string;
  tracking_code?: string;
  tracking_url?: string;
  shipped_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at?: string;
}

// Status Configuration
const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  pending: {
    label: "Aguardando Pagamento",
    icon: <Clock className="w-4 h-4" />,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  paid: {
    label: "Pagamento Confirmado",
    icon: <CreditCard className="w-4 h-4" />,
    color: "text-green-600",
    bgColor: "bg-green-100 text-green-800 border-green-200",
  },
  processing: {
    label: "Em Preparação",
    icon: <Package className="w-4 h-4" />,
    color: "text-blue-600",
    bgColor: "bg-blue-100 text-blue-800 border-blue-200",
  },
  shipped: {
    label: "Enviado",
    icon: <Truck className="w-4 h-4" />,
    color: "text-purple-600",
    bgColor: "bg-purple-100 text-purple-800 border-purple-200",
  },
  delivered: {
    label: "Entregue",
    icon: <CheckCircle className="w-4 h-4" />,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  cancelled: {
    label: "Cancelado",
    icon: <XCircle className="w-4 h-4" />,
    color: "text-red-600",
    bgColor: "bg-red-100 text-red-800 border-red-200",
  },
  refunded: {
    label: "Reembolsado",
    icon: <RefreshCw className="w-4 h-4" />,
    color: "text-orange-600",
    bgColor: "bg-orange-100 text-orange-800 border-orange-200",
  },
  completed: {
    label: "Concluído",
    icon: <CheckCircle className="w-4 h-4" />,
    color: "text-green-600",
    bgColor: "bg-green-100 text-green-800 border-green-200",
  },
};

// Status order for timeline
const statusOrder = ["pending", "paid", "processing", "shipped", "delivered"];

// Transportadoras comuns no Brasil
const carriers = [
  { value: "correios", label: "Correios", urlPattern: "https://www.linkcorreios.com.br/?id=" },
  { value: "jadlog", label: "JadLog", urlPattern: "https://www.jadlog.com.br/siteInstitucional/tracking.jad?cte=" },
  { value: "loggi", label: "Loggi", urlPattern: "https://www.loggi.com/rastreamento/" },
  { value: "azulcargo", label: "Azul Cargo", urlPattern: "https://azulcargo.com.br/rastreio/" },
  { value: "totalexpress", label: "Total Express", urlPattern: "https://tracking.totalexpress.com.br/?codigo=" },
  { value: "outro", label: "Outra Transportadora", urlPattern: "" },
];

export default function Pedidos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isShippingDialogOpen, setIsShippingDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);

  // Form states
  const [newStatus, setNewStatus] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [trackingCarrier, setTrackingCarrier] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [copiedTracking, setCopiedTracking] = useState(false);

  const queryClient = useQueryClient();

  // Fetch orders
  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data } = await supabase
        .from('BeloriBH_orders')
        .select('*')
        .order('created_at', { ascending: false });
      return (data || []) as Order[];
    }
  });

  // Fetch order items when viewing an order
  const { data: orderItems } = useQuery({
    queryKey: ['order-items', selectedOrder?.id],
    queryFn: async () => {
      if (!selectedOrder?.id) return [];
      const { data } = await supabase
        .from('BeloriBH_order_items')
        .select('*')
        .eq('order_id', selectedOrder.id);
      return (data || []) as OrderItem[];
    },
    enabled: !!selectedOrder?.id
  });

  // Update order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async (updateData: Partial<Order> & { id: string }) => {
      const { id, ...data } = updateData;
      const { error } = await supabase
        .from('BeloriBH_orders')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: () => {
      toast.error("Erro ao atualizar pedido");
    }
  });

  const filteredOrders = orders?.filter((order) =>
    order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setOrderNotes(order.notes || "");
    setTrackingCode(order.tracking_code || "");
    setTrackingUrl(order.tracking_url || "");
    setIsDialogOpen(true);
  };

  // Abrir dialog de envio direto da listagem
  const handleOpenShippingFromList = (order: Order) => {
    setSelectedOrder(order);
    setTrackingCode(order.tracking_code || "");
    setTrackingUrl(order.tracking_url || "");
    setTrackingCarrier("");
    setIsShippingDialogOpen(true);
  };

  // Abrir dialog de status direto da listagem
  const handleOpenStatusFromList = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setIsStatusDialogOpen(true);
  };

  // Ação: Confirmar Pagamento
  const handleConfirmPayment = async () => {
    if (!selectedOrder) return;

    await updateOrderMutation.mutateAsync({
      id: selectedOrder.id,
      status: "paid",
      payment_status: "paid",
    });

    setSelectedOrder({ ...selectedOrder, status: "paid", payment_status: "paid" });
    setNewStatus("paid");
    toast.success("Pagamento confirmado com sucesso!");
  };

  // Ação: Iniciar Preparação
  const handleStartProcessing = async () => {
    if (!selectedOrder) return;

    await updateOrderMutation.mutateAsync({
      id: selectedOrder.id,
      status: "processing",
    });

    setSelectedOrder({ ...selectedOrder, status: "processing" });
    setNewStatus("processing");
    toast.success("Pedido em preparação!");
  };

  // Ação: Marcar como Enviado
  const handleMarkAsShipped = () => {
    setIsShippingDialogOpen(true);
  };

  const confirmShipping = async () => {
    if (!selectedOrder) return;

    const carrier = carriers.find(c => c.value === trackingCarrier);
    let finalTrackingUrl = trackingUrl;

    if (carrier && carrier.urlPattern && trackingCode) {
      finalTrackingUrl = carrier.urlPattern + trackingCode;
    }

    await updateOrderMutation.mutateAsync({
      id: selectedOrder.id,
      status: "shipped",
      tracking_code: trackingCode,
      tracking_url: finalTrackingUrl,
      shipped_at: new Date().toISOString(),
    });

    setSelectedOrder({
      ...selectedOrder,
      status: "shipped",
      tracking_code: trackingCode,
      tracking_url: finalTrackingUrl,
      shipped_at: new Date().toISOString(),
    });
    setNewStatus("shipped");
    setIsShippingDialogOpen(false);
    toast.success("Pedido marcado como enviado!");
  };

  // Ação: Marcar como Entregue
  const handleMarkAsDelivered = async () => {
    if (!selectedOrder) return;

    await updateOrderMutation.mutateAsync({
      id: selectedOrder.id,
      status: "delivered",
      delivered_at: new Date().toISOString(),
    });

    setSelectedOrder({
      ...selectedOrder,
      status: "delivered",
      delivered_at: new Date().toISOString(),
    });
    setNewStatus("delivered");
    toast.success("Pedido marcado como entregue!");
  };

  // Ação: Cancelar Pedido
  const handleCancelOrder = () => {
    setCancellationReason("");
    setIsCancelDialogOpen(true);
  };

  const confirmCancellation = async () => {
    if (!selectedOrder || !cancellationReason.trim()) {
      toast.error("Por favor, informe o motivo do cancelamento");
      return;
    }

    await updateOrderMutation.mutateAsync({
      id: selectedOrder.id,
      status: "cancelled",
      cancellation_reason: cancellationReason,
      cancelled_at: new Date().toISOString(),
    });

    setSelectedOrder({
      ...selectedOrder,
      status: "cancelled",
      cancellation_reason: cancellationReason,
      cancelled_at: new Date().toISOString(),
    });
    setNewStatus("cancelled");
    setIsCancelDialogOpen(false);
    toast.success("Pedido cancelado");
  };

  // Ação: Reembolsar
  const handleRefund = () => {
    setRefundReason("");
    setIsRefundDialogOpen(true);
  };

  const confirmRefund = async () => {
    if (!selectedOrder || !refundReason.trim()) {
      toast.error("Por favor, informe o motivo do reembolso");
      return;
    }

    await updateOrderMutation.mutateAsync({
      id: selectedOrder.id,
      status: "refunded",
      notes: `${selectedOrder.notes || ""}\n\n[REEMBOLSO] ${format(new Date(), "dd/MM/yyyy HH:mm")}: ${refundReason}`.trim(),
    });

    setSelectedOrder({ ...selectedOrder, status: "refunded" });
    setNewStatus("refunded");
    setIsRefundDialogOpen(false);
    toast.success("Pedido reembolsado");
  };

  // Salvar alterações gerais
  const handleSaveChanges = async () => {
    if (!selectedOrder) return;

    const updates: Partial<Order> & { id: string } = {
      id: selectedOrder.id,
    };

    if (newStatus !== selectedOrder.status) {
      updates.status = newStatus;
    }
    if (orderNotes !== (selectedOrder.notes || "")) {
      updates.notes = orderNotes;
    }
    if (trackingCode !== (selectedOrder.tracking_code || "")) {
      updates.tracking_code = trackingCode;
    }
    if (trackingUrl !== (selectedOrder.tracking_url || "")) {
      updates.tracking_url = trackingUrl;
    }

    if (Object.keys(updates).length > 1) {
      await updateOrderMutation.mutateAsync(updates);
      setSelectedOrder({ ...selectedOrder, ...updates });
      toast.success("Alterações salvas com sucesso!");
    }
  };

  const handleCopyTracking = async () => {
    if (trackingCode) {
      await navigator.clipboard.writeText(trackingCode);
      setCopiedTracking(true);
      toast.success("Código de rastreio copiado!");
      setTimeout(() => setCopiedTracking(false), 2000);
    }
  };

  const getStatusIndex = (status: string) => {
    return statusOrder.indexOf(status);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const canConfirmPayment = selectedOrder?.status === "pending";
  const canStartProcessing = selectedOrder?.status === "paid";
  const canShip = selectedOrder?.status === "processing";
  const canDeliver = selectedOrder?.status === "shipped";
  const canCancel = selectedOrder && !["cancelled", "refunded", "delivered"].includes(selectedOrder.status);
  const canRefund = selectedOrder && ["paid", "delivered", "completed"].includes(selectedOrder.status);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Pedidos</h1>
          <p className="text-muted-foreground">Gerencie todos os pedidos da loja</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número, email ou nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredOrders && filteredOrders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const status = statusConfig[order.status];
                    return (
                      <TableRow key={order.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono font-medium">{order.order_number}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.customer_name}</p>
                            <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(Number(order.total_amount))}</TableCell>
                        <TableCell>
                          <Badge className={status?.bgColor || "bg-gray-100"}>
                            <span className="flex items-center gap-1">
                              {status?.icon}
                              {status?.label || order.status}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewOrder(order);
                              }}
                              title="Visualizar"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenStatusFromList(order);
                              }}
                              title="Alterar Status"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            {order.status === "processing" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenShippingFromList(order);
                                }}
                                title="Informar Envio"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum pedido encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Detail Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            {selectedOrder && (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <DialogTitle className="text-2xl font-mono">
                        {selectedOrder.order_number}
                      </DialogTitle>
                      <DialogDescription className="mt-1">
                        Pedido realizado em {format(new Date(selectedOrder.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                      </DialogDescription>
                    </div>
                    <Badge className={statusConfig[selectedOrder.status]?.bgColor || "bg-gray-100"} variant="outline">
                      <span className="flex items-center gap-1">
                        {statusConfig[selectedOrder.status]?.icon}
                        {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                      </span>
                    </Badge>
                  </div>
                </DialogHeader>

                <div className="grid gap-6 mt-4">
                  {/* Quick Actions */}
                  <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                    <CardHeader className="pb-3">
                      <h3 className="font-semibold flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Ações Rápidas
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {canConfirmPayment && (
                          <Button
                            onClick={handleConfirmPayment}
                            disabled={updateOrderMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Confirmar Pagamento
                          </Button>
                        )}
                        {canStartProcessing && (
                          <Button
                            onClick={handleStartProcessing}
                            disabled={updateOrderMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Package className="h-4 w-4 mr-2" />
                            Iniciar Preparação
                          </Button>
                        )}
                        {canShip && (
                          <Button
                            onClick={handleMarkAsShipped}
                            disabled={updateOrderMutation.isPending}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Informar Envio
                          </Button>
                        )}
                        {canDeliver && (
                          <Button
                            onClick={handleMarkAsDelivered}
                            disabled={updateOrderMutation.isPending}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <PackageCheck className="h-4 w-4 mr-2" />
                            Marcar como Entregue
                          </Button>
                        )}
                        {canRefund && (
                          <Button
                            variant="outline"
                            onClick={handleRefund}
                            disabled={updateOrderMutation.isPending}
                            className="border-orange-300 text-orange-600 hover:bg-orange-50"
                          >
                            <Undo2 className="h-4 w-4 mr-2" />
                            Reembolsar
                          </Button>
                        )}
                        {canCancel && (
                          <Button
                            variant="outline"
                            onClick={handleCancelOrder}
                            disabled={updateOrderMutation.isPending}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Cancelar Pedido
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Status Timeline */}
                  {!["cancelled", "refunded"].includes(selectedOrder.status) && (
                    <div className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg p-4">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Progresso do Pedido
                      </h3>
                      <div className="flex items-center justify-between relative">
                        {/* Progress Line */}
                        <div className="absolute top-4 left-0 right-0 h-1 bg-muted rounded-full">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-500"
                            style={{
                              width: `${(getStatusIndex(selectedOrder.status) / (statusOrder.length - 1)) * 100}%`
                            }}
                          />
                        </div>

                        {statusOrder.map((status, index) => {
                          const config = statusConfig[status];
                          const isActive = getStatusIndex(selectedOrder.status) >= index;
                          const isCurrent = selectedOrder.status === status;

                          return (
                            <div key={status} className="flex flex-col items-center z-10">
                              <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                                ${isActive
                                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                                  : 'bg-muted text-muted-foreground'
                                }
                                ${isCurrent ? 'ring-4 ring-primary/20 scale-110' : ''}
                              `}>
                                {config?.icon}
                              </div>
                              <span className={`
                                text-xs mt-2 text-center max-w-[80px]
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

                  {/* Cancelled/Refunded Status */}
                  {selectedOrder.status === "cancelled" && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-red-800">Pedido Cancelado</h4>
                          {selectedOrder.cancelled_at && (
                            <p className="text-sm text-red-600">
                              Cancelado em {format(new Date(selectedOrder.cancelled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          )}
                          {selectedOrder.cancellation_reason && (
                            <p className="text-sm text-red-700 mt-2">
                              <strong>Motivo:</strong> {selectedOrder.cancellation_reason}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedOrder.status === "refunded" && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <RefreshCw className="h-5 w-5 text-orange-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-orange-800">Pedido Reembolsado</h4>
                          <p className="text-sm text-orange-600">
                            O valor foi devolvido ao cliente.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tracking Info */}
                  {(selectedOrder.tracking_code || selectedOrder.status === "shipped") && (
                    <Card className="border-purple-200 bg-purple-50/50">
                      <CardHeader className="pb-3">
                        <h3 className="font-semibold flex items-center gap-2 text-purple-800">
                          <Truck className="h-4 w-4" />
                          Informações de Envio
                        </h3>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {selectedOrder.shipped_at && (
                          <p className="text-sm text-purple-600">
                            Enviado em {format(new Date(selectedOrder.shipped_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        )}
                        {selectedOrder.tracking_code && (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-white rounded-md border px-3 py-2 font-mono text-sm">
                              {selectedOrder.tracking_code}
                            </div>
                            <Button variant="outline" size="sm" onClick={handleCopyTracking}>
                              {copiedTracking ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                            {selectedOrder.tracking_url && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={selectedOrder.tracking_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        )}
                        {selectedOrder.delivered_at && (
                          <p className="text-sm text-emerald-600 flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            Entregue em {format(new Date(selectedOrder.delivered_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Customer Info */}
                    <Card>
                      <CardHeader className="pb-3">
                        <h3 className="font-semibold flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Informações do Cliente
                        </h3>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{selectedOrder.customer_name}</p>
                            <p className="text-sm text-muted-foreground">Cliente</p>
                          </div>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{selectedOrder.customer_email}</span>
                          </div>
                          {selectedOrder.customer_phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{selectedOrder.customer_phone}</span>
                            </div>
                          )}
                          {selectedOrder.shipping_address && (
                            <div className="flex items-start gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <span>{selectedOrder.shipping_address}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Order Summary */}
                    <Card>
                      <CardHeader className="pb-3">
                        <h3 className="font-semibold flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Resumo do Pedido
                        </h3>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Data: {format(new Date(selectedOrder.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                        </div>
                        {selectedOrder.payment_method && (
                          <div className="flex items-center gap-2 text-sm">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <span>Pagamento: {selectedOrder.payment_method}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="space-y-2">
                          {selectedOrder.subtotal && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Subtotal</span>
                              <span>{formatCurrency(Number(selectedOrder.subtotal))}</span>
                            </div>
                          )}
                          {selectedOrder.shipping_cost && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Frete</span>
                              <span>{formatCurrency(Number(selectedOrder.shipping_cost))}</span>
                            </div>
                          )}
                          {selectedOrder.discount && Number(selectedOrder.discount) > 0 && (
                            <div className="flex justify-between text-sm text-green-600">
                              <span>Desconto</span>
                              <span>-{formatCurrency(Number(selectedOrder.discount))}</span>
                            </div>
                          )}
                          <Separator />
                          <div className="flex justify-between font-semibold text-lg">
                            <span>Total</span>
                            <span className="text-primary">{formatCurrency(Number(selectedOrder.total_amount))}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Order Items */}
                  <Card>
                    <CardHeader className="pb-3">
                      <h3 className="font-semibold flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4" />
                        Itens do Pedido ({orderItems?.length || 0} {orderItems?.length === 1 ? 'item' : 'itens'})
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {orderItems?.map((item) => (
                          <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                            <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                              {item.product_image ? (
                                <img
                                  src={item.product_image}
                                  alt={item.product_title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="h-6 w-6 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{item.product_title}</p>
                              {item.variant_title && (
                                <p className="text-sm text-muted-foreground">{item.variant_title}</p>
                              )}
                              <p className="text-sm text-muted-foreground">
                                Qtd: {item.quantity} × {formatCurrency(Number(item.price))}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                {formatCurrency(Number(item.price) * item.quantity)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Notes & Settings */}
                  <Card>
                    <CardHeader className="pb-3">
                      <h3 className="font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Observações e Configurações
                      </h3>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="status">Status do Pedido</Label>
                          <Select value={newStatus} onValueChange={setNewStatus}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(statusConfig).map(([key, config]) => (
                                <SelectItem key={key} value={key}>
                                  <span className="flex items-center gap-2">
                                    {config.icon}
                                    {config.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tracking">Código de Rastreio</Label>
                          <div className="flex gap-2">
                            <Input
                              id="tracking"
                              value={trackingCode}
                              onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                              placeholder="Ex: BR123456789BR"
                              className="font-mono"
                            />
                            {trackingCode && (
                              <Button variant="outline" size="icon" onClick={handleCopyTracking}>
                                {copiedTracking ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="trackingUrl">URL de Rastreamento (opcional)</Label>
                        <Input
                          id="trackingUrl"
                          value={trackingUrl}
                          onChange={(e) => setTrackingUrl(e.target.value)}
                          placeholder="https://..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Observações Internas</Label>
                        <Textarea
                          id="notes"
                          placeholder="Adicione observações sobre o pedido..."
                          value={orderNotes}
                          onChange={(e) => setOrderNotes(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Fechar
                        </Button>
                        <Button
                          onClick={handleSaveChanges}
                          disabled={
                            updateOrderMutation.isPending ||
                            (newStatus === selectedOrder.status &&
                              orderNotes === (selectedOrder.notes || "") &&
                              trackingCode === (selectedOrder.tracking_code || "") &&
                              trackingUrl === (selectedOrder.tracking_url || ""))
                          }
                        >
                          {updateOrderMutation.isPending ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Salvar Alterações
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Shipping Dialog */}
        <Dialog open={isShippingDialogOpen} onOpenChange={setIsShippingDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-purple-600" />
                Informar Envio
              </DialogTitle>
              <DialogDescription>
                Preencha as informações de envio do pedido {selectedOrder?.order_number}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="carrier">Transportadora</Label>
                <Select value={trackingCarrier} onValueChange={setTrackingCarrier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a transportadora" />
                  </SelectTrigger>
                  <SelectContent>
                    {carriers.map((carrier) => (
                      <SelectItem key={carrier.value} value={carrier.value}>
                        {carrier.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="trackingCodeShip">Código de Rastreio</Label>
                <Input
                  id="trackingCodeShip"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                  placeholder="Ex: BR123456789BR"
                  className="font-mono"
                />
              </div>
              {trackingCarrier === "outro" && (
                <div className="space-y-2">
                  <Label htmlFor="customUrl">URL de Rastreamento</Label>
                  <Input
                    id="customUrl"
                    value={trackingUrl}
                    onChange={(e) => setTrackingUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsShippingDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={confirmShipping}
                disabled={!trackingCode.trim() || updateOrderMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Send className="h-4 w-4 mr-2" />
                Confirmar Envio
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel Order Dialog */}
        <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Cancelar Pedido
              </AlertDialogTitle>
              <AlertDialogDescription>
                Você está prestes a cancelar o pedido <strong>{selectedOrder?.order_number}</strong>. Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="cancelReason">Motivo do Cancelamento *</Label>
              <Textarea
                id="cancelReason"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Informe o motivo do cancelamento..."
                className="mt-2"
                rows={3}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Voltar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmCancellation}
                className="bg-red-600 hover:bg-red-700"
                disabled={!cancellationReason.trim()}
              >
                <Ban className="h-4 w-4 mr-2" />
                Confirmar Cancelamento
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Refund Dialog */}
        <AlertDialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-orange-600">
                <Undo2 className="h-5 w-5" />
                Reembolsar Pedido
              </AlertDialogTitle>
              <AlertDialogDescription>
                Você está prestes a reembolsar o pedido <strong>{selectedOrder?.order_number}</strong> no valor de <strong>{selectedOrder && formatCurrency(Number(selectedOrder.total_amount))}</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="refundReason">Motivo do Reembolso *</Label>
              <Textarea
                id="refundReason"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Informe o motivo do reembolso..."
                className="mt-2"
                rows={3}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Voltar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmRefund}
                className="bg-orange-600 hover:bg-orange-700"
                disabled={!refundReason.trim()}
              >
                <Undo2 className="h-4 w-4 mr-2" />
                Confirmar Reembolso
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Status Change Dialog */}
        <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Alterar Status do Pedido
              </DialogTitle>
              <DialogDescription>
                Alterar o status do pedido {selectedOrder?.order_number}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Status Atual</Label>
                <div className="flex items-center gap-2">
                  <Badge className={statusConfig[selectedOrder?.status || ""]?.bgColor || "bg-gray-100"}>
                    <span className="flex items-center gap-1">
                      {statusConfig[selectedOrder?.status || ""]?.icon}
                      {statusConfig[selectedOrder?.status || ""]?.label || selectedOrder?.status}
                    </span>
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newStatusSelect">Novo Status</Label>
                <Select value={newStatus} onValueChange={(value) => {
                  setNewStatus(value);
                  // Limpar campos de rastreio se mudar de shipped para outro
                  if (value !== "shipped") {
                    setTrackingCode("");
                    setTrackingCarrier("");
                    setTrackingUrl("");
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o novo status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          {config.icon}
                          {config.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Campos de rastreio quando status é 'shipped' */}
              {newStatus === "shipped" && (
                <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="font-medium flex items-center gap-2 text-purple-800">
                    <Truck className="h-4 w-4" />
                    Informações de Envio
                  </h4>
                  <div className="space-y-2">
                    <Label htmlFor="statusCarrier">Transportadora</Label>
                    <Select value={trackingCarrier} onValueChange={setTrackingCarrier}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a transportadora" />
                      </SelectTrigger>
                      <SelectContent>
                        {carriers.map((carrier) => (
                          <SelectItem key={carrier.value} value={carrier.value}>
                            {carrier.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="statusTrackingCode">Código de Rastreio</Label>
                    <Input
                      id="statusTrackingCode"
                      value={trackingCode}
                      onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                      placeholder="Ex: BR123456789BR"
                      className="font-mono"
                    />
                  </div>
                  {trackingCarrier === "outro" && (
                    <div className="space-y-2">
                      <Label htmlFor="statusTrackingUrl">URL de Rastreamento</Label>
                      <Input
                        id="statusTrackingUrl"
                        value={trackingUrl}
                        onChange={(e) => setTrackingUrl(e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  if (!selectedOrder || newStatus === selectedOrder.status) return;

                  const updateData: any = {
                    id: selectedOrder.id,
                    status: newStatus,
                  };

                  // Se for shipped, adicionar informações de rastreio
                  if (newStatus === "shipped") {
                    const carrier = carriers.find(c => c.value === trackingCarrier);
                    let finalTrackingUrl = trackingUrl;

                    if (carrier && carrier.urlPattern && trackingCode) {
                      finalTrackingUrl = carrier.urlPattern + trackingCode;
                    }

                    updateData.tracking_code = trackingCode;
                    updateData.tracking_url = finalTrackingUrl;
                    updateData.shipped_at = new Date().toISOString();
                  }

                  await updateOrderMutation.mutateAsync(updateData);
                  setSelectedOrder({ ...selectedOrder, status: newStatus });
                  setIsStatusDialogOpen(false);
                  toast.success("Status atualizado com sucesso!");
                }}
                disabled={
                  !newStatus ||
                  newStatus === selectedOrder?.status ||
                  updateOrderMutation.isPending ||
                  (newStatus === "shipped" && !trackingCode.trim())
                }
              >
                {updateOrderMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
