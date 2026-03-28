
import React, { useState, useEffect } from 'react';
import { useShop } from '@/context/ShopContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, FilePlus, RefreshCw, Plus, Trash2, FileEdit, Printer } from 'lucide-react';
import { exportToExcel, exportToPDF, exportToWord } from '@/utils/exportUtils';
import { supabase } from '@/integrations/supabase/client';
import { Quotation, QuotationItem } from '@/types';
import CreateQuotationDialog from '@/components/quotations/CreateQuotationDialog';

interface QuotationWithItems extends Quotation {
  quotation_items: QuotationItem[];
}

const QuotationsPage: React.FC = () => {
  const { currentShop } = useShop();
  const { toast } = useToast();
  
  const [quotations, setQuotations] = useState<QuotationWithItems[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  // Format currency based on shop settings
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currentShop?.currency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Function to fetch quotations from database
  const fetchQuotations = async (showToast = false) => {
    if (!currentShop) {
      setQuotations([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('quotations')
        .select(`
          *,
          quotation_items (*)
        `)
        .eq('shop_id', currentShop.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setQuotations(data || []);
      
      if (showToast) {
        toast({
          title: "Data Refreshed",
          description: "Quotation data has been fetched from the database.",
        });
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') return;
      console.error('Error fetching quotations:', error);
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
    fetchQuotations();
  }, [currentShop]);
  
  // Handle exporting data in different formats
  const handleExport = (format: 'excel' | 'pdf' | 'word', quotation?: QuotationWithItems) => {
    const dataToExport = quotation ? [quotation] : quotations;
    
    if (dataToExport.length === 0) {
      toast({
        title: "No data to export",
        description: "Please create quotations before exporting.",
        variant: "destructive",
      });
      return;
    }

    // Flatten quotation items for export
    const exportData = dataToExport.flatMap(q => 
      q.quotation_items.map((item, index) => ({
        'Quotation ID': q.id,
        'Quotation Number': q.quotation_number,
        'Customer': q.customer_name,
        'Date': new Date(q.created_at).toLocaleDateString(),
        'Line': index + 1,
        'Product': item.product_name,
        'Quantity': item.quantity,
        'Unit Price': formatCurrency(item.unit_price),
        'Discount': formatCurrency(item.discount),
        'Total': formatCurrency(item.total),
      }))
    );
    
    const fileName = quotation 
      ? `quotation_${quotation.id}_${new Date().toISOString().split('T')[0]}`
      : `quotations_${new Date().toISOString().split('T')[0]}`;
    const shopName = currentShop?.name || 'Business';
    const reportTitle = quotation ? `Quotation - ${quotation.customer_name}` : 'Quotations';
    
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
  
  // Function to edit a quotation
  const handleEditQuotation = (id: string) => {
    toast({
      title: "Edit Quotation",
      description: `Edit functionality for quotation ${id} will be implemented soon.`,
    });
    // TODO: Implement edit functionality
  };
  
  // Function to delete a quotation
  const handleDeleteQuotation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('quotations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Quotation deleted successfully.",
      });

      fetchQuotations(); // Refresh the list
    } catch (error) {
      console.error('Error deleting quotation:', error);
      toast({
        title: "Error",
        description: "Failed to delete quotation.",
        variant: "destructive",
      });
    }
  };

  // Function to print a single quotation
  const handlePrintQuotation = (quotation: QuotationWithItems) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Quotation - ${quotation.customer_name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .company-info h2 { margin: 0; color: #333; }
            .client-info { text-align: right; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .totals { text-align: right; margin-top: 20px; }
            .totals div { margin: 5px 0; }
            .grand-total { font-weight: bold; font-size: 1.2em; }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              <h2>${currentShop?.name || 'Your Business Name'}</h2>
              <p>${currentShop?.location || 'Business Address'}</p>
              <p>Tel: ${currentShop?.phone || 'Phone Number'}</p>
              <p>Email: ${currentShop?.email || 'Email Address'}</p>
            </div>
            <div class="client-info">
              <h3>${quotation.customer_name}</h3>
              <p>${quotation.customer_phone || ''}</p>
              <p>${quotation.customer_email || ''}</p>
              <p>Quotation #: ${quotation.quotation_number}</p>
              <p>Date: ${new Date(quotation.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Line</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Discount</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${quotation.quotation_items.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.product_name}</td>
                  <td>${item.quantity}</td>
                  <td>${formatCurrency(item.unit_price)}</td>
                  <td>${formatCurrency(item.discount)}</td>
                  <td>${formatCurrency(item.total)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totals">
            <div>Subtotal: ${formatCurrency(quotation.subtotal)}</div>
            <div>Discount: ${formatCurrency(quotation.discount)}</div>
            <div>Tax: ${formatCurrency(quotation.tax)}</div>
            <div class="grand-total">Grand Total: ${formatCurrency(quotation.total)}</div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Quotations</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Create and manage quotations for your products
          </p>
        </div>
        
        <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Create New Quotation
        </Button>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg md:text-xl">Quotation Management</CardTitle>
              <CardDescription className="text-sm">
                Manage all your quotations from the database
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => fetchQuotations(true)}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> 
              {isLoading ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {quotations.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No quotations found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first quotation to get started
              </p>
              <Button onClick={() => setCreateDialogOpen(true)} variant="outline">
                <Plus className="mr-2 h-4 w-4" /> Create Quotation
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {quotations.map((quotation) => (
                <Card key={quotation.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div>
                        <CardTitle className="text-lg">{quotation.customer_name}</CardTitle>
                        <CardDescription className="text-sm">
                          Date: {new Date(quotation.created_at).toLocaleDateString()} | 
                          Quotation #: {quotation.quotation_number}
                        </CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrintQuotation(quotation)}
                        >
                          <Printer className="mr-2 h-4 w-4" />
                          Print
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExport('pdf', quotation)}
                        >
                          <FilePlus className="mr-2 h-4 w-4" />
                          PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditQuotation(quotation.id)}
                        >
                          <FileEdit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteQuotation(quotation.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {/* Items Table - Mobile Responsive */}
                    <div className="overflow-x-auto">
                      <Table className="text-sm">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[180px]">Product</TableHead>
                            <TableHead className="text-right min-w-[60px]">Qty</TableHead>
                            <TableHead className="text-right min-w-[80px] hidden md:table-cell">Unit Price</TableHead>
                            <TableHead className="text-right min-w-[80px] hidden sm:table-cell">Discount</TableHead>
                            <TableHead className="text-right min-w-[80px]">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {quotation.quotation_items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.product_name}</TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                              <TableCell className="text-right hidden md:table-cell">
                                {formatCurrency(item.unit_price)}
                              </TableCell>
                              <TableCell className="text-right hidden sm:table-cell">
                                {formatCurrency(item.discount)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(item.total)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {/* Totals */}
                    <div className="mt-4 border-t pt-4">
                      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-8 text-sm">
                        <div>Subtotal: <span className="font-medium">{formatCurrency(quotation.subtotal)}</span></div>
                        <div>Discount: <span className="font-medium">{formatCurrency(quotation.discount)}</span></div>
                        <div>Tax: <span className="font-medium">{formatCurrency(quotation.tax)}</span></div>
                        <div className="text-lg font-bold">Total: <span>{formatCurrency(quotation.total)}</span></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
        
        {quotations.length > 0 && (
          <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleExport('excel')}
              className="w-full sm:w-auto"
            >
              <FileText className="mr-2 h-4 w-4" /> Export All to Excel
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleExport('pdf')}
              className="w-full sm:w-auto"
            >
              <FilePlus className="mr-2 h-4 w-4" /> Export All to PDF
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleExport('word')}
              className="w-full sm:w-auto"
            >
              <FileText className="mr-2 h-4 w-4" /> Export All to Word
            </Button>
          </CardFooter>
        )}
      </Card>

      <CreateQuotationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onQuotationCreated={fetchQuotations}
      />
    </div>
  );
};

export default QuotationsPage;
