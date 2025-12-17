import { useMemo, useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Send, BarChart3, CheckCircle2, AlertCircle, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type SubmissionStatus = "success" | "error";

interface SubmissionLog {
    id: string;
    companyName: string;
    url: string;
    createdAt: string;
    status: SubmissionStatus;
    message?: string;
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
            const response = await fetch("https://mountaintop.app.n8n.cloud/webhook/pre-sales-call-report", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestPayload),
            });

            let responseMessage = "Submitted successfully";
            let responseData: any = null;

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
                } catch (e) {
                    console.error("Failed to parse JSON response:", e);
                }
            } else {
                // Try to get text response
                try {
                    const text = await response.text();
                    if (text) {
                        responseMessage = text;
                    }
                } catch (e) {
                    console.error("Failed to read text response:", e);
                }
            }

            if (!response.ok) {
                throw new Error(responseMessage || `Request failed with status ${response.status}`);
            }

            // Use a more user-friendly message if available
            const displayMessage = responseMessage || "Pre-sales summary request submitted successfully";

            toast.success(displayMessage);
            setActiveTab("output");
            setSubmissions((prev) => [
                {
                    id: crypto.randomUUID(),
                    companyName: trimmedCompanyName,
                    url: urlToSend,
                    createdAt: new Date().toISOString(),
                    status: "success",
                    message: displayMessage,
                },
                ...prev,
            ]);
            setCompanyName("");
            setWebsiteUrl("");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Submission failed";
            toast.error(message);
            setSubmissions((prev) => [
                {
                    id: crypto.randomUUID(),
                    companyName: trimmedCompanyName || "",
                    url: urlToSend || trimmedUrl,
                    createdAt: new Date().toISOString(),
                    status: "error",
                    message,
                },
                ...prev,
            ]);
        } finally {
            setIsSubmitting(false);
        }
    };

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const response = await fetch("https://mountaintop.app.n8n.cloud/webhook/pre-sales-call");
            if (!response.ok) throw new Error("Failed to fetch history");

            const data = await response.json();

            // Handle different response formats
            let historyData: any[] = [];
            if (Array.isArray(data)) {
                historyData = data;
            } else if (data.files && Array.isArray(data.files)) {
                historyData = data.files;
            } else if (data.submissions && Array.isArray(data.submissions)) {
                historyData = data.submissions;
            } else if (data.data && Array.isArray(data.data)) {
                historyData = data.data;
            }

            // Map the response to our SubmissionLog format
            const mappedSubmissions: SubmissionLog[] = historyData.map((item: any) => {
                // Extract company name and URL from the item
                const company = item.companyName || item.company || item.name || "";
                const url = item.websiteUrl || item.url || item.website || "";
                const createdAt = item.createdAt || item.createdTime || item.date || new Date().toISOString();
                const status = item.status === "success" || item.status === "Success" ? "success" : "error";
                const message = item.message || item.response || item.status || "";

                return {
                    id: item.id || crypto.randomUUID(),
                    companyName: company,
                    url: url,
                    createdAt: createdAt,
                    status: status as SubmissionStatus,
                    message: message,
                };
            });

            // Sort by created date (newest first)
            const sortedSubmissions = mappedSubmissions.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            // Replace submissions with data from webhook (or merge if you want to keep local-only entries)
            // For now, we'll replace to show the authoritative data from the webhook
            setSubmissions(sortedSubmissions);

            if (mappedSubmissions.length > 0) {
                toast.success(`Loaded ${mappedSubmissions.length} submission(s) from history`);
            } else {
                toast.info("No submissions found in history");
            }
        } catch (error) {
            console.error("Error fetching history:", error);
            toast.error("Failed to load submission history");
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const deleteSubmission = (id: string) => {
        setSubmissions((prev) => prev.filter((entry) => entry.id !== id));
        toast.success("Submission deleted");
    };

    const analytics = useMemo(() => {
        const total = submissions.length;
        const success = submissions.filter((entry) => entry.status === "success").length;
        const failed = submissions.filter((entry) => entry.status === "error").length;
        return { total, success, failed };
    }, [submissions]);

    return (
        <div className="min-h-screen">
            <Sidebar />
            <div className="ml-80">
                <main className="container mx-auto px-4 py-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold">Pre-Sales Call Summary</h1>
                        <p className="text-muted-foreground mt-2">
                            Generate pre-sales call summaries by analyzing a prospect&apos;s website
                        </p>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="input">Input</TabsTrigger>
                            <TabsTrigger value="output">Submission History</TabsTrigger>
                            <TabsTrigger value="analytics">Analytics</TabsTrigger>
                        </TabsList>

                        <TabsContent value="input" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Website Analysis Input
                                    </CardTitle>
                                    <CardDescription>
                                        Enter a prospect&apos;s website URL and we&apos;ll generate a pre-sales call summary
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
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
                                        className="w-full"
                                    >
                                        <Send className="h-4 w-4 mr-2" />
                                        {isSubmitting ? "Submitting..." : "Generate Pre-Sales Summary"}
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="output" className="space-y-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Submission History</CardTitle>
                                        <CardDescription>
                                            Track your recent pre-sales summary requests
                                        </CardDescription>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={fetchHistory} disabled={isLoadingHistory}>
                                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                                        Refresh
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    {isLoadingHistory ? (
                                        <div className="text-center py-12">
                                            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-4" />
                                            <p className="text-muted-foreground">Loading history...</p>
                                        </div>
                                    ) : submissions.length > 0 ? (
                                        <div className="space-y-3">
                                            {submissions.map((entry) => (
                                                <div
                                                    key={entry.id}
                                                    className="border rounded-lg p-4 bg-card hover:bg-accent/5 transition-colors"
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="space-y-1 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                {entry.status === "success" ? (
                                                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                                ) : (
                                                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                                                )}
                                                                <span className="font-medium">{entry.companyName}</span>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground">
                                                                {entry.url}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {new Date(entry.createdAt).toLocaleString()}
                                                            </p>
                                                            {entry.message && (
                                                                <p className="text-sm text-muted-foreground">
                                                                    {entry.message}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className={`text-xs px-2 py-1 rounded-full border ${entry.status === "success"
                                                                        ? "border-green-200 bg-green-50 text-green-700"
                                                                        : "border-red-200 bg-red-50 text-red-700"
                                                                    }`}
                                                            >
                                                                {entry.status === "success" ? "Success" : "Error"}
                                                            </span>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => deleteSubmission(entry.id)}
                                                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>No submissions yet.</p>
                                            <Button variant="link" onClick={() => setActiveTab("input")}>
                                                Start with a website URL
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="analytics" className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-3">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{analytics.total}</div>
                                        <p className="text-xs text-muted-foreground">
                                            All pre-sales summary submissions
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Successful</CardTitle>
                                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-green-700">{analytics.success}</div>
                                        <p className="text-xs text-muted-foreground">
                                            Requests accepted by the webhook
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Failed</CardTitle>
                                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-red-600">{analytics.failed}</div>
                                        <p className="text-xs text-muted-foreground">
                                            Requests that returned an error
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
