'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { settingsService } from '@/services/settings';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Button, buttonVariants } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Individual settings
    const [showLandingPage, setShowLandingPage] = useState(false);
    const [showLandingPageId, setShowLandingPageId] = useState<string | null>(null);
    const [orderPrefix, setOrderPrefix] = useState('M');
    const [orderPrefixId, setOrderPrefixId] = useState<string | null>(null);

    // Track if there are unsaved changes
    const [hasChanges, setHasChanges] = useState(false);

    // Initial settings values for comparison
    const [initialSettings, setInitialSettings] = useState({
        showLandingPage: false,
        orderPrefix: 'M'
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const settingsData = await settingsService.getAll();

            // Find the show landing page setting
            const landingPageSetting = settingsData.find(s => s.slug === 'show-landing-page');
            if (landingPageSetting) {
                const isEnabled = landingPageSetting.value === 'true';
                setShowLandingPage(isEnabled);
                setShowLandingPageId(landingPageSetting.id);
            }

            // Find the order prefix setting
            const orderPrefixSetting = settingsData.find(s => s.slug === 'order_prefix');
            if (orderPrefixSetting) {
                setOrderPrefix(orderPrefixSetting.value);
                setOrderPrefixId(orderPrefixSetting.id);
            }

            // Set initial state for change detection
            setInitialSettings({
                showLandingPage: landingPageSetting ? landingPageSetting.value === 'true' : false,
                orderPrefix: orderPrefixSetting ? orderPrefixSetting.value : 'M'
            });
        } catch (error) {
            toast.error('Failed to load settings');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Handle checkbox change
    const handleShowLandingPageChange = (checked: boolean) => {
        setShowLandingPage(checked);
        checkForChanges({ showLandingPage: checked });
    };

    // Handle order prefix change
    const handleOrderPrefixChange = (value: string) => {
        setOrderPrefix(value);
        checkForChanges({ orderPrefix: value });
    };

    // Check for changes in any setting
    const checkForChanges = (changes: { showLandingPage?: boolean, orderPrefix?: string }) => {
        const newShowLandingPage = changes.showLandingPage !== undefined ? changes.showLandingPage : showLandingPage;
        const newOrderPrefix = changes.orderPrefix !== undefined ? changes.orderPrefix : orderPrefix;

        setHasChanges(
            newShowLandingPage !== initialSettings.showLandingPage ||
            newOrderPrefix !== initialSettings.orderPrefix
        );
    };

    // Handle save changes
    const saveChanges = async () => {
        try {
            setSaving(true);

            // Update show landing page setting
            if (showLandingPageId && showLandingPage !== initialSettings.showLandingPage) {
                await settingsService.update(showLandingPageId, {
                    value: showLandingPage.toString()
                });
            }

            // Update order prefix setting
            if (orderPrefixId && orderPrefix !== initialSettings.orderPrefix) {
                await settingsService.update(orderPrefixId, {
                    value: orderPrefix
                });
            }

            // Update initial values to match current values
            setInitialSettings({
                showLandingPage,
                orderPrefix
            });

            setHasChanges(false);
            toast.success('Settings saved successfully');
        } catch (error) {
            toast.error('Failed to save settings');
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Settings</h1>
                    <p className="text-muted-foreground">
                        Manage system settings and configurations
                    </p>
                </div>
                <Button
                    onClick={saveChanges}
                    disabled={!hasChanges || saving}
                >
                    {saving ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                    Save Changes
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Website Settings</CardTitle>
                    <CardDescription>
                        Configure how your website appears to visitors
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="showLandingPage"
                                checked={showLandingPage}
                                onCheckedChange={handleShowLandingPageChange}
                                disabled={!showLandingPageId}
                            />
                            <div className="space-y-1">
                                <Label htmlFor="showLandingPage">Show landing page</Label>
                                <p className="text-sm text-muted-foreground">
                                    When enabled, visitors will see the landing page at the root URL (/) instead of going directly to the store
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Order Management</CardTitle>
                    <CardDescription>
                        Configure order numbering and other order-related settings
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="orderPrefix">Order number prefix</Label>
                            <div className="flex gap-4 items-center">
                                <div className="w-full max-w-xs">
                                    <Input
                                        id="orderPrefix"
                                        value={orderPrefix}
                                        onChange={(e) => handleOrderPrefixChange(e.target.value)}
                                        placeholder="M"
                                        maxLength={10}
                                    />
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Preview: {orderPrefix}-123
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Set the prefix for order numbers. This will be combined with an auto-incrementing number (e.g., {orderPrefix}-123)
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Product Management</CardTitle>
                    <CardDescription>
                        Manage product visibility and archived items
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-md font-medium">Archived Products</h3>
                                <p className="text-sm text-muted-foreground">
                                    View and manage products that have been archived
                                </p>
                            </div>
                            <Link
                                href="/admin/products/archived"
                                className={buttonVariants()}
                            >
                                View Archived Products
                            </Link>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 