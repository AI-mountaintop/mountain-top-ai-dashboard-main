import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface EmailMeetingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  meetingName: string;
  htmlContent: string;
  jsonContent?: any;
  createdAt?: string;
  completedItemIds?: number[];
}

export const EmailMeetingDialog = ({
  isOpen,
  onClose,
  meetingName,
  htmlContent,
  jsonContent,
  createdAt,
  completedItemIds = [],
}: EmailMeetingDialogProps) => {
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState(`Meeting action items for :- ${meetingName}`);
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSending(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${API_URL}/api/action-items/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          meeting_name: meetingName,
          html_content: htmlContent,
          json_content: jsonContent,
          created_at: createdAt,
          completed_item_ids: completedItemIds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send email');
      }

      toast.success(`Email sent successfully to ${email}`);
      setEmail('');
      onClose();
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSending) {
      setEmail('');
      onClose();
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isSending) {
      setEmail('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]" onPointerDownOutside={(e) => isSending && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Email Meeting Minutes
          </DialogTitle>
          <DialogDescription>
            Send the meeting minutes and action items to an email address
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Recipient Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="john.doe@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSending}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isSending}
            />
          </div>

          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="p-3 rounded-lg border bg-muted/30 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">{meetingName}</p>
              <p className="text-xs">
                This email will include the full meeting summary, action items, decisions, and next steps.
                {completedItemIds.length > 0 && (
                  <span className="block mt-1 text-green-600">
                    {completedItemIds.length} completed item{completedItemIds.length > 1 ? 's' : ''} will be excluded from action items.
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={isSending}
            className="min-w-[100px]"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
