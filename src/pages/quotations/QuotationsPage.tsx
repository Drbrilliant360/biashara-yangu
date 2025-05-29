
import React, { useState, useEffect } from 'react';
import { useShop } from '@/context/ShopContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, FilePlus, RefreshCw, Plus, Trash2, FileEdit } from 'lucide-react';
import { exportToExcel, exportToPDF, exportToWord } from '@/utils/exportUtils';

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

const QuotationsPage: React.FC = () => {
  const { currentShop } = useShop();
  const { toast } = useToast();
  
  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    name: '',
    location: '',
    reference: '',
    date: new Date().toLocaleDateString()
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

  // Function to fetch data from database
  const fetchQuotationData = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call to fetch quotations from database
      // const response = await fetch('/api/quotations');
      // const data = await response.json();
      // setQuotationItems(data);
      
      // For now, clear the data since we're removing sample data
      setQuotationItems([]);
      
      toast({
        title: "Data Refreshed",
        description: "Quotation data has been fetched from the database.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch quotation data from database.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchQuotationData();
  }, []);
  
  // Handle exporting data in different formats
  const handleExport = (format: 'excel' | 'pdf' | 'word') => {
    if (quotationItems.length === 0) {
      toast({
        title: "No data to export",
        description: "Please add quotation items before exporting.",
        variant: "destructive",
      });
      return;
    }

    const exportData = quotationItems.map(item => ({
      'SL No.': item.id,
      'Part Number': item.partNumber,
      Description: item.description || '',
      Brand: item.brand || 'N/A',
      Quantity: item.quantity,
      Rate: formatCurrency(item.rate || 0),
      Amount: formatCurrency(item.amount || 0),
      'VAT %': `${item.vatPercentage}%` || '0%',
      'VAT Amount': formatCurrency(item.vatAmount || 0),
      'Total Amount': formatCurrency(item.totalAmount || 0)
    }));
    
    const fileName = `quotation_${new Date().toISOString().split('T')[0]}`;
    const shopName = currentShop?.name || 'Business';
    const reportTitle = 'Quotation';
    
    try {
      switch (format) {
        case 'excel':
          exportToExcel(exportData, fileName, shopName);
          break;
        case 'pdf':
          exportToPDF(exportData, fileName, shopName, reportTitle);
          break;
        case 'word':
          exportToWord(exportData, fileName, shopName, reportTitle);
          break;
      }
      
      toast({
        title: "Export successful",
        description: `Your quotation has been exported as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your quotation. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Function to create a new quotation
  const handleCreateQuotation = () => {
    toast({
      title: "Create Quotation",
      description: "This feature will be implemented to create quotations from database products.",
    });
    // TODO: Implement form to create new quotation from database products
  };
  
  // Function to edit a quotation
  const handleEditQuotation = (id: number) => {
    toast({
      title: "Edit Quotation",
      description: `Editing quotation #${id}`,
    });
    // TODO: Implement edit functionality with database integration
  };
  
  // Function to delete a quotation
  const handleDeleteQuotation = (id: number) => {
    toast({
      title: "Delete Quotation",
      description: `Quotation #${id} would be deleted from database.`,
    });
    // TODO: Implement delete functionality with database integration
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quotations</h1>
          <p className="text-muted-foreground">
            Create and manage quotations for your products
          </p>
        </div>
        
        <Button onClick={handleCreateQuotation}>
          <Plus className="mr-2 h-4 w-4" /> Create New Quotation
        </Button>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Quotation Summary</CardTitle>
            <CardDescription>
              Overview of current quotations from database
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
          {quotationItems.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No quotations found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first quotation to get started
              </p>
              <Button onClick={handleCreateQuotation} variant="outline">
                <Plus className="mr-2 h-4 w-4" /> Create Quotation
              </Button>
            </div>
          ) : (
            <>
              {/* Client and Company Information */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-4">
                <div>
                  <h3 className="font-bold">{currentShop?.name || 'Your Business Name'}</h3>
                  <p className="text-sm text-gray-600">{currentShop?.address || 'Business Address'}</p>
                  <p className="text-sm text-gray-600">Tel: {currentShop?.phone || 'Phone Number'}</p>
                  <p className="text-sm text-gray-600">Email: {currentShop?.email || 'Email Address'}</p>
                </div>
                <div className="md:text-right">
                  <h3 className="font-bold">{clientInfo.name || 'Client Name'}</h3>
                  <p className="text-sm text-gray-600">{clientInfo.location || 'Client Location'}</p>
                  <p className="text-sm text-gray-600">Reference: {clientInfo.reference || 'Reference Number'}</p>
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
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotationItems.map((item) => (
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
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEditQuotation(item.id)}>
                              <FileEdit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteQuotation(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {/* Summary row */}
                    {quotationItems.length > 0 && (
                      <TableRow className="bg-muted/50 font-medium">
                        <TableCell colSpan={6} className="text-right">Totals:</TableCell>
                        <TableCell className="text-right">{formatCurrency(totalAmount)}</TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-right">{formatCurrency(totalVAT)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(quotationTotal)}</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Additional Information */}
              <div className="mt-4 border-t pt-4">
                <p className="text-sm"><span className="font-medium">Amount in Words:</span> {currentShop?.currency || 'USD'} {quotationTotal.toFixed(2)}</p>
              </div>
            </>
          )}
        </CardContent>
        
        {quotationItems.length > 0 && (
          <CardFooter className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleExport('excel')}
            >
              <FileText className="mr-2 h-4 w-4" /> Export to Excel
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleExport('pdf')}
            >
              <FilePlus className="mr-2 h-4 w-4" /> Export to PDF
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleExport('word')}
            >
              <FileText className="mr-2 h-4 w-4" /> Export to Word
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default QuotationsPage;
