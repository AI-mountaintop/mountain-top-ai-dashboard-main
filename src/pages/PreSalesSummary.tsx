import { useMemo, useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Send, BarChart3, CheckCircle2, AlertCircle, Trash2, RefreshCw, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
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
} from "@/components/ui/alert-dialog";

type SubmissionStatus = "success" | "error";

interface SubmissionLog {
    id: string;
    companyName: string;
    url: string;
    createdAt: string;
    status: SubmissionStatus;
    message?: string;
    fileUrl?: string;
}

const PreSalesSummary = () => {
    const [companyName, setCompanyName] = useState("");
    const [websiteUrl, setWebsiteUrl] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState("input");
    const [submissions, setSubmissions] = useState<SubmissionLog[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const formatUrl = (url: string): string => {
        const trimmed = url.trim();
        if (!trimmed) return trimmed;

        // If it already has http:// or https://, return as is
        if (/^https?:\/\//i.test(trimmed)) {
            return trimmed;
        }

        // Otherwise, add https://
        return `https://${trimmed}`;
    };

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const { data, error } = await supabase
                .from('presales_summaries')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const mappedSubmissions: SubmissionLog[] = (data || []).map((item: any) => ({
                id: item.id,
                companyName: item.company_name || "Unknown Company",
                url: item.website_url || "",
                createdAt: item.created_at,
                status: "success", // Assuming stored items are successful
                message: "Generated successfully",
                fileUrl: item.summary_link
            }));

            setSubmissions(mappedSubmissions);
        } catch (error) {
            console.error("Error fetching history:", error);
            toast.error("Failed to load submission history");
        } finally {
            setIsLoadingHistory(false);
        }
    };

    // Load history on mount
    useEffect(() => {
        fetchHistory();
    }, []);

    const submitSummaryRequest = async () => {
        const trimmedCompanyName = companyName.trim();
        const trimmedUrl = websiteUrl.trim();

        if (!trimmedCompanyName) {
            toast.error("Please enter a company name");
            return;
        }

        if (!trimmedUrl) {
            toast.error("Please enter a website URL");
            return;
        }

        // Format the URL to ensure it has https://
        const formattedUrl = formatUrl(trimmedUrl);

        // Basic URL validation
        try {
            new URL(formattedUrl);
        } catch {
            toast.error("Please enter a valid website URL (e.g., https://example.com)");
            return;
        }

        setIsSubmitting(true);
        const urlToSend = formattedUrl;

        const requestPayload = {
            companyName: trimmedCompanyName,
            websiteUrl: urlToSend
        };

        try {
            // Create a controller for the timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minute timeout

            const response = await fetch("https://mountaintop.app.n8n.cloud/webhook/pre-sales-call-report", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestPayload),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            let responseMessage = "Submitted successfully";
            let responseData: any = null;
            let fileUrl: string | undefined = undefined;

            // Try to parse JSON response
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                try {
                    responseData = await response.json();
                    // Check various possible response fields
                    responseMessage =
                        responseData?.message ||
                        responseData?.status ||
                        responseData?.result ||
                        responseData?.data?.message ||
                        (response.ok ? "Workflow was started" : "Request failed");

                    // Try to find file URL in response
                    fileUrl =
                        responseData?.fileUrl ||
                        responseData?.downloadUrl ||
                        responseData?.reportUrl ||
                        responseData?.pdf ||
                        responseData?.url ||
                        responseData?.link ||
                        responseData?.data?.fileUrl ||
                        responseData?.data?.url;
                } catch (e) {
                    console.error("Failed to parse JSON response:", e);
                }
            } else {
                // Try to get text response
                try {
                    const text = await response.text();
                    if (text) {
                        responseMessage = text;
                        // If the text looks like a URL, treat it as the file URL
                        if (text.startsWith("http")) {
                            fileUrl = text;
                        }
                    }
                } catch (e) {
                    console.error("Failed to read text response:", e);
                }
            }

            if (!response.ok) {
                throw new Error(responseMessage || `Request failed with status ${response.status}`);
            }

            // Save to Supabase if we have a file URL
            if (fileUrl) {
                const { error: insertError } = await supabase
                    .from('presales_summaries')
                    .insert([
                        {
                            company_name: trimmedCompanyName,
                            website_url: urlToSend,
                            summary_link: fileUrl,
                        }
                    ]);

                if (insertError) {
                    console.error("Error saving to Supabase:", insertError);
                    toast.error("Generated report but failed to save to history");
                } else {
                    // Refresh history to show the new item
                    fetchHistory();
                }
            }

            // Use a more user-friendly message if available
            const displayMessage = responseMessage || "Pre-sales summary request submitted successfully";

            toast.success(displayMessage);
            setActiveTab("output");

            // If we didn't save to Supabase (no fileUrl), we might want to show a temporary item or just rely on the toast
            if (!fileUrl) {
                setSubmissions((prev) => [
                    {
                        id: crypto.randomUUID(),
                        companyName: trimmedCompanyName,
                        url: urlToSend,
                        createdAt: new Date().toISOString(),
                        status: "success",
                        message: displayMessage,
                        fileUrl: fileUrl,
                    },
                    ...prev,
                ]);
            }

            setCompanyName("");
            setWebsiteUrl("");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Submission failed";
            if (error instanceof Error && error.name === 'AbortError') {
                toast.error("Request timed out. The report might still be generating.");
            } else {
                toast.error(message);
            }

            setSubmissions((prev) => [
                {
                    id: crypto.randomUUID(),
                    companyName: trimmedCompanyName || "",
                    url: urlToSend || trimmedUrl,
                    createdAt: new Date().toISOString(),
                    status: "error",
                    message: error instanceof Error && error.name === 'AbortError' ? "Request timed out" : message,
                },
                ...prev,
            ]);
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteSubmission = async (id: string) => {
        try {
            const { error } = await supabase
                .from('presales_summaries')
                .delete()
                .eq('id', id);

            if (error) throw error;
            
            toast.success("Submission deleted");
            fetchHistory();
        } catch (error) {
            console.error("Error deleting submission:", error);
            toast.error("Failed to delete submission");
        }
    };

    const analytics = useMemo(() => {
        const total = submissions.length;
        const success = submissions.filter((entry) => entry.status === "success").length;
        const failed = submissions.filter((entry) => entry.status === "error").length;
        return { total, success, failed };
    }, [submissions]);

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <div className="ml-64">
                <main className="container mx-auto px-12 py-12 max-w-6xl">
                    <PageHeader 
                        title="Pre-Sales Summary" 
                        description="Generate pre-sales call summaries by analyzing a prospect's website"
                    />

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-3 bg-muted/50 mb-6">
                            <TabsTrigger value="input" className="data-[state=active]:bg-background">Input</TabsTrigger>
                            <TabsTrigger value="output" className="data-[state=active]:bg-background">Submission History</TabsTrigger>
                            <TabsTrigger value="analytics" className="data-[state=active]:bg-background">Analytics</TabsTrigger>
                        </TabsList>

                        <TabsContent value="input" className="space-y-6 mt-0">
                            <Card className="border-border">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold">Website Analysis Input</CardTitle>
                                    <CardDescription>
                                        Enter a prospect's website URL to generate a pre-sales call summary
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="company-name">Company Name</Label>
                                        <Input
                                            id="company-name"
                                            type="text"
                                            placeholder="e.g., Acme Corporation"
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="website-url">Website URL</Label>
                                        <Input
                                            id="website-url"
                                            type="url"
                                            placeholder="https://example.com"
                                            value={websiteUrl}
                                            onChange={(e) => setWebsiteUrl(e.target.value)}
                                        />
                                    </div>

                                    <Button
                                        onClick={submitSummaryRequest}
                                        disabled={isSubmitting}
                                        className="w-full bg-primary hover:bg-primary/90"
                                        size="lg"
                                    >
                                        <Send className="h-4 w-4 mr-2" />
                                        {isSubmitting ? "Submitting..." : "Generate Pre-Sales Summary"}
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="output" className="space-y-6 mt-0">
                            <Card className="border-border">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg font-semibold">Submission History</CardTitle>
                                        <CardDescription>
                                            Track your recent pre-sales summary requests
                                        </CardDescription>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={fetchHistory} disabled={isLoadingHistory} className="border-border">
                                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                                        Refresh
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    {isLoadingHistory ? (
                                        <div className="text-center py-16">
                                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
                                            <p className="text-sm text-muted-foreground">Loading...</p>
                                        </div>
                                    ) : submissions.length > 0 ? (
                                        <div className="space-y-3">
                                            {submissions.map((entry) => (
                                                <div
                                                    key={entry.id}
                                                    className="border border-border rounded-lg p-5 bg-card hover:border-primary/20 transition-all duration-200"
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="space-y-1 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                {entry.status === "success" ? (
                                                                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                                ) : (
                                                                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                                                                )}
                                                                <span className="font-medium text-base">{entry.companyName}</span>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground">
                                                                {entry.url}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {new Date(entry.createdAt).toLocaleString()}
                                                            </p>
                                                            {entry.fileUrl && (
                                                                <div className="pt-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="gap-2 border-border"
                                                                        onClick={() => window.open(entry.fileUrl, '_blank')}
                                                                    >
                                                                        <ExternalLink className="h-3 w-3" />
                                                                        View Report
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Delete submission?</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            This will permanently delete the submission for "{entry.companyName}".
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => deleteSubmission(entry.id)} className="bg-destructive hover:bg-destructive/90">
                                                                            Delete
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-16 text-muted-foreground">
                                            <FileText className="h-10 w-10 mx-auto mb-4 opacity-40" />
                                            <p className="text-sm mb-2">No submissions yet</p>
                                            <Button variant="link" onClick={() => setActiveTab("input")} className="text-sm">
                                                Start with a website URL
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="analytics" className="space-y-6 mt-0">
                            <div className="grid gap-6 md:grid-cols-3">
                                <Card className="border-border">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
                                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-semibold">{analytics.total}</div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            All submissions
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="border-border">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">Successful</CardTitle>
                                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-semibold text-green-700">{analytics.success}</div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Requests accepted
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="border-border">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle>
                                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-semibold text-red-600">{analytics.failed}</div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Requests failed
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </main>
            </div>
        </div>
    );
};

export default PreSalesSummary;
