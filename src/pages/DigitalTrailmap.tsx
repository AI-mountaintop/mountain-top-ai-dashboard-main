import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Send, BarChart3, RefreshCw, Calendar, Link as LinkIcon, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";

interface DigitalTrailmapItem {
    id: string;
    meeting_name: string;
    meeting_link: string;
    trailmap_link: string;
    report_link: string;
    created_at: string;
}

const DigitalTrailmap = () => {
    const [meetingLink, setMeetingLink] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState("input");

    // History state
    const [history, setHistory] = useState<DigitalTrailmapItem[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const { data, error } = await supabase
                .from('digital_trailmaps')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            setHistory(data || []);
        } catch (error) {
            console.error("Error fetching history:", error);
            toast.error("Failed to load trailmap history");
        } finally {
            setIsLoadingHistory(false);
        }
    };

    // Load history when component mounts
    useEffect(() => {
        fetchHistory();
    }, []);

    const handleGenerate = async () => {
        if (!meetingLink.trim()) {
            toast.error("Please enter a Meeting Link");
            return;
        }

        // Basic URL validation
        try {
            new URL(meetingLink);
        } catch {
            toast.error("Please enter a valid URL");
            return;
        }

        setIsGenerating(true);

        try {
            const response = await fetch("https://mountaintop.app.n8n.cloud/webhook/1ba00028-090f-4db8-bca9-c9adc8557cc1", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    meetingLink: meetingLink.trim(),
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to generate trailmap");
            }

            toast.success("Trailmap generation started successfully!");
            setActiveTab("output");
            setMeetingLink("");
            // Refresh history to show the newly generated trailmap (might take time to appear)
            setTimeout(fetchHistory, 5000);

        } catch (error) {
            console.error("Error generating trailmap:", error);
            toast.error("Failed to generate trailmap. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen">
            <Sidebar />
            <div className="ml-80">
                <main className="container mx-auto px-4 py-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold">Digital Trailmap Generation</h1>
                        <p className="text-muted-foreground mt-2">
                            Generate comprehensive digital trailmaps from meeting links
                        </p>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="input">Input</TabsTrigger>
                            <TabsTrigger value="output">Generated Trailmaps</TabsTrigger>
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
                                        Provide the meeting link to generate a digital trailmap
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="meeting-link">Meeting Link</Label>
                                        <Input
                                            id="meeting-link"
                                            type="url"
                                            placeholder="https://meetgeek.ai/recording/..."
                                            value={meetingLink}
                                            onChange={(e) => setMeetingLink(e.target.value)}
                                        />
                                    </div>

                                    <Button
                                        onClick={handleGenerate}
                                        disabled={isGenerating}
                                        className="w-full"
                                    >
                                        <Send className="h-4 w-4 mr-2" />
                                        {isGenerating ? "Generating..." : "Generate Trailmap"}
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="output" className="space-y-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Generated Trailmaps</CardTitle>
                                        <CardDescription>
                                            History of all generated digital trailmaps
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
                                            {history.map((item) => (
                                                <div key={item.id} className="border rounded-lg p-4 bg-card hover:bg-accent/5 transition-colors">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3">
                                                                <div className="bg-primary/10 p-2 rounded-full">
                                                                    <FileText className="h-5 w-5 text-primary" />
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-medium">
                                                                        {item.meeting_name || "Untitled Meeting"}
                                                                    </h3>
                                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                                        <Calendar className="h-3 w-3" />
                                                                        {format(new Date(item.created_at), "PPP 'at' p")}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {item.trailmap_link && (
                                                                <Button asChild variant="outline" size="sm">
                                                                    <a href={item.trailmap_link} target="_blank" rel="noopener noreferrer">
                                                                        View Trailmap
                                                                    </a>
                                                                </Button>
                                                            )}
                                                            {item.report_link && (
                                                                <Button asChild variant="ghost" size="sm">
                                                                    <a href={item.report_link} target="_blank" rel="noopener noreferrer">
                                                                        <ExternalLink className="h-4 w-4 mr-2" />
                                                                        View Report
                                                                    </a>
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>No trailmaps generated yet.</p>
                                            <Button variant="link" onClick={() => setActiveTab("input")}>
                                                Create your first trailmap
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
                                            Trailmaps generated
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

export default DigitalTrailmap;
