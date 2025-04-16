
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Store } from 'lucide-react';
import { useShop } from '@/context/ShopContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const ShopsPage: React.FC = () => {
  const { shops, currentShop, deleteShop, switchShop } = useShop();
  const navigate = useNavigate();

  const handleDeleteShop = async (shopId: string) => {
    await deleteShop(shopId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Shops</h1>
        <Button 
          onClick={() => navigate('/shops/add')} 
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Add New Shop
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shops.length > 0 ? (
          shops.map((shop) => (
            <Card 
              key={shop.id} 
              className={`overflow-hidden ${
                currentShop?.id === shop.id ? 'border-2 border-biashara-primary' : ''
              }`}
            >
              <CardHeader className="bg-gradient-to-r from-biashara-primary to-biashara-secondary p-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-white truncate">{shop.name}</CardTitle>
                  {currentShop?.id === shop.id && (
                    <span className="bg-white text-biashara-primary text-xs px-2 py-1 rounded-full">
                      Current
                    </span>
                  )}
                </div>
                <CardDescription className="text-white/80">
                  {shop.location || 'No location set'}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Store size={16} />
                  <span>Shop ID: {shop.id.substring(5, 11)}</span>
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  Created: {new Date(shop.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between p-4 pt-0">
                {currentShop?.id !== shop.id ? (
                  <Button 
                    variant="outline" 
                    onClick={() => switchShop(shop.id)}
                  >
                    Switch to this shop
                  </Button>
                ) : (
                  <Button variant="outline" disabled>
                    Current shop
                  </Button>
                )}
                
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => navigate(`/shops/edit/${shop.id}`)}
                  >
                    <Edit size={16} />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                        <Trash2 size={16} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the shop "{shop.name}" and all its data. 
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-500 hover:bg-red-600"
                          onClick={() => handleDeleteShop(shop.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center p-8 bg-white rounded-lg border border-gray-200 shadow-sm">
            <Store size={64} className="text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">No shops yet</h3>
            <p className="text-gray-500 text-center mb-4">
              You haven't added any shops to your account yet.
              Get started by adding your first shop.
            </p>
            <Button 
              onClick={() => navigate('/shops/add')} 
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Add Your First Shop
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopsPage;
