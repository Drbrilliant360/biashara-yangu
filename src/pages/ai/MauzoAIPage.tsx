import React from 'react';
import { Sparkles } from 'lucide-react';
import { MauzoAIChat } from '@/components/ai/MauzoAIChat';
import { useShop } from '@/context/ShopContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const MauzoAIPage: React.FC = () => {
  const { currentShop } = useShop();
  const navigate = useNavigate();

  if (!currentShop) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-[80vh]">
        <h2 className="text-2xl font-bold mb-4">No Shop Selected</h2>
        <p className="text-muted-foreground mb-6 text-center">
          Add a shop to start chatting with Mauzo AI.
        </p>
        <Button onClick={() => navigate('/shops/add')}>Add Your First Shop</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-biashara-primary" />
        <h1 className="text-2xl font-bold">Mauzo AI</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Your AI business assistant. Ask anything about your shop's stock, sales, top products and profits.
      </p>
      <MauzoAIChat />
    </div>
  );
};

export default MauzoAIPage;
