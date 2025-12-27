import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CheckCircle, XCircle, Clock, Home, Package } from "lucide-react";

type ResultType = 'sucesso' | 'falha' | 'pendente';

interface ResultConfig {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const resultConfigs: Record<ResultType, ResultConfig> = {
  sucesso: {
    icon: <CheckCircle className="w-16 h-16 text-green-500" />,
    title: "Pagamento Aprovado!",
    description: "Seu pagamento foi processado com sucesso. Você receberá um email com os detalhes do pedido.",
    color: "text-green-500",
  },
  falha: {
    icon: <XCircle className="w-16 h-16 text-destructive" />,
    title: "Pagamento Não Aprovado",
    description: "Infelizmente seu pagamento não foi aprovado. Tente novamente ou escolha outra forma de pagamento.",
    color: "text-destructive",
  },
  pendente: {
    icon: <Clock className="w-16 h-16 text-yellow-500" />,
    title: "Pagamento Pendente",
    description: "Seu pagamento está sendo processado. Você receberá uma notificação quando for confirmado.",
    color: "text-yellow-500",
  },
};

export default function CheckoutResult({ type }: { type: ResultType }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get("order") || searchParams.get("external_reference");
  
  const config = resultConfigs[type];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              {config.icon}
            </div>
            <CardTitle className={`text-2xl ${config.color}`}>
              {config.title}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {config.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {orderNumber && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Número do pedido</p>
                <p className="text-lg font-mono font-bold">{orderNumber}</p>
              </div>
            )}
            
            <div className="flex flex-col gap-2 pt-4">
              <Button onClick={() => navigate("/")} className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Voltar à Loja
              </Button>
              
              {type === 'falha' && (
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/checkout")}
                  className="w-full"
                >
                  Tentar Novamente
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
