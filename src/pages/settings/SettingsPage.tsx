import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/context/AuthContext';
import { useShop } from '@/context/ShopContext';
import { Settings, Moon, Sun, Globe, UserCircle, Wallet, CreditCard } from 'lucide-react';
import { useLanguage } from "@/context/LanguageContext";
import { PaymentDialog } from '@/components/billing/PaymentDialog';
import { useBilling } from '@/hooks/useBilling';

interface UIUser {
  phone?: string;
}

interface UIShop {
  taxId?: string;
  address?: string;
  receiptMessage?: string;
}

const SettingsPage: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentShop } = useShop();
  const { language, setLanguage, t } = useLanguage();
  const { daysRemaining, isPaymentDialogOpen, setIsPaymentDialogOpen, subscriptionStatus } = useBilling();

  const [activeTab, setActiveTab] = useState("general");
  const [darkMode, setDarkMode] = useState(false);
  const [currency, setCurrency] = useState(currentShop?.currency || "USD");
  const [notifications, setNotifications] = useState(true);
  const [lowStockAlert, setLowStockAlert] = useState(true);
  const [lowStockThreshold, setLowStockThreshold] = useState("10");

  const handleSaveGeneral = () => {
    toast({
      title: t("settings saved"),
      description: t("your general settings have been updated successfully"),
    });
  };

  const handleSaveAppearance = () => {
    toast({
      title: t("appearance updated"),
      description: `${t("theme changed to")} ${darkMode ? t('dark') : t('light')}.`,
    });
  };

  const handleSaveNotifications = () => {
    toast({
      title: t("notification settings saved"),
      description: t("your notification preferences have been updated"),
    });
  };

  return (
    <div className="container max-w-5xl px-4 py-6">
      <div className="mb-8 flex items-center">
        <Settings className="h-6 w-6 mr-2" />
        <h1 className="text-3xl font-bold tracking-tight">{t("settings")}</h1>
      </div>

      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 md:grid-cols-6">
          <TabsTrigger value="general">{t("general")}</TabsTrigger>
          <TabsTrigger value="appearance">{t("appearance")}</TabsTrigger>
          <TabsTrigger value="notifications">{t("notifications")}</TabsTrigger>
          <TabsTrigger value="profile">{t("profile")}</TabsTrigger>
          <TabsTrigger value="business">{t("business")}</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("general settings")}</CardTitle>
              <CardDescription>
                {t("configure basic settings")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">{t("language")}</Label>
                <Select value={language} onValueChange={val => setLanguage(val as "english" | "swahili")}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("select a language")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="swahili">Kiswahili</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currency">{t("currency")}</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("select a currency")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KES">KES (Kenyan Shilling)</SelectItem>
                    <SelectItem value="UGX">UGX (Ugandan Shilling)</SelectItem>
                    <SelectItem value="TZS">TZS (Tanzanian Shilling)</SelectItem>
                    <SelectItem value="USD">USD (US Dollar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSaveGeneral}>{t("save changes")}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how Biashara Yangu looks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark themes.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Sun className="h-4 w-4" />
                  <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                  <Moon className="h-4 w-4" />
                </div>
              </div>

              <Button onClick={handleSaveAppearance}>{t("save changes")}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Manage notification preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />
                <Label htmlFor="notifications">Enable notifications</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch id="low-stock" checked={lowStockAlert} onCheckedChange={setLowStockAlert} />
                <Label htmlFor="low-stock">Low stock alerts</Label>
              </div>

              {lowStockAlert && (
                <div className="space-y-2">
                  <Label htmlFor="threshold">Low stock threshold</Label>
                  <Input 
                    id="threshold" 
                    type="number" 
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                  />
                </div>
              )}

              <Button onClick={handleSaveNotifications}>{t("save changes")}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Update your personal information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-biashara-primary text-white rounded-full p-4">
                  <UserCircle className="h-8 w-8" />
                </div>
                <div>
                  <p className="font-medium text-lg">{user?.name || "User"}</p>
                  <p className="text-muted-foreground">{user?.email || "No email"}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue={user?.name || ""} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user?.email || ""} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" defaultValue="" placeholder="Add phone number" />
              </div>
              
              <Button>Update Profile</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Settings</CardTitle>
              <CardDescription>
                Configure your business details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentShop ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="business-name">Business Name</Label>
                    <Input id="business-name" defaultValue={currentShop.name} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tax-id">Tax ID/Registration Number</Label>
                    <Input id="tax-id" placeholder="Add tax ID/registration number" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="business-address">Address</Label>
                    <Input id="business-address" placeholder="Add business address" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="receipt-message">Receipt Footer Message</Label>
                    <Input id="receipt-message" defaultValue="Thank you for your business!" />
                  </div>
                  
                  <Button>Save Business Info</Button>
                </>
              ) : (
                <div className="text-center py-6">
                  <Wallet className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium">No Shop Selected</h3>
                  <p className="text-muted-foreground mb-4">Please create or select a shop to view business settings</p>
                  <Button variant="outline" onClick={() => window.location.href = '/shops'}>
                    Go to Shops
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing Settings</CardTitle>
              <CardDescription>
                Manage your subscription and payment information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold">Subscription Status</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    subscriptionStatus === 'active' ? 'bg-green-100 text-green-800' : 
                    subscriptionStatus === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {subscriptionStatus === 'active' ? 'Active' : 
                     subscriptionStatus === 'warning' ? 'Expiring Soon' : 'Expired'}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span>Monthly Subscription Fee</span>
                  <span className="font-medium">TZS 10,000</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Days Remaining</span>
                  <span className={`font-medium ${daysRemaining <= 5 ? 'text-red-600' : ''}`}>
                    {daysRemaining} days
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Payment Details</h3>
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <div className="flex items-center space-x-2 p-3 border rounded-md">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <span>Mobile Payment via PalmPesa</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Recipient Information</Label>
                  <div className="p-3 border rounded-md space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span>Bryan Kachocho</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                      <span>0710698702</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={() => setIsPaymentDialogOpen(true)}
              >
                Pay Now
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <PaymentDialog 
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
      />
    </div>
  );
};

export default SettingsPage;
