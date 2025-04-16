
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ProductSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const ProductSearch: React.FC<ProductSearchProps> = ({
  searchTerm,
  setSearchTerm,
}) => {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search products..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-8"
      />
    </div>
  );
};
