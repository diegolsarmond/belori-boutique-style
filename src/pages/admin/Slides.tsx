import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";

interface Slide {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
}

interface SlideFormData {
  title: string;
  description: string;
  link_url: string;
  display_order: number;
  is_active: boolean;
  image_file: File | null;
}

export default function Slides() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<SlideFormData>({
    title: "",
    description: "",
    link_url: "",
    display_order: 0,
    is_active: true,
    image_file: null,
  });

  const { data: slides, isLoading } = useQuery({
    queryKey: ["admin-slides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("BeloriBH_slides")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Slide[];
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
    mutationFn: async (data: SlideFormData) => {
      setUploading(true);
      let imageUrl = "";

      if (data.image_file) {
        imageUrl = await convertToBase64(data.image_file);
      }

      const { error } = await supabase.from("BeloriBH_slides").insert({
        title: data.title,
        description: data.description || null,
        image_url: imageUrl,
        link_url: data.link_url || null,
        display_order: data.display_order,
        is_active: data.is_active,
      });

      if (error) throw error;
      setUploading(false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-slides"] });
      toast.success("Slide criado com sucesso!");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      setUploading(false);
      toast.error("Erro ao criar slide: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: SlideFormData & { id: string }) => {
      setUploading(true);
      let imageUrl = editingSlide?.image_url || "";

      if (data.image_file) {
        imageUrl = await convertToBase64(data.image_file);
      }

      const { error } = await supabase
        .from("BeloriBH_slides")
        .update({
          title: data.title,
          description: data.description || null,
          image_url: imageUrl,
          link_url: data.link_url || null,
          display_order: data.display_order,
          is_active: data.is_active,
        })
        .eq("id", data.id);

      if (error) throw error;
      setUploading(false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-slides"] });
      toast.success("Slide atualizado!");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      setUploading(false);
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("BeloriBH_slides").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-slides"] });
      toast.success("Slide deletado!");
    },
    onError: (error) => {
      toast.error("Erro ao deletar: " + error.message);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await supabase
        .from("BeloriBH_slides")
        .update({ display_order: newOrder })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-slides"] });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      link_url: "",
      display_order: 0,
      is_active: true,
      image_file: null,
    });
    setEditingSlide(null);
  };

  const handleEdit = (slide: Slide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title,
      description: slide.description || "",
      link_url: slide.link_url || "",
      display_order: slide.display_order,
      is_active: slide.is_active,
      image_file: null,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.image_file && !editingSlide) {
      toast.error("Selecione uma imagem");
      return;
    }

    if (editingSlide) {
      updateMutation.mutate({ ...formData, id: editingSlide.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const moveSlide = (slide: Slide, direction: "up" | "down") => {
    if (!slides) return;

    const currentIndex = slides.findIndex((s) => s.id === slide.id);
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === slides.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const targetSlide = slides[targetIndex];

    reorderMutation.mutate({ id: slide.id, newOrder: targetSlide.display_order });
    reorderMutation.mutate({ id: targetSlide.id, newOrder: slide.display_order });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Slides do Banner</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Slide
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingSlide ? "Editar Slide" : "Novo Slide"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="image">Imagem</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        image_file: e.target.files?.[0] || null,
                      })
                    }
                    required={!editingSlide}
                  />
                  {editingSlide && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Deixe em branco para manter a imagem atual
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="link_url">Link (opcional)</Label>
                  <Input
                    id="link_url"
                    type="url"
                    value={formData.link_url}
                    onChange={(e) =>
                      setFormData({ ...formData, link_url: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <Label htmlFor="display_order">Ordem de Exibição</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        display_order: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <Label htmlFor="is_active">Ativo</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={uploading}>
                    {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingSlide ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : slides && slides.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Lista de Slides</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Imagem</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Ordem</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slides.map((slide) => (
                    <TableRow key={slide.id}>
                      <TableCell>
                        <img
                          src={slide.image_url}
                          alt={slide.title}
                          className="w-20 h-12 object-cover rounded"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{slide.title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveSlide(slide, "up")}
                            disabled={slides[0].id === slide.id}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <span>{slide.display_order}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveSlide(slide, "down")}
                            disabled={slides[slides.length - 1].id === slide.id}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${slide.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                            }`}
                        >
                          {slide.is_active ? "Ativo" : "Inativo"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(slide)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (
                                confirm(
                                  "Tem certeza que deseja deletar este slide?"
                                )
                              ) {
                                deleteMutation.mutate(slide.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Nenhum slide cadastrado. Clique em "Novo Slide" para começar.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
