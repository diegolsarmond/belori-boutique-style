import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCartStore } from "@/stores/cartStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingCart, ArrowLeft, CreditCard, Loader2 } from "lucide-react";

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { items, clearCart, getTotalPrice } = useCartStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCepLoading, setIsCepLoading] = useState(false);

  const [customerData, setCustomerData] = useState({
    name: "",
    email: "",
    phone: "",
    docNumber: "", // CPF or CNPJ
    postalCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  const [shippingOptions, setShippingOptions] = useState<{
    id: string;
    name: string;
    price: number;
    days: number;
  }[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<string | null>(null);

  // If redirected back from MP with order number
  const orderParam = searchParams.get("order");

  useEffect(() => {
    if (items.length === 0 && !orderParam) {
      navigate("/");
    }
  }, [items, orderParam, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setCustomerData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (value: string) => {
    // Remove all non-numeric chars
    const phone = value.replace(/\D/g, "");

    // Auto-formatting (XX) XXXXX-XXXX
    let formattedPhone = phone;
    if (phone.length > 10) {
      formattedPhone = phone.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    } else if (phone.length > 5) {
      formattedPhone = phone.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    } else if (phone.length > 2) {
      formattedPhone = phone.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    }

    setCustomerData(prev => ({ ...prev, phone: formattedPhone }));
  };

  const handleDocNumberChange = (value: string) => {
    const doc = value.replace(/\D/g, "");
    let formattedDoc = doc;

    if (doc.length > 11) {
      // CNPJ: 00.000.000/0000-00
      formattedDoc = doc.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2}).*/, "$1.$2.$3/$4-$5");
    } else if (doc.length > 9) {
      // CPF: 000.000.000-00
      formattedDoc = doc.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2}).*/, "$1.$2.$3-$4");
    } else if (doc.length > 6) {
      formattedDoc = doc.replace(/^(\d{3})(\d{3})(\d{0,3})/, "$1.$2.$3");
    } else if (doc.length > 3) {
      formattedDoc = doc.replace(/^(\d{3})(\d{0,3})/, "$1.$2");
    }

    setCustomerData(prev => ({ ...prev, docNumber: formattedDoc }));
  }

  const calculateShipping = (cep: string) => {
    // Simulação de cálculo de frete
    // Em produção, isso viria do backend/transportadora

    // Frete Grátis para MG (exemplo de regra)
    const isMG = customerData.state === 'MG' || (cep.startsWith('3')); // Simplificação

    const options = [
      {
        id: 'standard',
        name: 'Entrega Padrão',
        price: isMG ? 0 : 15.90,
        days: isMG ? 3 : 7
      },
      {
        id: 'express',
        name: 'Entrega Expressa',
        price: isMG ? 10.00 : 25.90,
        days: isMG ? 1 : 3
      }
    ];

    setShippingOptions(options);
    // Auto select cheapest
    setSelectedShipping(options[0].id);
  };

  const handleCepChange = async (value: string) => {
    // Remove characters that are not numbers
    const cep = value.replace(/\D/g, "");

    // Mask 00000-000
    let formattedCep = cep;
    if (cep.length > 5) {
      formattedCep = cep.replace(/^(\d{5})(\d)/, "$1-$2");
    }

    setCustomerData(prev => ({ ...prev, postalCode: formattedCep }));

    if (cep.length === 8) {
      setIsCepLoading(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        if (data.erro) {
          toast.error("CEP não encontrado");
          return;
        }

        setCustomerData(prev => ({
          ...prev,
          street: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf,
        }));

        calculateShipping(cep);

        // Focus on number field
        const numberInput = document.getElementById("number");
        if (numberInput) {
          numberInput.focus();
        }

      } catch (error) {
        toast.error("Erro ao buscar endereço pelo CEP");
      } finally {
        setIsCepLoading(false);
      }
    } else {
      setShippingOptions([]);
      setSelectedShipping(null);
    }
  };

  const createOrderInDatabase = async (shippingCost: number) => {
    // 1. Generate Order Number
    const { data: orderNumber, error: orderNumberError } = await supabase.rpc('generate_order_number');
    if (orderNumberError) throw new Error('Erro ao gerar número do pedido');

    // 2. Create/Update Customer
    const { data: { user } } = await supabase.auth.getUser();
    let customerId = user?.id;

    // We can't always rely on user.id if it's a guest checkout, but for now let's assume we store customer data
    // If we want to store guest customers, we need a strategy. The current schema seems to use a profiles/customers table.
    // Let's try to upsert based on email into BeloriBH_customers

    const { data: customer, error: customerError } = await supabase
      .from('BeloriBH_customers')
      .upsert({
        email: customerData.email,
        full_name: customerData.name,
        phone: customerData.phone,
        address: customerData.street, // Mapping street to address field for legacy support or update schema
        city: customerData.city,
        state: customerData.state,
        postal_code: customerData.postalCode,
        // Add detailed fields if available in schema, otherwise they are lost or stored in address string
      }, { onConflict: 'email' })
      .select('id')
      .single();

    if (customerError) {
      console.error('Error upserting customer:', customerError);
      // Continue without customer link if failing? Better to fail.
      throw new Error('Erro ao salvar dados do cliente');
    }

    customerId = customer.id;

    // 3. Create Order
    const { data: order, error: orderError } = await supabase
      .from('BeloriBH_orders')
      .insert({
        order_number: orderNumber,
        customer_id: customerId,
        customer_name: customerData.name,
        customer_email: customerData.email,
        total_amount: getTotalPrice() + shippingCost,
        status: 'pending',
        payment_method: 'mercadopago',
        shipping_address: `${customerData.street}, ${customerData.number} ${customerData.complement || ''} - ${customerData.neighborhood}, ${customerData.city} - ${customerData.state}, ${customerData.postalCode}`,
      })
      .select()
      .single();

    if (orderError) throw new Error('Erro ao criar pedido no banco de dados');

    // 4. Create Order Items
    const orderItemsRecord = items.map(item => ({
      order_id: order.id,
      product_id: item.productId,
      product_title: item.name, // Ensure this column matches schema
      variant_id: item.cartItemId || item.productId, // Use specific variant ID if available
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from('BeloriBH_order_items')
      .insert(orderItemsRecord);

    if (itemsError) throw new Error('Erro ao salvar itens do pedido');

    return { orderNumber, orderId: order.id };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerData.name || !customerData.email || !customerData.phone || !customerData.docNumber || !customerData.postalCode || !customerData.street || !customerData.number || !customerData.city || !customerData.state) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    if (!selectedShipping) {
      toast.error("Por favor, selecione uma opção de frete");
      return;
    }

    setIsProcessing(true);

    try {
      const selectedShippingOption = shippingOptions.find(opt => opt.id === selectedShipping);
      const shippingCost = selectedShippingOption?.price || 0;

      // Create Order locally first
      const { orderNumber } = await createOrderInDatabase(shippingCost);

      const { data, error } = await supabase.functions.invoke('create-mercadopago-preference', {
        body: {
          items: [
            ...items.map(item => {
              let name = item.name;
              if (item.selectedColor) name += ` - Cor: ${item.selectedColor}`;
              if (item.selectedSize) name += ` - Tam: ${item.selectedSize}`;

              return {
                productId: item.productId,
                name: name,
                price: item.price,
                quantity: item.quantity,
                imageUrl: item.imageUrl,
              };
            }),
            {
              productId: 'shipping',
              name: `Frete - ${selectedShippingOption?.name}`,
              price: shippingCost,
              quantity: 1,
              imageUrl: null
            }
          ],
          customer: {
            ...customerData,
            address: `${customerData.street}, ${customerData.number} - ${customerData.neighborhood}`
          },
          orderNumber: orderNumber, // Pass the generated order number
          backUrls: {
            success: `${window.location.origin}/checkout/sucesso`,
            failure: `${window.location.origin}/checkout/falha`,
            pending: `${window.location.origin}/checkout/pendente`,
          },
        },
      });

      if (error) {
        throw new Error(error.message || 'Erro ao criar checkout');
      }

      if (data?.initPoint) {
        clearCart();
        window.location.href = data.initPoint;
      } else {
        throw new Error('URL de pagamento não disponível');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao processar checkout');
    } finally {
      setIsProcessing(false);
    }
  };

  const cartTotal = getTotalPrice();
  const shippingCost = shippingOptions.find(opt => opt.id === selectedShipping)?.price || 0;
  const finalTotal = cartTotal + shippingCost;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Customer Form */}
          <Card>
            <CardHeader>
              <CardTitle>Dados de Entrega</CardTitle>
              <CardDescription>
                Preencha seus dados para envio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="name">Nome completo *</Label>
                    <Input
                      id="name"
                      value={customerData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                      placeholder="Seu nome completo"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="docNumber">CPF / CNPJ *</Label>
                    <Input
                      id="docNumber"
                      value={customerData.docNumber}
                      onChange={(e) => handleDocNumberChange(e.target.value)}
                      required
                      placeholder="000.000.000-00"
                      maxLength={18}
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      value={customerData.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      required
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                    />
                  </div>

                  <div>
                    <Label htmlFor="postalCode">CEP *</Label>
                    <div className="relative">
                      <Input
                        id="postalCode"
                        value={customerData.postalCode}
                        onChange={(e) => handleCepChange(e.target.value)}
                        placeholder="00000-000"
                        maxLength={9}
                        required
                      />
                      {isCepLoading && (
                        <div className="absolute right-3 top-2.5">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="state">Estado *</Label>
                    <Select
                      value={customerData.state}
                      onValueChange={(value) => handleInputChange('state', value)}
                    >
                      <SelectTrigger id="state">
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent>
                        {["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"].map((uf) => (
                          <SelectItem key={uf} value={uf}>
                            {uf}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      value={customerData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="São Paulo"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label htmlFor="street">Rua/Avenida *</Label>
                    <Input
                      id="street"
                      value={customerData.street}
                      onChange={(e) => handleInputChange('street', e.target.value)}
                      placeholder="Nome da rua"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="number">Número *</Label>
                    <Input
                      id="number"
                      value={customerData.number}
                      onChange={(e) => handleInputChange('number', e.target.value)}
                      placeholder="123"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      value={customerData.complement}
                      onChange={(e) => handleInputChange('complement', e.target.value)}
                      placeholder="Apto 101"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label htmlFor="neighborhood">Bairro *</Label>
                    <Input
                      id="neighborhood"
                      value={customerData.neighborhood}
                      onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                      placeholder="Nome do bairro"
                      required
                    />
                  </div>
                </div>

                {shippingOptions.length > 0 && (
                  <div className="mt-6 border-t pt-4 animate-in fade-in">
                    <Label className="text-base font-semibold mb-3 block">Opções de Entrega</Label>
                    <div className="grid gap-3">
                      {shippingOptions.map(option => (
                        <div key={option.id}
                          className={`
                            relative flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all
                            ${selectedShipping === option.id ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'}
                          `}
                          onClick={() => setSelectedShipping(option.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`
                              w-4 h-4 rounded-full border border-primary flex items-center justify-center
                              ${selectedShipping === option.id ? 'bg-primary' : 'bg-transparent'}
                            `}>
                              {selectedShipping === option.id && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                            <div className="grid">
                              <span className="font-medium">{option.name}</span>
                              <span className="text-sm text-muted-foreground">até {option.days} dias úteis</span>
                            </div>
                          </div>
                          <span className="font-semibold">
                            {option.price === 0 ? 'Grátis' : option.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full mt-6"
                  size="lg"
                  disabled={isProcessing || !selectedShipping}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pagar com Mercado Pago
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Resumo do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.cartItemId || item.productId} className="flex gap-4">
                    <div className="w-16 h-16 bg-secondary/20 rounded-md overflow-hidden flex-shrink-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          Sem img
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <div className="text-sm text-muted-foreground">
                        {item.selectedColor && <span className="mr-2">Cor: {item.selectedColor}</span>}
                        {item.selectedSize && <span>Tam: {item.selectedSize}</span>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Qtd: {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold">
                      {(item.price * item.quantity).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </p>
                  </div>
                ))}

                <div className="border-t pt-4 mt-4 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>
                      {cartTotal.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Frete</span>
                    <span className={shippingCost === 0 ? "text-green-600" : ""}>
                      {shippingCost === 0 ? "Grátis" : shippingCost.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      {finalTotal.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
