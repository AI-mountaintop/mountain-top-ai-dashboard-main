import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    ArrowLeft, 
    Calendar, 
    Clock, 
    Users, 
    FileText,
    CheckCircle2, 
    AlertCircle,
    Mail,
    Copy,
    ChevronDown,
    ChevronRight,
    ExternalLink,
    Lightbulb,
    MessageSquare,
    Target,
    TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { EmailMeetingDialog } from "@/components/modals/EmailMeetingDialog";

interface MeetingData {
    id: string;
    meeting_name: string;
    html_content: string;
    json_content: any;
    google_drive_link: string;
    meetgeek_url?: string;
    created_at: string;
}

interface Participant {
    name: string;
    role: string | null;
}

interface ActionItem {
    id: number;
    task: string;
    assignee: string | null;
    deadline: string | null;
    priority: "P1" | "P2" | "P3" | "P4" | "High" | "Medium" | "Low";
    type: string;
    category?: string;
    details: string | null;
    subtasks: Array<{
        id: string;
        task: string;
        assignee: string | null;
        deadline: string | null;
    }>;
}

const MeetingMinutesDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [meeting, setMeeting] = useState<MeetingData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
    const [completedItems, setCompletedItems] = useState<Set<number>>(new Set());
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary', 'decisions', 'actions']));
    const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);

    useEffect(() => {
        if (id) {
            fetchMeetingDetails();
        }
    }, [id]);

    const fetchMeetingDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('meeting_action_items')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setMeeting(data);
        } catch (error) {
            console.error("Error fetching meeting:", error);
            toast.error("Failed to load meeting details");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (meeting?.json_content) {
            const text = formatJSONAsText(meeting.json_content);
            navigator.clipboard.writeText(text);
            toast.success("Content copied to clipboard");
        }
    };

    const formatJSONAsText = (json: any): string => {
        let text = `${json.meeting?.title || 'Meeting Summary'}\n`;
        
        // Meeting info
        if (json.meeting?.date) text += `Date: ${json.meeting.date}\n`;
        if (json.meeting?.time) text += `Time: ${json.meeting.time}\n`;
        if (json.meeting?.duration) text += `Duration: ${json.meeting.duration}\n`;
        text += '\n';

        // Participants
        if (json.participants?.length) {
            text += "PARTICIPANTS\n";
            text += json.participants.map((p: Participant) => 
                `- ${p.name}${p.role ? ` (${p.role})` : ''}`
            ).join('\n') + '\n\n';
        }

        // Executive Summary
        if (json.executive_summary?.length) {
            text += "EXECUTIVE SUMMARY\n";
            text += json.executive_summary.map((s: string) => `- ${s}`).join('\n') + '\n\n';
        }

        // Decisions Made
        if (json.decisions_made?.length) {
            text += "DECISIONS MADE\n";
            text += json.decisions_made.map((d: string) => `- ${d}`).join('\n') + '\n\n';
        }

        // Action Items
        if (json.action_items?.length) {
            text += "ACTION ITEMS\n";
            text += json.action_items.map((item: ActionItem) => {
                let itemText = `- [${item.priority}] ${item.task}`;
                if (item.assignee) itemText += ` | Assignee: ${item.assignee}`;
                if (item.deadline) itemText += ` | Deadline: ${item.deadline}`;
                if (item.category) itemText += ` | Category: ${item.category}`;
                if (item.details) itemText += `\n  Details: ${item.details}`;
                if (item.subtasks?.length) {
                    itemText += '\n  Subtasks:';
                    item.subtasks.forEach(st => {
                        itemText += `\n    • ${st.task}`;
                        if (st.assignee) itemText += ` (${st.assignee})`;
                        if (st.deadline) itemText += ` - ${st.deadline}`;
                    });
                }
                return itemText;
            }).join('\n\n') + '\n\n';
        }

        // Sentiment
        if (json.sentiment?.score) {
            text += "MEETING SENTIMENT\n";
            text += `Score: ${json.sentiment.score}/5\n`;
            if (json.sentiment.summary) text += `${json.sentiment.summary}\n`;
            text += '\n';
        }

        // Next Steps
        if (json.next_steps?.length) {
            text += "NEXT STEPS\n";
            text += json.next_steps.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n') + '\n';
        }

        return text;
    };

    const toggleItemExpand = (itemId: number) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    };

    const toggleItemComplete = (itemId: number) => {
        setCompletedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    };

    const toggleSection = (section: string) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(section)) {
                newSet.delete(section);
            } else {
                newSet.add(section);
            }
            return newSet;
        });
    };

    const getPriorityColor = (priority: string) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'bg-red-50 text-red-600 border-red-200';
            case 'medium': return 'bg-amber-50 text-amber-600 border-amber-200';
            case 'low': return 'bg-green-50 text-green-600 border-green-200';
            default: return 'bg-gray-50 text-gray-600 border-gray-200';
        }
    };

    const getParticipantColor = (index: number) => {
        const colors = ['bg-orange-100 text-orange-700', 'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-purple-100 text-purple-700', 'bg-pink-100 text-pink-700'];
        return colors[index % colors.length];
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Sidebar />
                <div className="ml-64">
                    <div className="flex items-center justify-center h-screen">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
                            <p className="text-sm text-muted-foreground">Loading meeting details...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Not found state
    if (!meeting) {
        return (
            <div className="min-h-screen bg-background">
                <Sidebar />
                <div className="ml-64">
                    <div className="flex items-center justify-center h-screen">
                        <div className="text-center">
                            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                            <p className="text-sm text-muted-foreground mb-4">Meeting not found</p>
                            <Button onClick={() => navigate('/meeting-actions')} variant="outline">
                                Back to Meetings
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Parse JSON content or use fallback
    const jsonData = meeting.json_content || {};
    const meetingInfo = jsonData.meeting || {};
    const participants: Participant[] = jsonData.participants || [];
    const executiveSummary: string[] = jsonData.executive_summary || [];
    const decisionsMade: string[] = jsonData.decisions_made || [];
    const actionItems: ActionItem[] = jsonData.action_items || [];
    const sentiment = jsonData.sentiment || {};
    const nextSteps: string[] = jsonData.next_steps || [];

    const completedCount = completedItems.size;
    const totalItems = actionItems.length;

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <div className="ml-64">
                <main className="container mx-auto px-12 py-12 max-w-6xl">
                    {/* Back Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/meeting-actions?tab=output')}
                        className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to list
                    </Button>

                    {/* Header */}
                    <div className="flex items-start justify-between mb-8">
                        <div className="flex-1">
                            <h1 className="text-3xl font-semibold mb-3 tracking-tight">
                                {meetingInfo.title || meeting.meeting_name || "Meeting Minutes"}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>{meetingInfo.date || format(new Date(meeting.created_at), "MMMM d, yyyy")}</span>
                                </div>
                                {meetingInfo.time && (
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        <span>{meetingInfo.time}</span>
                                    </div>
                                )}
                                {meetingInfo.duration && (
                                    <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium">
                                        {meetingInfo.duration}
                                    </span>
                                )}
                                {(meetingInfo.recording_link || meeting.meetgeek_url) && (
                                    <a 
                                        href={meetingInfo.recording_link || meeting.meetgeek_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium hover:bg-blue-100 transition-colors"
                                    >
                                        <ExternalLink className="h-3 w-3" />
                                        Meeting Link
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy all content">
                                <Copy className="h-4 w-4" />
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setIsEmailDialogOpen(true)}
                                title="Email"
                            >
                                <Mail className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Participants Section */}
                    {participants.length > 0 && (
                        <Card className="border-border mb-6">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <CardTitle className="text-base font-medium">Participants</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-3">
                                    {participants.map((participant, index) => (
                                        <div key={index} className="flex items-center gap-3 bg-muted/30 rounded-full px-4 py-2">
                                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium", getParticipantColor(index))}>
                                                {participant.name?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{participant.name}</p>
                                                {participant.role && (
                                                    <p className="text-xs text-muted-foreground">{participant.role}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Sentiment */}
                    {sentiment.score && (
                        <Card className="border-border mb-6">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-blue-500" />
                                    <CardTitle className="text-base font-medium">Meeting Sentiment</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 mb-3">
                                    <span className="text-3xl font-semibold text-green-600">{sentiment.score}/5</span>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <div 
                                                key={star}
                                                className={cn(
                                                    "w-2 h-6 rounded-sm",
                                                    star <= sentiment.score ? "bg-green-500" : "bg-muted"
                                                )}
                                            />
                                        ))}
                                    </div>
                                </div>
                                {sentiment.summary && (
                                    <p className="text-sm text-muted-foreground">{sentiment.summary}</p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Executive Summary */}
                    {executiveSummary.length > 0 && (
                        <Card className="border-border mb-6">
                            <CardHeader 
                                className="pb-4 cursor-pointer"
                                onClick={() => toggleSection('summary')}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Lightbulb className="h-4 w-4 text-amber-500" />
                                        <CardTitle className="text-base font-medium">Executive Summary</CardTitle>
                                    </div>
                                    {expandedSections.has('summary') ? (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </div>
                            </CardHeader>
                            {expandedSections.has('summary') && (
                                <CardContent>
                                    <ul className="space-y-3">
                                        {executiveSummary.map((item, index) => (
                                            <li key={index} className="flex items-start gap-3">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0"></span>
                                                <span className="text-sm text-foreground/90 leading-relaxed">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            )}
                        </Card>
                    )}

                    {/* Decisions Made */}
                    {decisionsMade.length > 0 && (
                        <Card className="border-border mb-6">
                            <CardHeader 
                                className="pb-4 cursor-pointer"
                                onClick={() => toggleSection('decisions')}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        <CardTitle className="text-base font-medium">Decisions Made</CardTitle>
                                    </div>
                                    {expandedSections.has('decisions') ? (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </div>
                            </CardHeader>
                            {expandedSections.has('decisions') && (
                                <CardContent>
                                    <ul className="space-y-3">
                                        {decisionsMade.map((item, index) => (
                                            <li key={index} className="flex items-start gap-3">
                                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-sm text-foreground/90 leading-relaxed">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            )}
                        </Card>
                    )}

                    {/* Action Items */}
                    {actionItems.length > 0 && (
                        <Card className="border-border mb-6">
                            <CardHeader 
                                className="pb-4 cursor-pointer"
                                onClick={() => toggleSection('actions')}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Target className="h-4 w-4 text-orange-500" />
                                        <CardTitle className="text-base font-medium">Action Items</CardTitle>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-muted-foreground">
                                            {completedCount} of {totalItems} completed
                                        </span>
                                        {expandedSections.has('actions') ? (
                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            {expandedSections.has('actions') && (
                                <CardContent className="pt-0">
                                    <div className="space-y-1">
                                        {actionItems.map((item) => (
                                            <div key={item.id}>
                                                {/* Main Task Row - Compact Style with Fixed Widths */}
                                                <div 
                                                    className={cn(
                                                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group",
                                                        completedItems.has(item.id) ? "bg-muted/30" : "hover:bg-muted/20"
                                                    )}
                                                >
                                                    {/* Checkbox */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleItemComplete(item.id);
                                                        }}
                                                        className={cn(
                                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                                                            completedItems.has(item.id) 
                                                                ? "bg-green-500 border-green-500" 
                                                                : "border-muted-foreground/30 hover:border-orange-500"
                                                        )}
                                                    >
                                                        {completedItems.has(item.id) && (
                                                            <CheckCircle2 className="h-3 w-3 text-white" />
                                                        )}
                                                    </button>

                                                    {/* Task Title - Flexible width */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className={cn(
                                                            "text-sm font-medium",
                                                            completedItems.has(item.id) && "line-through text-muted-foreground"
                                                        )}>
                                                            {item.task}
                                                        </p>
                                                        {item.subtasks && item.subtasks.length > 0 && !expandedItems.has(item.id) && (
                                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                                {item.subtasks.length} subtask{item.subtasks.length > 1 ? 's' : ''}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Assignee - Fixed width */}
                                                    <div className="w-24 text-right flex-shrink-0">
                                                        {item.assignee && (
                                                            <span className="text-xs text-muted-foreground">
                                                                {item.assignee}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Deadline - Fixed width */}
                                                    <div className="w-28 text-right flex-shrink-0">
                                                        {item.deadline && (
                                                            <span className="text-xs text-muted-foreground">
                                                                {item.deadline}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Priority Badge - Fixed width */}
                                                    <div className="w-20 flex-shrink-0 text-right">
                                                        <span className={cn(
                                                            "inline-block text-xs px-2.5 py-1 rounded-md font-medium",
                                                            (item.priority === 'P1' || item.priority === 'High')
                                                                ? "bg-red-50 text-red-700" 
                                                                : (item.priority === 'P2' || item.priority === 'Medium')
                                                                ? "bg-orange-50 text-orange-700"
                                                                : (item.priority === 'P3')
                                                                ? "bg-yellow-50 text-yellow-700"
                                                                : "bg-green-50 text-green-700"
                                                        )}>
                                                            {item.priority === 'P1' ? 'High' : 
                                                             item.priority === 'P2' ? 'Medium' :
                                                             item.priority === 'P3' ? 'Medium' :
                                                             item.priority === 'P4' ? 'Low' :
                                                             item.priority}
                                                        </span>
                                                    </div>

                                                    {/* Expand Arrow - Only if has subtasks */}
                                                    <div className="w-6 flex-shrink-0">
                                                        {item.subtasks && item.subtasks.length > 0 && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleItemExpand(item.id);
                                                                }}
                                                                className="p-1 hover:bg-muted rounded transition-colors"
                                                            >
                                                                {expandedItems.has(item.id) ? (
                                                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                                ) : (
                                                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Subtasks - Expanded */}
                                                {expandedItems.has(item.id) && item.subtasks && item.subtasks.length > 0 && (
                                                    <div className="ml-12 mr-4 mb-2 space-y-1.5 mt-1">
                                                        {item.subtasks.map((subtask, stIndex) => (
                                                            <div key={stIndex} className="flex items-start gap-2 text-sm py-1.5 px-3 rounded bg-muted/30">
                                                                <span className="w-1 h-1 rounded-full bg-muted-foreground/40 mt-2 flex-shrink-0"></span>
                                                                <span className="flex-1 text-muted-foreground">{subtask.task}</span>
                                                                {subtask.assignee && (
                                                                    <span className="text-xs text-muted-foreground">({subtask.assignee})</span>
                                                                )}
                                                                {subtask.deadline && (
                                                                    <span className="text-xs text-muted-foreground">{subtask.deadline}</span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    )}

                    {/* Next Steps */}
                    {nextSteps.length > 0 && (
                        <Card className="border-border mb-6">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-purple-500" />
                                    <CardTitle className="text-base font-medium">Next Steps</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {nextSteps.map((item, index) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-medium flex-shrink-0">
                                                {index + 1}
                                            </span>
                                            <span className="text-sm text-foreground/90 leading-relaxed">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    {/* Empty State - No JSON Data */}
                    {!jsonData.meeting && !participants.length && !executiveSummary.length && !actionItems.length && (
                        <Card className="border-border">
                            <CardContent className="py-16 text-center">
                                <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                                <h3 className="text-lg font-medium mb-2">No structured data available</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    This meeting was processed before the new format was implemented.
                                </p>
                                {meeting.google_drive_link && (
                                    <Button asChild variant="outline">
                                        <a href={meeting.google_drive_link} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            View in Google Docs
                                        </a>
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-8 border-t border-border mt-8">
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/meeting-actions')}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        {meeting.google_drive_link && (
                            <Button asChild className="bg-primary hover:bg-primary/90">
                                <a href={meeting.google_drive_link} target="_blank" rel="noopener noreferrer">
                                    <FileText className="h-4 w-4 mr-2" />
                                    View in Google Docs
                                </a>
                            </Button>
                        )}
                    </div>
                </main>
            </div>

            {/* Email Dialog */}
            <EmailMeetingDialog
                isOpen={isEmailDialogOpen}
                onClose={() => setIsEmailDialogOpen(false)}
                meetingName={meetingInfo.title || meeting.meeting_name || "Meeting Minutes"}
                htmlContent={meeting.html_content || ""}
                jsonContent={meeting.json_content}
                createdAt={meeting.created_at}
                completedItemIds={Array.from(completedItems)}
            />
        </div>
    );
};

export default MeetingMinutesDetail;
