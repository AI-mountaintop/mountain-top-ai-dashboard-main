import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Send, BarChart3, RefreshCw, Calendar, ExternalLink, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { Progress } from "@/components/ui/progress";
import { useJobProgress } from "@/contexts/JobProgressContext";
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

interface DigitalTrailmapItem {
    id: string;
    meeting_name: string;
    meeting_link: string;
    trailmap_link: string;
    report_link: string;
    created_at: string;
}

const DigitalTrailmap = () => {
    const { startJob, getActiveJobByType, getProgressByType } = useJobProgress();
    
    const [inputType, setInputType] = useState<"link" | "transcript">("link");
    const [meetingLink, setMeetingLink] = useState("");
    const [meetingTranscript, setMeetingTranscript] = useState("");
    const [meetingTitle, setMeetingTitle] = useState("");
    const [activeTab, setActiveTab] = useState("input");

    // History state
    const [history, setHistory] = useState<DigitalTrailmapItem[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Get active job and progress from global context
    const activeJob = getActiveJobByType('trailmap');
    const progress = getProgressByType('trailmap');
    const isGenerating = !!activeJob;

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

    // Switch to output tab if there's an active job
    useEffect(() => {
        if (activeJob) {
            setActiveTab("output");
        }
    }, [activeJob]);

    // Refresh history when job completes
    useEffect(() => {
        if (progress?.status === 'completed') {
            toast.success("Trailmap generated successfully!");
            fetchHistory();
            setTimeout(fetchHistory, 2000);
        } else if (progress?.status === 'failed') {
            toast.error(progress.error || "Failed to generate trailmap");
        }
    }, [progress?.status]);

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
            if (!meetingTitle.trim()) {
                toast.error("Please enter a Meeting Title");
                return;
            }
        }

        // Store values before clearing
        const linkToProcess = inputType === "link" ? meetingLink.trim() : "";
        const transcriptToProcess = inputType === "transcript" ? meetingTranscript.trim() : "";
        const titleToProcess = inputType === "transcript" ? meetingTitle.trim() : "";

        // Clear input and switch to output tab
        setMeetingLink("");
        setMeetingTranscript("");
        setMeetingTitle("");
        setActiveTab("output");

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = await fetch(`${apiUrl}/api/trailmap/generate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    meetingLink: linkToProcess || undefined,
                    meetingTranscript: transcriptToProcess || undefined,
                    meetingTitle: titleToProcess || undefined,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to generate trailmap");
            }

            const result = await response.json();
            
            // Start tracking job in global context
            if (result.jobId) {
                startJob(result.jobId, 'trailmap');
                toast.success("Trailmap generation started");
            } else {
                toast.success("Trailmap generation started successfully");
                setTimeout(fetchHistory, 2000);
            }

        } catch (error) {
            console.error("Error generating trailmap:", error);
            toast.error("Failed to generate trailmap. Please try again.");
            setActiveTab("input");
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <div className="ml-64">
                <main className="container mx-auto px-12 py-12 max-w-6xl">
                    <PageHeader 
                        title="Digital Trailmap" 
                        description="Generate comprehensive digital trailmaps from meeting links"
                    />

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-3 bg-muted/50 mb-6">
                            <TabsTrigger value="input" className="data-[state=active]:bg-background">Input</TabsTrigger>
                            <TabsTrigger value="output" className="data-[state=active]:bg-background">Generated Trailmaps</TabsTrigger>
                            <TabsTrigger value="analytics" className="data-[state=active]:bg-background">Analytics</TabsTrigger>
                        </TabsList>

                        <TabsContent value="input" className="space-y-6 mt-0">
                            <Card className="border-border">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold">Meeting Information</CardTitle>
                                    <CardDescription>
                                        Provide a meeting link or meeting transcript
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
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
                                                disabled={isGenerating}
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-2">
                                                <Label htmlFor="meeting-title">
                                                    Meeting Title <span className="text-destructive">*</span>
                                                </Label>
                                                <Input
                                                    id="meeting-title"
                                                    type="text"
                                                    placeholder="e.g., Q1 Strategy Planning Meeting"
                                                    value={meetingTitle}
                                                    onChange={(e) => setMeetingTitle(e.target.value)}
                                                    disabled={isGenerating}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="meeting-transcript">Meeting Transcript</Label>
                                                <Textarea
                                                    id="meeting-transcript"
                                                    placeholder="Paste the meeting transcript here..."
                                                    value={meetingTranscript}
                                                    onChange={(e) => setMeetingTranscript(e.target.value)}
                                                    className="min-h-[200px]"
                                                    disabled={isGenerating}
                                                />
                                            </div>
                                        </>
                                    )}

                                    <Button
                                        onClick={handleGenerate}
                                        disabled={isGenerating}
                                        className="w-full bg-primary hover:bg-primary/90"
                                        size="lg"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="h-4 w-4 mr-2" />
                                                Generate Trailmap
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="output" className="space-y-6 mt-0">
                            {/* Progress Card - Show when generating */}
                            {(isGenerating || progress) && (
                                <Card className="border-border bg-muted/30">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-semibold">Generation Progress</CardTitle>
                                        <CardDescription>
                                            Please wait while the trailmap is being generated
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">Progress</span>
                                                <span className="text-sm text-muted-foreground">{progress?.percentage || 0}%</span>
                                            </div>
                                            <Progress value={progress?.percentage || 0} className="h-2" />
                                            <div className="space-y-2 mt-4">
                                                {progress?.steps?.map((step, index) => (
                                                    <div key={index} className="flex items-center gap-2 text-sm">
                                                        {step.completed ? (
                                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                        ) : progress.currentStep === index ? (
                                                            <Loader2 className="h-4 w-4 text-primary animate-spin" />
                                                        ) : (
                                                            <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                                                        )}
                                                        <span className={step.completed ? "text-foreground" : progress.currentStep === index ? "text-primary font-medium" : "text-muted-foreground"}>
                                                            {step.name}
                                                        </span>
                                                    </div>
                                                )) || (
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Loader2 className="h-4 w-4 text-primary animate-spin" />
                                                        <span>Initializing generation...</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            <Card className="border-border">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg font-semibold">Generated Trailmaps</CardTitle>
                                        <CardDescription>
                                            History of all generated digital trailmaps
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
                                    ) : history.length > 0 ? (
                                        <div className="space-y-3">
                                            {history.map((item) => (
                                                <div key={item.id} className="border border-border rounded-lg p-5 bg-card hover:border-primary/20 transition-all duration-200">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3">
                                                                <FileText className="h-5 w-5 text-muted-foreground" />
                                                                <div>
                                                                    <h3 className="font-medium text-base">
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
                                                                <Button asChild variant="outline" size="sm" className="border-border">
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
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Delete trailmap?</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            This will permanently delete "{item.meeting_name || "Untitled Meeting"}" and the associated documents from Google Drive.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleDelete(item)} className="bg-destructive hover:bg-destructive/90">
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
                                            <p className="text-sm mb-2">No trailmaps yet</p>
                                            <Button variant="link" onClick={() => setActiveTab("input")} className="text-sm">
                                                Create your first trailmap
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
                                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Runs</CardTitle>
                                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-semibold">{history.length}</div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Trailmaps generated
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="border-border">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Cost</CardTitle>
                                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-semibold">$0.00</div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            API usage cost
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="border-border">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Time</CardTitle>
                                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-semibold">0s</div>
                                        <p className="text-xs text-muted-foreground mt-1">
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
