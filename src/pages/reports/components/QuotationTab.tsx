
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, FilePlus, Table as TableIcon } from 'lucide-react';
import { useShop } from '@/context/ShopContext';

// Sample quotation data - in a real app, this would come from an API
const mockQuotationItems = [
  { id: 'P001', name: 'Laptop', description: 'High-performance laptop', brand: 'TechBrand', quantity: 2, price: 75000, amount: 150000, vat: 15000, total: 165000 },
  { id: 'P002', name: 'Monitor', description: '24-inch 4K monitor', brand: 'DisplayPro', quantity: 3, price: 25000, amount: 75000, vat: 7500, total: 82500 },
  { id: 'P003', name: 'Keyboard', description: 'Mechanical keyboard', brand: 'TypeMaster', quantity: 5, price: 5000, amount: 25000, vat: 2500, total: 27500 },
  { id: 'P004', name: 'Mouse', description: 'Wireless optical mouse', brand: 'PointPro', quantity: 5, price: 2000, amount: 10000, vat: 1000, total: 11000 },
  { id: 'P005', name: 'Headset', description: 'Noise-cancelling headset', brand: 'AudioTech', quantity: 2, price: 8000, amount: 16000, vat: 1600, total: 17600 },
];

interface QuotationTabProps {
  handleExport: (format: 'excel' | 'pdf' | 'word', reportType: string) => void;
}

const QuotationTab: React.FC<QuotationTabProps> = ({ handleExport }) => {
  const { currentShop } = useShop();
  const [quotationItems] = useState(mockQuotationItems);
  
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currentShop?.currency || 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  // Calculate total amounts
  const totalAmount = quotationItems.reduce((sum, item) => sum + item.amount, 0);
  const totalVAT = quotationItems.reduce((sum, item) => sum + item.vat, 0);
  const quotationTotal = quotationItems.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Quotation Summary</CardTitle>
          <CardDescription>
            Overview of current quotations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>VAT</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotationItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.id}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.brand}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatCurrency(item.price)}</TableCell>
                    <TableCell>{formatCurrency(item.amount)}</TableCell>
                    <TableCell>{formatCurrency(item.vat)}</TableCell>
                    <TableCell>{formatCurrency(item.total)}</TableCell>
                  </TableRow>
                ))}
                {/* Summary row */}
                <TableRow className="bg-muted/50 font-medium">
                  <TableCell colSpan={5} className="text-right">Totals:</TableCell>
                  <TableCell>{formatCurrency(totalAmount)}</TableCell>
                  <TableCell>{formatCurrency(totalVAT)}</TableCell>
                  <TableCell>{formatCurrency(quotationTotal)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleExport('excel', 'quotations')}
          >
            <FileText className="mr-2 h-4 w-4" /> Export to Excel
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleExport('pdf', 'quotations')}
          >
            <FilePlus className="mr-2 h-4 w-4" /> Export to PDF
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleExport('word', 'quotations')}
          >
            <TableIcon className="mr-2 h-4 w-4" /> Export to Word
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default QuotationTab;
