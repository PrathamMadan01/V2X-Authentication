import { Router } from "express";

const router = Router();

// In-memory store for latest GPS data
export const gpsData = new Map<string, any>();
export const accidentHistory: any[] = [];

router.post("/update", (req, res) => {
  const { vehicleId, lat, long, speed, timestamp } = req.body;
  if (!vehicleId || !lat || !long) {
    return res.status(400).json({ error: "Missing GPS data" });
  }

  const data = { vehicleId, lat, long, speed, timestamp: timestamp || Date.now() };
  gpsData.set(vehicleId, data);
  
  // Simple accident detection logic on backend (redundant if vehicle reports, but good for safety)
  console.log(`GPS Update [${vehicleId}]: ${lat}, ${long} @ ${speed}km/h`);
  return res.json({ status: "updated" });
});

router.get("/latest/:vehicleId", (req, res) => {
  const { vehicleId } = req.params;
  const data = gpsData.get(vehicleId);
  if (!data) return res.status(404).json({ error: "No data found" });
  return res.json(data);
});

// Admin Endpoint: Get all active vehicles
router.get("/all", (req, res) => {
    const vehicles = Array.from(gpsData.values());
    return res.json(vehicles);
});

router.post("/report-accident", (req, res) => {
    const { vehicleId, location, speed, details, timestamp } = req.body;
    const record = { vehicleId, location, speed, details, timestamp: timestamp || Date.now() };
    accidentHistory.push(record);
    console.log("!!! ACCIDENT REPORTED !!!", record);
    return res.json({ status: "recorded", record });
});

router.get("/accidents", (req, res) => {
    return res.json(accidentHistory);
});

export default router;
