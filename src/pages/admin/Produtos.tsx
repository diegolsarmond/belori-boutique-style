import { useState } from "react";
// Force rebuild
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Search, Plus, Edit, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { X, ChevronDown, Image as ImageIcon } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  supplier_id: string | null;
  is_active: boolean;
  image_url: string | null;
  additional_images: string[] | null;
  category: string | null;
  colors: string[] | null;
  sizes: string[] | null;
  suppliers?: { name: string } | null;
}

interface Supplier {
  id: string;
  name: string;
}

const AVAILABLE_COLORS = [
  "Preto", "Branco", "Cinza", "Bege", "Azul", "Azul Marinho", "Azul Claro",
  "Vermelho", "Vinho", "Rosa", "Pink", "Verde", "Verde Militar", "Verde Lima",
  "Amarelo", "Roxo", "Lilás", "Laranja", "Marrom", "Caramelo",
  "Jeans", "Jeans Claro", "Jeans Escuro", "Dourado", "Prata", "Estampado", "Multicolor"
];

export default function Produtos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [existingAdditionalImages, setExistingAdditionalImages] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [additionalImageFiles, setAdditionalImageFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    price: string;
    stock_quantity: string;
    supplier_id: string;
    category: string;
    colors: string[];
    sizes: string;
    is_active: boolean;
  }>({
    name: "",
    description: "",
    price: "",
    stock_quantity: "",
    supplier_id: "",
    category: "",
    colors: [],
    sizes: "",
    is_active: true,
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("BeloriBH_products")
        .select("*, suppliers:BeloriBH_suppliers(name)")
        .order("name");
      if (error) throw error;
      return data as unknown as Product[];
    },
  });

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("BeloriBH_suppliers")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Supplier[];
    },
  });

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const createMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description: string | null;
      price: number;
      stock_quantity: number;
      supplier_id: string | null;
      is_active: boolean;
      image_url?: string;
      additional_images?: string[];
      category?: string | null;
      colors?: string[] | null;
      sizes?: string[] | null;
    }) => {
      const { error } = await supabase.from("BeloriBH_products").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto criado com sucesso!");
      handleCloseDialog();
    },
    onError: () => toast.error("Erro ao criar produto"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        name: string;
        description: string | null;
        price: number;
        stock_quantity: number;
        supplier_id: string | null;
        is_active: boolean;
        image_url?: string;
        additional_images?: string[];
        category?: string | null;
        colors?: string[] | null;
        sizes?: string[] | null;
      };
    }) => {
      const { error } = await supabase.from("BeloriBH_products").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto atualizado com sucesso!");
      handleCloseDialog();
    },
    onError: () => toast.error("Erro ao atualizar produto"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("BeloriBH_products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto deletado com sucesso!");
      setDeleteId(null);
    },
    onError: () => toast.error("Erro ao deletar produto"),
  });

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setSelectedProduct(product);
      setExistingAdditionalImages(product.additional_images || []);
      setFormData({
        name: product.name,
        description: product.description || "",
        price: product.price.toString(),
        stock_quantity: product.stock_quantity.toString(),
        supplier_id: product.supplier_id || "",
        category: product.category || "",
        colors: product.colors || [],
        sizes: product.sizes?.join(", ") || "",
        is_active: product.is_active,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedProduct(null);
    setImageFile(null);
    setExistingAdditionalImages([]);
    setFormData({
      name: "",
      description: "",
      price: "",
      stock_quantity: "",
      supplier_id: "",
      category: "",
      colors: [],
      sizes: "",
      is_active: true,
    });
    setAdditionalImageFiles([]);
  };

  const removeNewImage = (index: number) => {
    setAdditionalImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingAdditionalImages(prev => prev.filter((_, i) => i !== index));
  };

  const toggleColor = (color: string) => {
    setFormData(prev => {
      const colors = prev.colors.includes(color)
        ? prev.colors.filter(c => c !== color)
        : [...prev.colors, color];
      return { ...prev, colors };
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error("Preço deve ser maior que zero");
      return;
    }
    if (!formData.stock_quantity || parseInt(formData.stock_quantity) < 0) {
      toast.error("Quantidade em estoque inválida");
      return;
    }

    try {
      setIsUploading(true);
      let imageUrl = selectedProduct?.image_url;
      // Start with the modified existing images list, not the original additional_images from product
      let additionalImages = [...existingAdditionalImages];

      if (imageFile) {
        imageUrl = await convertToBase64(imageFile);
      }

      if (additionalImageFiles.length > 0) {
        const newImages = await Promise.all(
          additionalImageFiles.map((file) => convertToBase64(file))
        );
        additionalImages = [...additionalImages, ...newImages];
      }

      // Colors are already an array
      const colorsArray = formData.colors;

      const sizesArray = formData.sizes
        ? formData.sizes.split(",").map((s) => s.trim()).filter((s) => s !== "")
        : null;

      const supplierId = formData.supplier_id === "none" || !formData.supplier_id ? null : formData.supplier_id;
      const category = formData.category === "none" || !formData.category ? null : formData.category;

      const data = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price) || 0,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        supplier_id: supplierId,
        category: category,
        colors: colorsArray,
        sizes: sizesArray,
        is_active: formData.is_active,
        ...(imageUrl && { image_url: imageUrl }),
        additional_images: additionalImages,
      };

      if (selectedProduct) {
        updateMutation.mutate({ id: selectedProduct.id, data });
      } else {
        createMutation.mutate(data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar produto");
    } finally {
      setIsUploading(false);
    }
  };

  const filteredProducts = products?.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Produtos</h1>
            <p className="text-muted-foreground">
              Gerencie o catálogo de produtos da loja
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Produto
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Carregando...</p>
            ) : filteredProducts && filteredProducts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-secondary rounded-md overflow-hidden">
                            {product.image_url && (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {product.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {Number(product.price).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={product.stock_quantity > 0 ? "default" : "destructive"}
                        >
                          {product.stock_quantity}
                        </Badge>
                      </TableCell>
                      <TableCell>{product.suppliers?.name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={product.is_active ? "default" : "secondary"}>
                          {product.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              {selectedProduct ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="geral" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="geral">Informações Gerais</TabsTrigger>
              <TabsTrigger value="detalhes">Variações & Estoque</TabsTrigger>
              <TabsTrigger value="imagens">Imagens</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto px-1 pr-2 pb-4">
              <TabsContent value="geral" className="space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="name">Nome do Produto *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Vestido Longo Floral"
                      className="mt-1.5"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      rows={4}
                      placeholder="Detalhes sobre o produto..."
                      className="mt-1.5 resize-none"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData({ ...formData, category: value })
                      }
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="roupas">Roupas</SelectItem>
                        <SelectItem value="sapatos">Sapatos</SelectItem>
                        <SelectItem value="moda_praia">Moda Praia</SelectItem>
                        <SelectItem value="fitness">Fitness</SelectItem>
                        <SelectItem value="lingerie">Lingerie</SelectItem>
                        <SelectItem value="infantil">Infantil</SelectItem>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="bolsas">Bolsas</SelectItem>
                        <SelectItem value="acessorios">Acessórios</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="supplier_id">Fornecedor</Label>
                    <Select
                      value={formData.supplier_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, supplier_id: value })
                      }
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" key="none">Nenhum</SelectItem>
                        {suppliers?.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2 pt-4">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                    <Label htmlFor="is_active">Produto visível no catálogo</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="detalhes" className="space-y-6 mt-0">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <span className="w-1 h-6 bg-primary rounded-full"></span> Financeiro & Estoque
                    </h3>

                    <div>
                      <Label htmlFor="price">Preço de Venda (R$) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="mt-1.5"
                        placeholder="0,00"
                      />
                    </div>

                    <div>
                      <Label htmlFor="stock_quantity">Quantidade em Estoque *</Label>
                      <Input
                        id="stock_quantity"
                        type="number"
                        value={formData.stock_quantity}
                        onChange={(e) =>
                          setFormData({ ...formData, stock_quantity: e.target.value })
                        }
                        className="mt-1.5"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <span className="w-1 h-6 bg-purple-500 rounded-full"></span> Características
                    </h3>

                    {['roupas', 'sapatos', 'moda_praia', 'fitness', 'lingerie', 'infantil', 'masculino'].includes(formData.category) && (
                      <>
                        <div className="space-y-1.5">
                          <Label>Cores Disponíveis</Label>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="w-full justify-between text-left font-normal h-auto py-2">
                                {formData.colors.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {formData.colors.slice(0, 3).map(color => (
                                      <Badge key={color} variant="secondary" className="text-xs">{color}</Badge>
                                    ))}
                                    {formData.colors.length > 3 && (
                                      <Badge variant="secondary" className="text-xs">+{formData.colors.length - 3}</Badge>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">Selecione as cores...</span>
                                )}
                                <ChevronDown className="h-4 w-4 opacity-50 ml-2 shrink-0" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[300px] h-[300px] overflow-hidden p-0" align="start">
                              <ScrollArea className="h-full p-2">
                                {AVAILABLE_COLORS.map((color) => (
                                  <div
                                    key={color}
                                    className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                                    onClick={() => toggleColor(color)}
                                  >
                                    <Checkbox
                                      id={`color-${color}`}
                                      checked={formData.colors.includes(color)}
                                      onCheckedChange={() => toggleColor(color)}
                                    />
                                    <Label htmlFor={`color-${color}`} className="cursor-pointer flex-1">{color}</Label>
                                  </div>
                                ))}
                              </ScrollArea>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div>
                          <Label htmlFor="sizes">Tamanhos (separados por vírgula)</Label>
                          <Input
                            id="sizes"
                            value={formData.sizes}
                            onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                            placeholder="Ex: P, M, G, 38, 40"
                            className="mt-1.5"
                          />
                          <p className="text-xs text-muted-foreground mt-1">Dica: Use vírgulas para separar as opções.</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="imagens" className="space-y-6 mt-0">
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <Label htmlFor="image" className="text-base font-semibold">Imagem de Capa</Label>
                    <p className="text-sm text-muted-foreground mb-3">Esta imagem será exibida nas listagens e como principal.</p>

                    <div className="flex items-start gap-4">
                      <div className="relative group shrink-0 w-32 h-32 bg-secondary rounded-lg overflow-hidden border">
                        {(imageFile || selectedProduct?.image_url) ? (
                          <img
                            src={imageFile ? URL.createObjectURL(imageFile) : selectedProduct?.image_url || ''}
                            alt="Capa"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground opacity-50" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Label htmlFor="image" className="cursor-pointer text-white text-xs font-medium border border-white/50 px-2 py-1 rounded backdrop-blur-sm hover:bg-white/20">
                            Trocar
                          </Label>
                        </div>
                      </div>

                      <div className="flex-1">
                        <Input
                          id="image"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                        />
                        <Button variant="outline" size="sm" onClick={() => document.getElementById('image')?.click()}>
                          <Upload className="h-4 w-4 mr-2" />
                          Selecionar Arquivo
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          Formatos: JPG, PNG, WEBP. Máx: 5MB.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 bg-muted/20">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <Label htmlFor="additional_images" className="text-base font-semibold">Galeria de Imagens</Label>
                        <p className="text-sm text-muted-foreground">Adicione mais fotos para mostrar detalhes.</p>
                      </div>
                      <div>
                        <Input
                          id="additional_images"
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length > 0) setAdditionalImageFiles(prev => [...prev, ...files]);
                          }}
                        />
                        <Button variant="secondary" size="sm" onClick={() => document.getElementById('additional_images')?.click()}>
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Fotos
                        </Button>
                      </div>
                    </div>

                    {/* Gallery Grid */}
                    <div className="grid grid-cols-4 gap-4 mt-4">
                      {/* Existing Images */}
                      {existingAdditionalImages.map((img, index) => (
                        <div key={`existing-${index}`} className="relative group aspect-square rounded-md overflow-hidden bg-background border">
                          <img src={img} alt={`Galeria ${index}`} className="w-full h-full object-cover" />
                          <button
                            onClick={() => removeExistingImage(index)}
                            className="absolute top-1 right-1 h-6 w-6 bg-red-500/90 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600 shadow-sm"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <Badge variant="secondary" className="absolute bottom-1 left-1 text-[10px] h-5 px-1 opacity-70">Salva</Badge>
                        </div>
                      ))}

                      {/* New Files */}
                      {additionalImageFiles.map((file, index) => (
                        <div key={`new-${index}`} className="relative group aspect-square rounded-md overflow-hidden bg-background border">
                          <img src={URL.createObjectURL(file)} alt={`Novo ${index}`} className="w-full h-full object-cover opacity-90" />
                          <button
                            onClick={() => removeNewImage(index)}
                            className="absolute top-1 right-1 h-6 w-6 bg-red-500/90 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600 shadow-sm"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <Badge className="absolute bottom-1 left-1 text-[10px] h-5 px-1 bg-green-500/90 hover:bg-green-600">Nova</Badge>
                        </div>
                      ))}

                      {existingAdditionalImages.length === 0 && additionalImageFiles.length === 0 && (
                        <div className="col-span-full py-8 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                          <ImageIcon className="h-10 w-10 mb-2 opacity-20" />
                          <p>Nenhuma imagem extra adicionada</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isUploading}>
              {isUploading ? "Enviando..." : selectedProduct ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este produto? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
