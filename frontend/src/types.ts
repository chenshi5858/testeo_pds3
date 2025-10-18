export interface SlideSummary {
  index: number;
  text: string;
}

export interface ClassRecord {
  id: string;
  title: string;
  course: string;
  level: string;
  created_at: string;
  presentation_file: string;
  pdf_path: string;
  slides: SlideSummary[];
  total_slides: number;
  status: 'ready' | 'live' | 'ended';
  current_slide: number;
  session: null | {
    started_at: string;
  };
}
