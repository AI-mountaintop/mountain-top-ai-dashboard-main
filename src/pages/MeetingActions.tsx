import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Send, BarChart3, RefreshCw, Calendar, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ActionItemFile {
    id: string;
    name: string;
    createdTime: string;
    webViewLink: string;
}

const MeetingActions = () => {
    const [meetGeekUrl, setMeetGeekUrl] = useState("");
    const [email, setEmail] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState("input");

    // History state
    const [history, setHistory] = useState<ActionItemFile[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [previewId, setPreviewId] = useState<string | null>(null);

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const response = await fetch("https://mountaintop.app.n8n.cloud/webhook/meeting_to_action");
            if (!response.ok) throw new Error("Failed to fetch history");

            const data = await response.json();
            // Ensure data is an array and sort by createdTime desc
            const files = Array.isArray(data) ? data : (data.files || []);
            const sortedFiles = files.sort((a: ActionItemFile, b: ActionItemFile) =>
                new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime()
            );

            setHistory(sortedFiles);
        } catch (error) {
            console.error("Error fetching history:", error);
            toast.error("Failed to load action items history");
        } finally {
            setIsLoadingHistory(false);
        }
    };

    // Load history when component mounts
    useEffect(() => {
        fetchHistory();
    }, []);

    const handleGenerate = async () => {
        if (!meetGeekUrl.trim()) {
            toast.error("Please enter a MeetGeek URL");
            return;
        }

        if (!email.trim()) {
            toast.error("Please enter an email address");
            return;
        }

        // Basic URL validation
        try {
            new URL(meetGeekUrl);
        } catch {
            toast.error("Please enter a valid URL");
            return;
        }

        setIsGenerating(true);

        try {
            const response = await fetch("https://mountaintop.app.n8n.cloud/webhook/action-items", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    meetGeekUrl: meetGeekUrl.trim(),
                    email: email.trim(),
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to generate action items");
            }

            toast.success("Action items generation started");
            setActiveTab("output");
            setMeetGeekUrl("");
            // Refresh history to show the newly generated action items
            // Note: It might take some time for the file to appear, so immediate refresh might not show it yet
            setTimeout(fetchHistory, 2000);

        } catch (error) {
            console.error("Error generating action items:", error);
            toast.error("Failed to generate action items. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const togglePreview = (id: string) => {
        if (previewId === id) {
            setPreviewId(null);
        } else {
            setPreviewId(id);
        }
    };

    return (
        <div className="min-h-screen">
            <Sidebar />
            <div className="ml-80">
                <main className="container mx-auto px-4 py-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold">Meeting Minutes to Action Items</h1>
                        <p className="text-muted-foreground mt-2">
                            Convert meeting transcripts into actionable items
                        </p>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="input">Input</TabsTrigger>
                            <TabsTrigger value="output">Generated Action Items</TabsTrigger>
                            <TabsTrigger value="analytics">Analytics</TabsTrigger>
                        </TabsList>

                        <TabsContent value="input" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <LinkIcon className="h-5 w-5" />
                                        Meeting Information
                                    </CardTitle>
                                    <CardDescription>
                                        Provide the MeetGeek recording URL and email to generate action items
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="meetgeek-url">MeetGeek URL</Label>
                                        <Input
                                            id="meetgeek-url"
                                            type="url"
                                            placeholder="https://meetgeek.ai/recording/..."
                                            value={meetGeekUrl}
                                            onChange={(e) => setMeetGeekUrl(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="team@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>

                                    <Button
                                        onClick={handleGenerate}
                                        disabled={isGenerating}
                                        className="w-full"
                                    >
                                        <Send className="h-4 w-4 mr-2" />
                                        {isGenerating ? "Generating..." : "Generate Action Items"}
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="output" className="space-y-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Generated Action Items</CardTitle>
                                        <CardDescription>
                                            History of all generated action item documents
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
                                    ) : history.length > 0 ? (
                                        <div className="space-y-4">
                                            {history.map((file) => (
                                                <div key={file.id} className="border rounded-lg p-4 bg-card hover:bg-accent/5 transition-colors">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div
                                                            className="cursor-pointer hover:opacity-80 transition-opacity flex-1"
                                                            onClick={() => togglePreview(file.id)}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="bg-primary/10 p-2 rounded-full">
                                                                    <FileText className="h-5 w-5 text-primary" />
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <h3 className="font-medium underline decoration-dotted underline-offset-4">
                                                                            {file.name}
                                                                        </h3>
                                                                        <span className="text-[10px] text-muted-foreground bg-background px-2 py-0.5 rounded-full border">
                                                                            {previewId === file.id ? "Hide Preview" : "Click to Preview"}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                                        <Calendar className="h-3 w-3" />
                                                                        {format(new Date(file.createdTime), "PPP 'at' p")}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Button asChild variant="outline" size="sm">
                                                            <a href={`https://docs.google.com/document/d/${file.id}/edit`} target="_blank" rel="noopener noreferrer">
                                                                Open in Docs
                                                            </a>
                                                        </Button>
                                                    </div>

                                                    {previewId === file.id && (
                                                        <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden border border-border shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                                                            <iframe
                                                                src={`https://docs.google.com/document/d/${file.id}/preview`}
                                                                frameBorder="0"
                                                                width="100%"
                                                                height="100%"
                                                                allowFullScreen={true}
                                                                title={`Preview of ${file.name}`}
                                                            ></iframe>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>No action items generated yet.</p>
                                            <Button variant="link" onClick={() => setActiveTab("input")}>
                                                Create your first action item
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
                                        <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
                                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{history.length}</div>
                                        <p className="text-xs text-muted-foreground">
                                            Action items generated
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">$0.00</div>
                                        <p className="text-xs text-muted-foreground">
                                            API usage cost
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Avg. Time</CardTitle>
                                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">0s</div>
                                        <p className="text-xs text-muted-foreground">
                                            Generation time
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

export default MeetingActions;
