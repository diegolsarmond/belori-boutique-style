import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { storefrontApiRequest, STOREFRONT_QUERY } from "@/lib/shopify";
import { ShopifyProduct } from "@/types/shopify";
import { Search, Plus, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function Produtos() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const result = await storefrontApiRequest(STOREFRONT_QUERY, { first: 50 });
      return (result?.data?.products?.edges || []) as ShopifyProduct[];
    }
  });

  const filteredProducts = products?.filter((product) =>
    product.node.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProduct = () => {
    toast.info("Para adicionar produtos, use o chat! Ex: 'criar produto X por R$Y'");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Produtos</h1>
            <p className="text-muted-foreground">Gerencie o catálogo de produtos da loja</p>
          </div>
          <Button onClick={handleAddProduct}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Produto
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Carregando produtos...</p>
            ) : filteredProducts && filteredProducts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Variantes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.node.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-secondary rounded-md overflow-hidden">
                            {product.node.images.edges[0]?.node?.url && (
                              <img
                                src={product.node.images.edges[0].node.url}
                                alt={product.node.title}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{product.node.title}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {product.node.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {Number(product.node.priceRange.minVariantPrice.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </TableCell>
                      <TableCell>{product.node.variants.edges.length}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Ativo</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/produto/${product.node.handle}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-8 text-muted-foreground">
                Nenhum produto encontrado
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
