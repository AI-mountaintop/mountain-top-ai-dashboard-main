import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Send, BarChart3, RefreshCw, Calendar, Link as LinkIcon, ExternalLink, Mail, X, CheckCircle2, Loader2, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useJobProgress } from "@/contexts/JobProgressContext";
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
    json_content?: any;
    created_at: string;
}

const MeetingActions = () => {
    const navigate = useNavigate();
    const { startJob, getActiveJobByType, getProgressByType } = useJobProgress();
    
    const [inputType, setInputType] = useState<"link" | "transcript">("link");
    const [meetGeekUrl, setMeetGeekUrl] = useState("");
    const [meetingTranscript, setMeetingTranscript] = useState("");
    const [meetingTitle, setMeetingTitle] = useState("");
    const [activeTab, setActiveTab] = useState("input");

    // History state
    const [history, setHistory] = useState<MeetingActionItem[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Get active job and progress from global context
    const activeJob = getActiveJobByType('actionItems');
    const progress = getProgressByType('actionItems');
    const isGenerating = !!activeJob;

    // Analytics
    const analytics = useMemo(() => {
        const total = history.length;
        const successful = history.length;
        const failed = 0;
        return { total, successful, failed };
    }, [history]);

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

    // Switch to output tab if there's an active job
    useEffect(() => {
        if (activeJob) {
            setActiveTab("output");
        }
    }, [activeJob]);

    // Refresh history when job completes
    useEffect(() => {
        if (progress?.status === 'completed') {
            toast.success("Action items generated successfully!");
            fetchHistory();
            setTimeout(fetchHistory, 2000);
        } else if (progress?.status === 'failed') {
            toast.error(progress.error || "Failed to generate action items");
        }
    }, [progress?.status]);

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
            if (!meetingTitle.trim()) {
                toast.error("Please enter a meeting title");
                return;
            }
            if (!meetingTranscript.trim()) {
                toast.error("Please enter a meeting transcript");
                return;
            }
        }

        // Store values before clearing
        const urlToProcess = inputType === "link" ? meetGeekUrl.trim() : "";
        const transcriptToProcess = inputType === "transcript" ? meetingTranscript.trim() : "";
        const titleToProcess = inputType === "transcript" ? meetingTitle.trim() : "";
        
        // Clear input
        setMeetGeekUrl("");
        setMeetingTranscript("");
        setMeetingTitle("");
        setActiveTab("output");

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = await fetch(`${apiUrl}/api/action-items/generate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    meetGeekUrl: urlToProcess || undefined,
                    meetingTranscript: transcriptToProcess || undefined,
                    meetingTitle: titleToProcess || undefined,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to generate action items");
            }

            const result = await response.json();
            
            // Start tracking job in global context
            if (result.jobId) {
                startJob(result.jobId, 'actionItems');
                toast.success("Action items generation started");
            } else {
                toast.success("Action items generation started successfully");
                setTimeout(fetchHistory, 2000);
            }

        } catch (error) {
            console.error("Error generating action items:", error);
            toast.error("Failed to generate action items. Please try again.");
            setActiveTab("input");
        }
    };

    const openMeetingModal = (meeting: MeetingActionItem) => {
        // Navigate to detail page instead of modal
        navigate(`/meeting-actions/${meeting.id}`);
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
                    json_content: selectedMeeting.json_content,
                    email: emailToSend.trim(),
                    created_at: selectedMeeting.created_at,
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
        <div className="min-h-screen bg-background">
            <Sidebar />
            <div className="ml-64">
                <main className="container mx-auto px-12 py-12 max-w-6xl">
                    <PageHeader 
                        title="Meeting Actions" 
                        description="Convert meeting transcripts into actionable items"
                    />

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-3 bg-muted/50">
                            <TabsTrigger value="input" className="data-[state=active]:bg-background">Input</TabsTrigger>
                            <TabsTrigger value="output" className="data-[state=active]:bg-background">Generated Items</TabsTrigger>
                            <TabsTrigger value="analytics" className="data-[state=active]:bg-background">Analytics</TabsTrigger>
                        </TabsList>

                        <TabsContent value="input" className="space-y-6 mt-6">
                            <Card className="border-border">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold">Meeting Information</CardTitle>
                                    <CardDescription>
                                        Provide a MeetGeek URL or meeting transcript
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
                                            <Label htmlFor="meetgeek-url">MeetGeek URL</Label>
                                            <Input
                                                id="meetgeek-url"
                                                type="url"
                                                placeholder="https://meetgeek.ai/recording/..."
                                                value={meetGeekUrl}
                                                onChange={(e) => setMeetGeekUrl(e.target.value)}
                                                disabled={isGenerating}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Meeting title will be extracted automatically from the link
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-2">
                                                <Label htmlFor="meeting-title">Meeting Title *</Label>
                                                <Input
                                                    id="meeting-title"
                                                    type="text"
                                                    placeholder="e.g., Weekly Team Standup, Q1 Planning Meeting"
                                                    value={meetingTitle}
                                                    onChange={(e) => setMeetingTitle(e.target.value)}
                                                    disabled={isGenerating}
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Provide a descriptive title for this meeting
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="meeting-transcript">Meeting Transcript *</Label>
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
                                                Generate Action Items
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="output" className="space-y-6 mt-6">
                            {/* Progress Card - Show when generating */}
                            {(isGenerating || progress) && (
                                <Card className="border-border bg-muted/30">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-semibold">Generation Progress</CardTitle>
                                        <CardDescription>
                                            Please wait while action items are being generated
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
                                        <CardTitle className="text-lg font-semibold">Generated Items</CardTitle>
                                        <CardDescription>
                                            History of all generated action items
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
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => openMeetingModal(item)}
                                                                className="border-border"
                                                            >
                                                                View
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
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Delete action item?</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            This will permanently delete the action item from the database and Google Drive.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleDeleteActionItem(item.id, item.google_drive_link)} className="bg-destructive hover:bg-destructive/90">
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
                                            <p className="text-sm mb-2">No action items yet</p>
                                            <Button variant="link" onClick={() => setActiveTab("input")} className="text-sm">
                                                Create your first item
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="analytics" className="space-y-6 mt-6">
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
                                            All action items generated
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
                                        <div className="text-3xl font-semibold text-green-700">{analytics.successful}</div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Requests completed
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

                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
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
