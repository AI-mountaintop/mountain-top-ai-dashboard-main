export interface MeetingParticipant {
  name: string;
  role: string | null;
}

export interface DiscussionTopic {
  topic: string;
  summary: string;
}

export interface Subtask {
  id: string;
  task: string;
  assignee: string | null;
  deadline: string | null;
}

export interface ActionItem {
  id: number;
  task: string;
  assignee: string | null;
  deadline: string | null;
  priority: 'High' | 'Medium' | 'Low';
  type: string;
  details: string | null;
  subtasks: Subtask[];
  completed?: boolean;
}

export interface MeetingSentiment {
  score: number;
  summary: string;
  highlights: string[];
}

export interface MeetingInfo {
  title: string;
  date: string | null;
  time: string | null;
  duration: string | null;
  recording_link: string | null;
}

export interface MeetingJSON {
  meeting: MeetingInfo;
  participants: MeetingParticipant[];
  executive_summary: string[];
  decisions_made: string[];
  discussion_topics: DiscussionTopic[];
  action_items: ActionItem[];
  sentiment: MeetingSentiment;
  next_steps: string[];
}

export interface MeetingActionItem {
  id: string;
  meeting_name: string;
  meetgeek_url: string;
  google_drive_link: string;
  html_content: string;
  json_content: MeetingJSON | null;
  created_at: string;
}
