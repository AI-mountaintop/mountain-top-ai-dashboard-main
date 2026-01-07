import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Send, BarChart3, RefreshCw, Calendar, Link as LinkIcon, ExternalLink, Mail, X, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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

interface MeetingActionItem {
    id: string;
    meeting_name: string;
    meetgeek_url: string;
    google_drive_link: string;
    html_content: string;
    created_at: string;
}

const MeetingActions = () => {
    const [inputType, setInputType] = useState<"link" | "transcript">("link");
    const [meetGeekUrl, setMeetGeekUrl] = useState("");
    const [meetingTranscript, setMeetingTranscript] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState("input");

    // History state
    const [history, setHistory] = useState<MeetingActionItem[]>([]);
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

    // Modal state
    const [selectedMeeting, setSelectedMeeting] = useState<MeetingActionItem | null>(null);
    const [emailToSend, setEmailToSend] = useState("");
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const { data, error } = await supabase
                .from('meeting_action_items')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            setHistory(data || []);
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

    // Poll for progress updates
    useEffect(() => {
        if (!currentJobId) return;

        const pollProgress = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
                const response = await fetch(`${apiUrl}/api/action-items/progress/${currentJobId}`);
                
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
                    
                    toast.success("Action items generated successfully!");
                    
                    // Refresh history immediately and again after a delay
                    fetchHistory();
                    setTimeout(fetchHistory, 2000);
                    setTimeout(fetchHistory, 5000);
                } else if (progressData.status === 'failed') {
                    setIsGenerating(false);
                    setCurrentJobId(null);
                    setProgress(null);
                    toast.error(progressData.error || "Failed to generate action items");
                    // Still refresh history in case partial data was saved
                    setTimeout(fetchHistory, 1000);
                }
            } catch (error) {
                console.error("Error polling progress:", error);
                // Don't show error toast for polling errors - just log it
            }
        };

        // Poll immediately, then every 2 seconds
        pollProgress();
        const interval = setInterval(pollProgress, 2000);

        return () => clearInterval(interval);
    }, [currentJobId]);

    const handleGenerate = async () => {
        // Validate input based on type
        if (inputType === "link") {
            if (!meetGeekUrl.trim()) {
                toast.error("Please enter a MeetGeek URL");
                return;
            }

            // Basic URL validation
            try {
                new URL(meetGeekUrl);
            } catch {
                toast.error("Please enter a valid URL");
                return;
            }
        } else {
            if (!meetingTranscript.trim()) {
                toast.error("Please enter a meeting transcript");
                return;
            }
        }

        // Store values before clearing
        const urlToProcess = inputType === "link" ? meetGeekUrl.trim() : "";
        const transcriptToProcess = inputType === "transcript" ? meetingTranscript.trim() : "";
        
        // Immediately switch to output tab and clear input
        setActiveTab("output");
        setMeetGeekUrl("");
        setMeetingTranscript("");
        setIsGenerating(true);
        setProgress(null);

        try {
            // Use local backend server instead of n8n webhook
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = await fetch(`${apiUrl}/api/action-items/generate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    meetGeekUrl: urlToProcess || undefined,
                    meetingTranscript: transcriptToProcess || undefined,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to generate action items");
            }

            const result = await response.json();
            
            // Set job ID to start polling
            if (result.jobId) {
                setCurrentJobId(result.jobId);
                toast.success("Action items generation started");
            } else {
                // Fallback if jobId is not returned
                toast.success("Action items generation started successfully");
                setTimeout(fetchHistory, 2000);
                setIsGenerating(false);
            }

        } catch (error) {
            console.error("Error generating action items:", error);
            toast.error("Failed to generate action items. Please try again.");
            setIsGenerating(false);
            // Switch back to input tab on error so user can try again
            setActiveTab("input");
        }
    };

    const openMeetingModal = (meeting: MeetingActionItem) => {
        setSelectedMeeting(meeting);
        setEmailToSend("");
        setIsModalOpen(true);
    };

    const handleSendEmail = async () => {
        if (!selectedMeeting) return;
        if (!emailToSend.trim()) {
            toast.error("Please enter an email address");
            return;
        }

        setIsSendingEmail(true);

        try {
            // Use local backend server instead of n8n webhook
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = await fetch(`${apiUrl}/api/action-items/send-email`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    meeting_name: selectedMeeting.meeting_name,
                    html_content: selectedMeeting.html_content,
                    email: emailToSend.trim(),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to send email");
            }

            const result = await response.json();
            toast.success(`Email sent to ${emailToSend}`);
            // Optional: Close modal after success
            // setIsModalOpen(false); 
        } catch (error) {
            console.error("Error sending email:", error);
            toast.error("Failed to send email. Please try again.");
        } finally {
            setIsSendingEmail(false);
        }
    };

    const handleDeleteActionItem = async (id: string, googleDriveLink: string | null) => {
        setIsLoadingHistory(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = await fetch(`${apiUrl}/api/action-items/${id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ googleDriveLink }), // Pass link for Drive deletion
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to delete action item");
            }

            toast.success("Action item deleted successfully!");
            fetchHistory(); // Refresh the list
        } catch (error) {
            console.error("Error deleting action item:", error);
            toast.error("Failed to delete action item. Please try again.");
        } finally {
            setIsLoadingHistory(false);
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
                                        Provide either a MeetGeek recording URL or meeting transcript to generate action items
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
                                            <Label htmlFor="meetgeek-url">MeetGeek URL</Label>
                                            <Input
                                                id="meetgeek-url"
                                                type="url"
                                                placeholder="https://meetgeek.ai/recording/..."
                                                value={meetGeekUrl}
                                                onChange={(e) => setMeetGeekUrl(e.target.value)}
                                                disabled={isGenerating}
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
                                                disabled={isGenerating}
                                            />
                                        </div>
                                    )}

                                    <Button
                                        onClick={handleGenerate}
                                        disabled={isGenerating}
                                        className="w-full"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="h-4 w-4 mr-2" />
                                                Generate Action Items
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="output" className="space-y-4">
                            {/* Progress Card - Show when generating */}
                            {(isGenerating || progress) && (
                                <Card className="bg-muted/50">
                                    <CardHeader>
                                        <CardTitle>Generation Progress</CardTitle>
                                        <CardDescription>
                                            Action items are being generated. Please wait...
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
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
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => openMeetingModal(item)}
                                                            >
                                                                View Minutes
                                                            </Button>
                                                            {item.google_drive_link && (
                                                                <Button asChild variant="ghost" size="sm">
                                                                    <a href={item.google_drive_link} target="_blank" rel="noopener noreferrer">
                                                                        <ExternalLink className="h-4 w-4" />
                                                                    </a>
                                                                </Button>
                                                            )}
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="destructive" size="icon" className="h-8 w-8">
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            This action cannot be undone. This will permanently delete your action item
                                                                            record from Supabase and the associated document from Google Drive.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleDeleteActionItem(item.id, item.google_drive_link)}>
                                                                            Continue
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
                            </div>
                        </TabsContent>
                    </Tabs>

                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <DialogContent className="max-w-6xl max-h-[90vh] w-[95vw] flex flex-col">
                            <DialogHeader>
                                <DialogTitle>{selectedMeeting?.meeting_name || "Meeting Minutes"}</DialogTitle>
                                <DialogDescription>
                                    Review the generated minutes and send them via email.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="flex-1 overflow-y-auto border rounded-md p-4 bg-muted/30 my-4">
                                {selectedMeeting?.html_content ? (
                                    <div
                                        className="prose prose-sm max-w-none dark:prose-invert"
                                        dangerouslySetInnerHTML={{ __html: selectedMeeting.html_content }}
                                    />
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No content available.
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="flex-col sm:flex-row gap-2 items-center border-t pt-4">
                                <div className="flex-1 w-full flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Enter email address..."
                                        value={emailToSend}
                                        onChange={(e) => setEmailToSend(e.target.value)}
                                        className="flex-1"
                                    />
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 sm:flex-none"
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        onClick={handleSendEmail}
                                        disabled={isSendingEmail}
                                        className="flex-1 sm:flex-none"
                                    >
                                        {isSendingEmail ? (
                                            <>
                                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="mr-2 h-4 w-4" />
                                                Send Email
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </main>
            </div>
        </div>
    );
};

export default MeetingActions;
