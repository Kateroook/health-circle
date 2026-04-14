import cors from 'cors';
import express, { Request, Response } from 'express';
import { ExternalAlert } from './dto/alerts-dto';

const app = express();
app.use(cors());
app.use(express.json());

let activeAlerts: Map<number, ExternalAlert> = new Map();

app.get('/v1/alerts/active.json', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.status(200).json({
    alerts: Array.from(activeAlerts.values()),
  });
});

app.post('/__admin/start', (req: Request, res: Response) => {
  const { locationUid, locationTitle, alertType } = req.body;

  const newAlert: ExternalAlert = {
    id: Math.floor(Math.random() * 100000),
    location_title: locationTitle || 'Київська область',
    location_type: 'oblast',
    started_at: new Date().toISOString(),
    finished_at: null,
    updated_at: new Date().toISOString(),
    location_uid: locationUid || 10,
    location_oblast: locationTitle || 'Київська область',
    location_raion: null,
    notes: 'Mocked alert',
    calculated: false,
    alert_type: alertType || 'air_raid', // air_raid, artillery_shelling, etc.
  };

  activeAlerts.set(newAlert.location_uid, newAlert);
  res.status(200).json({ success: true, alert: newAlert });
});

app.post('/__admin/stop', (req: Request, res: Response) => {
  const { locationUid } = req.body;
  activeAlerts.delete(locationUid);
  res.status(200).json({ success: true });
});

app.post('/__admin/reset', (req: Request, res: Response) => {
  activeAlerts.clear();
  res.status(200).json({ success: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Alerts Mock Server running on port ${PORT}`);
});
