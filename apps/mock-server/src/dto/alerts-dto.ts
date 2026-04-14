export interface ExternalAlert {
  id: number;
  location_title: string;
  location_type: string;
  started_at: string;
  finished_at: string | null;
  updated_at: string;
  location_uid: number;
  location_oblast: string;
  location_raion: string | null;
  notes: string | null;
  calculated: boolean;
  alert_type: string;
}
