import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Download, ArrowLeft } from "lucide-react";
import { PageHead } from "@/components/seo/PageHead";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

type Item = { description: string; quantity: number; price: number };
type Template = "classic" | "modern" | "minimal";

const currencies = ["TZS", "USD", "EUR", "KES", "UGX", "GBP"];

const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function InvoiceGeneratorPage() {
  const [template, setTemplate] = useState<Template>("modern");
  const [brandColor, setBrandColor] = useState("#0000FF");
  const [currency, setCurrency] = useState("TZS");
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");

  const [fromName, setFromName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [fromPhone, setFromPhone] = useState("");
  const [fromAddress, setFromAddress] = useState("");

  const [toName, setToName] = useState("");
  const [toEmail, setToEmail] = useState("");
  const [toPhone, setToPhone] = useState("");
  const [toAddress, setToAddress] = useState("");

  const [items, setItems] = useState<Item[]>([{ description: "", quantity: 1, price: 0 }]);
  const [taxRate, setTaxRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("Thank you for your business!");

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.quantity * i.price, 0), [items]);
  const taxAmount = useMemo(() => (subtotal - discount) * (taxRate / 100), [subtotal, discount, taxRate]);
  const total = subtotal - discount + taxAmount;

  const updateItem = (idx: number, patch: Partial<Item>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const addItem = () => setItems((prev) => [...prev, { description: "", quantity: 1, price: 0 }]);

  const hexToRgb = (hex: string): [number, number, number] => {
    const h = hex.replace("#", "");
    const bigint = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
  };

  const generatePDF = () => {
    if (!fromName || !toName) {
      toast.error("Please fill in your business and customer name");
      return;
    }
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const [r, g, b] = hexToRgb(brandColor);

    // --- Header ---
    if (template === "modern") {
      doc.setFillColor(r, g, b);
      doc.rect(0, 0, pageW, 110, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(28);
      doc.text("INVOICE", 40, 55);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(fromName, 40, 78);
      if (fromAddress) doc.text(fromAddress, 40, 92);
      // right side
      doc.setFontSize(10);
      doc.text(`# ${invoiceNumber}`, pageW - 40, 55, { align: "right" });
      doc.text(`Issued: ${issueDate}`, pageW - 40, 70, { align: "right" });
      if (dueDate) doc.text(`Due: ${dueDate}`, pageW - 40, 85, { align: "right" });
    } else if (template === "classic") {
      doc.setTextColor(r, g, b);
      doc.setFont("times", "bold");
      doc.setFontSize(32);
      doc.text("INVOICE", 40, 60);
      doc.setDrawColor(r, g, b);
      doc.setLineWidth(2);
      doc.line(40, 72, pageW - 40, 72);
      doc.setTextColor(40, 40, 40);
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      doc.text(fromName, 40, 95);
      if (fromAddress) doc.text(fromAddress, 40, 110);
      doc.text(`Invoice #: ${invoiceNumber}`, pageW - 40, 95, { align: "right" });
      doc.text(`Date: ${issueDate}`, pageW - 40, 110, { align: "right" });
      if (dueDate) doc.text(`Due: ${dueDate}`, pageW - 40, 125, { align: "right" });
    } else {
      // minimal
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("Invoice", 40, 55);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text(fromName.toUpperCase(), pageW - 40, 45, { align: "right" });
      doc.setTextColor(80, 80, 80);
      doc.text(`${invoiceNumber} · ${issueDate}`, pageW - 40, 60, { align: "right" });
      if (dueDate) doc.text(`Due ${dueDate}`, pageW - 40, 74, { align: "right" });
      doc.setDrawColor(230, 230, 230);
      doc.line(40, 90, pageW - 40, 90);
    }

    // --- Parties ---
    const partiesY = template === "modern" ? 140 : template === "classic" ? 155 : 115;
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("FROM", 40, partiesY);
    doc.text("BILL TO", pageW / 2, partiesY);
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const fromLines = [fromName, fromAddress, fromPhone, fromEmail].filter(Boolean);
    const toLines = [toName, toAddress, toPhone, toEmail].filter(Boolean);
    fromLines.forEach((l, i) => doc.text(l, 40, partiesY + 16 + i * 14));
    toLines.forEach((l, i) => doc.text(l, pageW / 2, partiesY + 16 + i * 14));

    // --- Items table ---
    const tableStartY = partiesY + 16 + Math.max(fromLines.length, toLines.length) * 14 + 20;
    const headStyles =
      template === "minimal"
        ? { fillColor: [245, 245, 245] as [number, number, number], textColor: [30, 30, 30] as [number, number, number], fontStyle: "bold" as const }
        : { fillColor: [r, g, b] as [number, number, number], textColor: [255, 255, 255] as [number, number, number], fontStyle: "bold" as const };

    autoTable(doc, {
      startY: tableStartY,
      head: [["Description", "Qty", `Unit Price (${currency})`, `Amount (${currency})`]],
      body: items.map((it) => [
        it.description || "-",
        it.quantity.toString(),
        fmt(it.price),
        fmt(it.quantity * it.price),
      ]),
      styles: { fontSize: 10, cellPadding: 8 },
      headStyles,
      columnStyles: {
        1: { halign: "right", cellWidth: 50 },
        2: { halign: "right", cellWidth: 100 },
        3: { halign: "right", cellWidth: 100 },
      },
      theme: template === "classic" ? "grid" : template === "minimal" ? "plain" : "striped",
      margin: { left: 40, right: 40 },
    });

    // --- Totals ---
    // @ts-ignore
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    const totalsX = pageW - 40;
    const labelX = totalsX - 160;
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text("Subtotal", labelX, finalY);
    doc.text(`${currency} ${fmt(subtotal)}`, totalsX, finalY, { align: "right" });
    let y = finalY + 16;
    if (discount > 0) {
      doc.text("Discount", labelX, y);
      doc.text(`- ${currency} ${fmt(discount)}`, totalsX, y, { align: "right" });
      y += 16;
    }
    if (taxRate > 0) {
      doc.text(`Tax (${taxRate}%)`, labelX, y);
      doc.text(`${currency} ${fmt(taxAmount)}`, totalsX, y, { align: "right" });
      y += 16;
    }
    doc.setDrawColor(200, 200, 200);
    doc.line(labelX, y, totalsX, y);
    y += 18;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(r, g, b);
    doc.text("TOTAL", labelX, y);
    doc.text(`${currency} ${fmt(total)}`, totalsX, y, { align: "right" });

    // --- Notes ---
    if (notes) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text("NOTES", 40, y + 40);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      const wrapped = doc.splitTextToSize(notes, pageW - 80);
      doc.text(wrapped, 40, y + 56);
    }

    // --- Footer ---
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text("Generated with Biashara Yangu · biashara-yangu.lovable.app", pageW / 2, pageH - 20, { align: "center" });

    doc.save(`${invoiceNumber}.pdf`);
    toast.success("Invoice downloaded");
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <PageHead
        title="Free Invoice Generator · Download PDF"
        description="Create professional invoices in seconds. Choose a template, add your items, and download a PDF invoice — free, no signup required."
        path="/invoice-generator"
      />
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <h1 className="text-lg font-semibold">Invoice Generator</h1>
          <Button onClick={generatePDF} size="sm">
            <Download className="h-4 w-4 mr-2" /> Download PDF
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid gap-6 lg:grid-cols-3">
        {/* Left: form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Template & Branding</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Template</Label>
                <Select value={template} onValueChange={(v) => setTemplate(v as Template)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Brand color</Label>
                <Input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="h-10 p-1" />
              </div>
              <div>
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Invoice details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><Label>Invoice #</Label><Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} /></div>
              <div><Label>Issue date</Label><Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} /></div>
              <div><Label>Due date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">From (your business)</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Business name" value={fromName} onChange={(e) => setFromName(e.target.value)} />
                <Input placeholder="Email" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} />
                <Input placeholder="Phone" value={fromPhone} onChange={(e) => setFromPhone(e.target.value)} />
                <Textarea placeholder="Address" value={fromAddress} onChange={(e) => setFromAddress(e.target.value)} rows={2} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Bill to (customer)</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Customer name" value={toName} onChange={(e) => setToName(e.target.value)} />
                <Input placeholder="Email" value={toEmail} onChange={(e) => setToEmail(e.target.value)} />
                <Input placeholder="Phone" value={toPhone} onChange={(e) => setToPhone(e.target.value)} />
                <Textarea placeholder="Address" value={toAddress} onChange={(e) => setToAddress(e.target.value)} rows={2} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Items</CardTitle>
              <Button size="sm" variant="outline" onClick={addItem}><Plus className="h-4 w-4 mr-1" /> Add item</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <Input className="col-span-12 sm:col-span-6" placeholder="Description" value={item.description} onChange={(e) => updateItem(idx, { description: e.target.value })} />
                  <Input className="col-span-4 sm:col-span-2" type="number" min={0} placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })} />
                  <Input className="col-span-6 sm:col-span-3" type="number" min={0} step="0.01" placeholder="Price" value={item.price} onChange={(e) => updateItem(idx, { price: Number(e.target.value) })} />
                  <Button variant="ghost" size="icon" className="col-span-2 sm:col-span-1" onClick={() => removeItem(idx)} disabled={items.length === 1}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Totals & notes</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Discount ({currency})</Label><Input type="number" min={0} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} /></div>
              <div><Label>Tax rate (%)</Label><Input type="number" min={0} value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} /></div>
              <div className="sm:col-span-2"><Label>Notes</Label><Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
            </CardContent>
          </Card>
        </div>

        {/* Right: summary */}
        <aside className="lg:sticky lg:top-20 h-fit">
          <Card>
            <CardHeader><CardTitle className="text-base">Summary</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{currency} {fmt(subtotal)}</span></div>
              {discount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>- {currency} {fmt(discount)}</span></div>}
              {taxRate > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tax ({taxRate}%)</span><span>{currency} {fmt(taxAmount)}</span></div>}
              <div className="flex justify-between border-t pt-2 font-semibold text-base" style={{ color: brandColor }}>
                <span>Total</span><span>{currency} {fmt(total)}</span>
              </div>
              <Button className="w-full mt-4" onClick={generatePDF}>
                <Download className="h-4 w-4 mr-2" /> Download PDF
              </Button>
              <p className="text-xs text-muted-foreground text-center pt-2">Free · No signup required</p>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
}
