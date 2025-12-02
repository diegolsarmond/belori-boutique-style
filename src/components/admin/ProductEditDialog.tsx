import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, X, Upload } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ShopifyProduct } from "@/types/shopify";
import { supabase } from "@/integrations/supabase/client";

const productSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  vendor: z.string().optional(),
  product_type: z.string().optional(),
  tags: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductEditDialogProps {
  product: ShopifyProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ProductEditDialog({ product, open, onOpenChange, onSuccess }: ProductEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const base64 = await convertToBase64(file);
        setImageUrls([...imageUrls, base64]);
      } catch (err) {
        toast.error("Erro ao processar imagem");
      }
    }
  };

  useEffect(() => {
    if (product && open) {
      setValue("title", product.node.title);
      setValue("description", product.node.description);
      setValue("vendor", product.node.vendor || "");
      setValue("product_type", "");
      setValue("tags", "");

      const existingImages = product.node.images.edges.map(edge => edge.node.url);
      setImageUrls(existingImages);
    }
  }, [product, open, setValue]);

  const addImageUrl = () => {
    if (newImageUrl.trim()) {
      setImageUrls([...imageUrls, newImageUrl.trim()]);
      setNewImageUrl("");
    }
  };

  const removeImageUrl = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ProductFormData) => {
    if (!product) return;

    setIsSubmitting(true);
    try {
      // Integração removida
      /*
      const productId = parseInt(product.node.id.split('/').pop() || '0');
      const images = imageUrls.map(url => {
        if (url.startsWith('data:')) {
          return { attachment: url.split(',')[1], alt: data.title };
        }
        return { file_path: url, alt: data.title };
      });

      const { error } = await supabase.functions.invoke('update-shopify-product', {
        body: {
          product_id: productId,
          title: data.title,
          body: data.description || "",
          vendor: data.vendor || "",
          product_type: data.product_type || "",
          tags: data.tags || "",
          images,
        },
      });

      if (error) throw error;
      */

      toast.info("Integração com Shopify removida. Produto não atualizado.");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      toast.error("Erro ao atualizar produto");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Produto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input id="title" {...register("title")} />
            {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" {...register("description")} rows={4} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vendor">Fornecedor</Label>
              <Select onValueChange={(value) => setValue("vendor", value)} defaultValue={product.node.vendor}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.map((supplier) => (
                    <SelectItem key={supplier.name} value={supplier.name}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="product_type">Tipo de Produto</Label>
              <Input id="product_type" {...register("product_type")} />
            </div>
          </div>

          <div>
            <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
            <Input id="tags" {...register("tags")} placeholder="tag1, tag2, tag3" />
          </div>

          <div>
            <Label>Imagens (URLs)</Label>
            <div className="flex flex-col sm:flex-row gap-2 mb-2">
              <div className="flex-1 flex gap-2">
                <Input
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="URL da imagem"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImageUrl())}
                />
                <Button type="button" onClick={addImageUrl} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="relative">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Button type="button" variant="outline" className="w-full sm:w-auto">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {imageUrls.map((url, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-secondary rounded">
                  <img src={url} alt="" className="w-12 h-12 object-cover rounded" />
                  <span className="flex-1 text-sm truncate">{url}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeImageUrl(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
