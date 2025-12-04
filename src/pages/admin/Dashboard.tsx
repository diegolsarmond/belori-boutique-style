import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, Users, DollarSign } from "lucide-react";

export default function Dashboard() {
  const { data: ordersData } = useQuery({
    queryKey: ['admin-orders-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    }
  });

  const { data: customersData } = useQuery({
    queryKey: ['admin-customers-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    }
  });

  const { data: productsData } = useQuery({
    queryKey: ['admin-products-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    }
  });

  const { data: revenueData } = useQuery({
    queryKey: ['admin-revenue'],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('total_amount');
      
      const total = data?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      return total.toFixed(2);
    }
  });

  const stats = [
    {
      title: "Produtos",
      value: productsData || 0,
      icon: Package,
      color: "text-blue-600",
    },
    {
      title: "Pedidos",
      value: ordersData || 0,
      icon: ShoppingCart,
      color: "text-green-600",
    },
    {
      title: "Clientes",
      value: customersData || 0,
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "Receita Total",
      value: `R$ ${revenueData || "0.00"}`,
      icon: DollarSign,
      color: "text-amber-600",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral da sua loja</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bem-vindo ao Painel Administrativo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Gerencie seus produtos, pedidos e clientes de forma fácil e eficiente.
              Use o menu lateral para navegar entre as diferentes seções.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
