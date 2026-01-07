import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Send, BarChart3, RefreshCw, Calendar, Link as LinkIcon, ExternalLink, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { Progress } from "@/components/ui/progress";

interface DigitalTrailmapItem {
    id: string;
    meeting_name: string;
    meeting_link: string;
    trailmap_link: string;
    report_link: string;
    created_at: string;
}

const DigitalTrailmap = () => {
    const [inputType, setInputType] = useState<"link" | "transcript">("link");
    const [meetingLink, setMeetingLink] = useState("");
    const [meetingTranscript, setMeetingTranscript] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState("input");

    // History state
    const [history, setHistory] = useState<DigitalTrailmapItem[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Progress state
    const [currentJobId, setCurrentJobId] = useState<string | null>(null);
    const [progress, setProgress] = useState<{
        status: string;
        currentStep: number;
        totalSteps: number;
        steps: Array<{ name: string; completed: boolean }>;
        percentage: number;
        error?: string;
        result?: any;
    } | null>(null);

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

    const handleDelete = async (item: DigitalTrailmapItem) => {
        if (!confirm(`Are you sure you want to delete "${item.meeting_name}"? This will permanently delete the trailmap and report from Google Drive and Supabase.`)) {
            return;
        }

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = await fetch(`${apiUrl}/api/trailmaps/${item.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    trailmapLink: item.trailmap_link,
                    reportLink: item.report_link
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to delete trailmap');
            }

            toast.success("Trailmap deleted successfully");
            
            // Refresh the history list
            fetchHistory();
        } catch (error) {
            console.error("Error deleting trailmap:", error);
            toast.error(error instanceof Error ? error.message : "Failed to delete trailmap");
        }
    };

    // Load history when component mounts
    useEffect(() => {
        fetchHistory();
    }, []);

    // Poll for progress updates
    useEffect(() => {
        if (!currentJobId) return;

        const pollProgress = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
                const response = await fetch(`${apiUrl}/api/trailmap/progress/${currentJobId}`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch progress');
                }

                const progressData = await response.json();
                setProgress(progressData);

                // If completed or failed, stop polling and refresh history
                if (progressData.status === 'completed') {
                    setIsGenerating(false);
                    setCurrentJobId(null);
                    setProgress(null);
                    
                    // Show success message with details
                    const hasTrailmap = progressData.result?.trailmapLink;
                    const hasReport = progressData.result?.reportLink;
                    let message = "Trailmap generated successfully!";
                    if (!hasTrailmap && !hasReport) {
                        message += " (Note: Documents may not have been created - check server logs)";
                    }
                    toast.success(message);
                    
                    // Refresh history immediately and again after a delay
                    fetchHistory();
                    setTimeout(fetchHistory, 2000);
                    setTimeout(fetchHistory, 5000);
                } else if (progressData.status === 'failed') {
                    setIsGenerating(false);
                    setCurrentJobId(null);
                    setProgress(null);
                    toast.error(progressData.error || "Failed to generate trailmap");
                    // Still refresh history in case partial data was saved
                    setTimeout(fetchHistory, 1000);
                }
            } catch (error) {
                console.error("Error polling progress:", error);
            }
        };

        // Poll immediately, then every 1 second
        pollProgress();
        const interval = setInterval(pollProgress, 1000);

        return () => clearInterval(interval);
    }, [currentJobId]);

    const handleGenerate = async () => {
        if (inputType === "link") {
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
        } else {
            if (!meetingTranscript.trim()) {
                toast.error("Please enter a Meeting Transcript");
                return;
            }
        }

        setIsGenerating(true);
        setProgress(null);

        try {
            // Use local backend server instead of n8n webhook
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = await fetch(`${apiUrl}/api/trailmap/generate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    meetingLink: inputType === "link" ? meetingLink.trim() : undefined,
                    meetingTranscript: inputType === "transcript" ? meetingTranscript.trim() : undefined,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to generate trailmap");
            }

            const result = await response.json();
            
            // Immediately switch to output tab and start polling
            setCurrentJobId(result.jobId);
            setActiveTab("output");
            setMeetingLink("");
            setMeetingTranscript("");

        } catch (error) {
            console.error("Error generating trailmap:", error);
            toast.error("Failed to generate trailmap. Please try again.");
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
                                        Provide either a meeting link or meeting transcript to generate a digital trailmap
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-3">
                                        <Label>Input Type</Label>
                                        <RadioGroup value={inputType} onValueChange={(value) => setInputType(value as "link" | "transcript")}>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="link" id="link" />
                                                <Label htmlFor="link" className="font-normal cursor-pointer">
                                                    Meeting Link
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="transcript" id="transcript" />
                                                <Label htmlFor="transcript" className="font-normal cursor-pointer">
                                                    Meeting Transcript
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    {inputType === "link" ? (
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
                                    ) : (
                                        <div className="space-y-2">
                                            <Label htmlFor="meeting-transcript">Meeting Transcript</Label>
                                            <Textarea
                                                id="meeting-transcript"
                                                placeholder="Paste the meeting transcript here..."
                                                value={meetingTranscript}
                                                onChange={(e) => setMeetingTranscript(e.target.value)}
                                                className="min-h-[200px]"
                                            />
                                        </div>
                                    )}

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
                            {/* Progress Card - Show when generating */}
                            {isGenerating && progress && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Generating Trailmap...</CardTitle>
                                        <CardDescription>
                                            Please wait while we generate your digital trailmap
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Progress</span>
                                                <span className="font-medium">{progress.percentage}%</span>
                                            </div>
                                            <Progress value={progress.percentage} className="h-2" />
                                        </div>
                                        <div className="space-y-2">
                                            {progress.steps.map((step, index) => (
                                                <div key={index} className="flex items-center gap-3 text-sm">
                                                    {step.completed ? (
                                                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                                                    ) : index === progress.currentStep ? (
                                                        <Loader2 className="h-4 w-4 text-primary animate-spin flex-shrink-0" />
                                                    ) : (
                                                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                                                    )}
                                                    <span className={step.completed ? "text-muted-foreground line-through" : index === progress.currentStep ? "font-medium" : "text-muted-foreground"}>
                                                        {step.name}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

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
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm"
                                                                onClick={() => handleDelete(item)}
                                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
