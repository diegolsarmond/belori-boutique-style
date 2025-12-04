import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Edit, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    created_at: string;
    role?: "admin" | "user";
}

export default function Usuarios() {
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
    const [selectedRole, setSelectedRole] = useState<"admin" | "user">("user");

    const queryClient = useQueryClient();

    const { data: users, isLoading } = useQuery({
        queryKey: ['admin-users'],
        queryFn: async () => {
            // Fetch profiles
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (profilesError) throw profilesError;

            // Fetch user roles
            const { data: roles, error: rolesError } = await supabase
                .from('user_roles')
                .select('*');

            if (rolesError) throw rolesError;

            // Merge profiles with roles
            const usersWithRoles = profiles.map(profile => {
                const userRole = roles.find(r => r.user_id === profile.id);
                return {
                    ...profile,
                    role: userRole ? userRole.role : 'user' // Default to user if no role found
                };
            });

            return usersWithRoles as Profile[];
        }
    });

    const updateRoleMutation = useMutation({
        mutationFn: async ({ userId, role }: { userId: string, role: "admin" | "user" }) => {
            // Check if role entry exists
            const { data: existingRole } = await supabase
                .from('user_roles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (existingRole) {
                const { error } = await supabase
                    .from('user_roles')
                    .update({ role })
                    .eq('user_id', userId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('user_roles')
                    .insert([{ user_id: userId, role }]);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            toast.success("Permissão atualizada com sucesso!");
            setIsDialogOpen(false);
        },
        onError: () => {
            toast.error("Erro ao atualizar permissão");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            // Delete from user_roles first
            await supabase.from('user_roles').delete().eq('user_id', id);

            // Delete from profiles
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            toast.success("Usuário removido com sucesso!");
        },
        onError: () => {
            toast.error("Erro ao remover usuário");
        }
    });

    const filteredUsers = users?.filter((user) =>
        (user.full_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );

    const handleEditClick = (user: Profile) => {
        setSelectedUser(user);
        setSelectedRole(user.role || "user");
        setIsDialogOpen(true);
    };

    const handleSaveRole = () => {
        if (selectedUser) {
            updateRoleMutation.mutate({ userId: selectedUser.id, role: selectedRole });
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Usuários</h1>
                        <p className="text-muted-foreground">Gerencie os usuários e suas permissões</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar usuários..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <p className="text-center py-8 text-muted-foreground">Carregando usuários...</p>
                        ) : filteredUsers && filteredUsers.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Permissão</TableHead>
                                        <TableHead>Cadastro</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.full_name || "-"}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin'
                                                        ? 'bg-primary/10 text-primary'
                                                        : 'bg-secondary text-secondary-foreground'
                                                    }`}>
                                                    {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => handleEditClick(user)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            if (confirm("Tem certeza que deseja remover este usuário?")) {
                                                                deleteMutation.mutate(user.id);
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-center py-8 text-muted-foreground">
                                Nenhum usuário encontrado
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Editar Permissões</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Usuário</Label>
                                <div className="p-2 bg-secondary/50 rounded-md">
                                    <p className="font-medium">{selectedUser?.full_name}</p>
                                    <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Permissão</Label>
                                <Select
                                    value={selectedRole}
                                    onValueChange={(value: "admin" | "user") => setSelectedRole(value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">Usuário</SelectItem>
                                        <SelectItem value="admin">Administrador</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button onClick={handleSaveRole}>
                                    Salvar
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
