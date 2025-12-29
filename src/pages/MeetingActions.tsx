import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Send, BarChart3, RefreshCw, Calendar, Link as LinkIcon, ExternalLink, Mail, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface MeetingActionItem {
    id: string;
    meeting_name: string;
    meetgeek_url: string;
    google_drive_link: string;
    html_content: string;
    created_at: string;
}

const MeetingActions = () => {
    const [meetGeekUrl, setMeetGeekUrl] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState("input");

    // History state
    const [history, setHistory] = useState<MeetingActionItem[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

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

    const handleGenerate = async () => {
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

        setIsGenerating(true);

        try {
            const response = await fetch("https://mountaintop.app.n8n.cloud/webhook/action-items", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    meetGeekUrl: meetGeekUrl.trim(),
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
            setTimeout(fetchHistory, 5000);

        } catch (error) {
            console.error("Error generating action items:", error);
            toast.error("Failed to generate action items. Please try again.");
        } finally {
            setIsGenerating(false);
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
            const response = await fetch("https://mountaintop.app.n8n.cloud/webhook/d726ee80-72d0-4cba-bb9d-4cdbed81be64", {
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
                throw new Error("Failed to send email");
            }

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
                                        Provide the MeetGeek recording URL to generate action items
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
