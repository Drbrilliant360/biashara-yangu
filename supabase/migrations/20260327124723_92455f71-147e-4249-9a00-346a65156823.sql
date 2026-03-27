
-- Create triggers for automatic stock updates (functions already exist)
CREATE TRIGGER update_stock_after_sale_trigger
  AFTER INSERT ON public.sale_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stock_after_sale();

CREATE TRIGGER update_stock_after_purchase_trigger
  AFTER INSERT ON public.purchase_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stock_after_purchase();
