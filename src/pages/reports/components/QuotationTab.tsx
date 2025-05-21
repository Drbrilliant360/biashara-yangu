
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, FilePlus, Table as TableIcon, RefreshCw } from 'lucide-react';
import { useShop } from '@/context/ShopContext';
import { useToast } from '@/hooks/use-toast';

// Sample quotation data - in a real app, this would come from an API call
const mockQuotationItems = [
  { id: 1, partNumber: '0032605963', description: 'Engine Parts', brand: 'MERCEDES', quantity: 1, rate: 5600.00, amount: 5600.00, vatPercentage: 5, vatAmount: 280.00, totalAmount: 5880.00 },
  { id: 4, partNumber: '0292506201', description: 'CLUTCH KIT DOUBLE', brand: 'MERCEDES', quantity: 4, rate: 4100.00, amount: 16400.00, vatPercentage: 5, vatAmount: 820.00, totalAmount: 17220.00 },
  { id: 7, partNumber: '0292508901', description: 'CLUTCH KIT SINGLE', brand: 'SACHS', quantity: 4, rate: 2025.00, amount: 8100.00, vatPercentage: 5, vatAmount: 405.00, totalAmount: 8505.00 },
  { id: 10, partNumber: '1878007072', description: 'Brake Pads', brand: 'SACHS', quantity: 5, rate: 765.00, amount: 3825.00, vatPercentage: 5, vatAmount: 191.25, totalAmount: 4016.25 },
  { id: 12, partNumber: '0414799054', description: 'Sensors', brand: 'BOSCH', quantity: 6, rate: 675.00, amount: 4050.00, vatPercentage: 5, vatAmount: 202.50, totalAmount: 4252.50 },
];

// Type definition for a quotation item
interface QuotationItem {
  id: number;
  partNumber: string;
  description: string;
  brand: string;
  quantity: number;
  rate: number;
  amount: number;
  vatPercentage: number;
  vatAmount: number;
  totalAmount: number;
}

// Type definition for customer/client information
interface ClientInfo {
  name: string;
  location: string;
  reference: string;
  date: string;
}

interface QuotationTabProps {
  handleExport: (format: 'excel' | 'pdf' | 'word', reportType: string) => void;
}

const QuotationTab: React.FC<QuotationTabProps> = ({ handleExport }) => {
  const { currentShop } = useShop();
  const { toast } = useToast();
  
  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>(mockQuotationItems);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    name: 'MR.JACK',
    location: 'TANZANIA',
    reference: 'PI/5092024/2024',
    date: '05.09.2024'
  });
  
  // Format currency based on shop settings
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currentShop?.currency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };
  
  // Calculate total amounts
  const totalAmount = quotationItems.reduce((sum, item) => sum + item.amount, 0);
  const totalVAT = quotationItems.reduce((sum, item) => sum + item.vatAmount, 0);
  const quotationTotal = quotationItems.reduce((sum, item) => sum + item.totalAmount, 0);

  // Function to simulate fetching data from database
  const fetchQuotationData = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would be an API call
      // For now, we'll simulate a delay and use the mock data
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Simulate successful data fetch
      toast({
        title: "Data Refreshed",
        description: "Quotation data has been updated from the database.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch quotation data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Quotation Summary</CardTitle>
            <CardDescription>
              Overview of current quotations
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchQuotationData}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> 
            {isLoading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </CardHeader>
        
        <CardContent>
          {/* Client and Company Information */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-4">
            <div>
              <h3 className="font-bold">{currentShop?.name || 'ROYAL AUTO PARTS CO. LLC'}</h3>
              <p className="text-sm text-gray-600">{currentShop?.address || 'Dubai - UAE'}</p>
              <p className="text-sm text-gray-600">Tel: +971 50 4534010</p>
              <p className="text-sm text-gray-600">Email: info@company.com</p>
            </div>
            <div className="md:text-right">
              <h3 className="font-bold">{clientInfo.name}</h3>
              <p className="text-sm text-gray-600">{clientInfo.location}</p>
              <p className="text-sm text-gray-600">Reference: {clientInfo.reference}</p>
              <p className="text-sm text-gray-600">Date: {clientInfo.date}</p>
            </div>
          </div>
          
          {/* Quotation Items Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">SL No.</TableHead>
                  <TableHead>Part Number</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead className="text-right">Qty.</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">VAT %</TableHead>
                  <TableHead className="text-right">VAT Amount</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotationItems.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.id}</TableCell>
                    <TableCell>{item.partNumber}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.brand}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.rate)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                    <TableCell className="text-right">{item.vatPercentage}%</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.vatAmount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.totalAmount)}</TableCell>
                  </TableRow>
                ))}
                
                {/* Summary row */}
                <TableRow className="bg-muted/50 font-medium">
                  <TableCell colSpan={6} className="text-right">Totals:</TableCell>
                  <TableCell className="text-right">{formatCurrency(totalAmount)}</TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-right">{formatCurrency(totalVAT)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(quotationTotal)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          
          {/* Additional Information */}
          <div className="mt-4 border-t pt-4">
            <p className="text-sm"><span className="font-medium">Amount in Words:</span> {currentShop?.currency || 'USD'} {quotationTotal.toFixed(2)}</p>
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
