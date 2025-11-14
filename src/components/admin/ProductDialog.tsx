import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";

const productSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  price: z.string().min(1, "Preço é obrigatório"),
  vendor: z.string().optional(),
  product_type: z.string().optional(),
  tags: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ProductDialog({ open, onOpenChange, onSuccess }: ProductDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

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
    setIsSubmitting(true);
    try {
      const images = imageUrls.map(url => ({ file_path: url, alt: data.title }));
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-shopify-product`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          body: data.description || "",
          vendor: data.vendor || "",
          product_type: data.product_type || "",
          tags: data.tags || "",
          images,
          variants: [{
            price: data.price,
            option1: "Default",
          }],
          options: [{ name: "Title", values: ["Default"] }],
        }),
      });

      if (!response.ok) throw new Error("Erro ao criar produto");

      toast.success("Produto criado com sucesso!");
      reset();
      setImageUrls([]);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao criar produto:", error);
      toast.error("Erro ao criar produto");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Produto</DialogTitle>
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
              <Label htmlFor="price">Preço (R$) *</Label>
              <Input id="price" type="number" step="0.01" {...register("price")} />
              {errors.price && <p className="text-sm text-destructive mt-1">{errors.price.message}</p>}
            </div>

            <div>
              <Label htmlFor="vendor">Fornecedor</Label>
              <Input id="vendor" {...register("vendor")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="product_type">Tipo de Produto</Label>
              <Input id="product_type" {...register("product_type")} />
            </div>

            <div>
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input id="tags" {...register("tags")} placeholder="tag1, tag2, tag3" />
            </div>
          </div>

          <div>
            <Label>Imagens (URLs)</Label>
            <div className="flex gap-2 mb-2">
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
              Criar Produto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
