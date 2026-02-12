import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import db from './db.js';
import { calculateQuote } from './pricing.js';

const app = express();
const port = Number(process.env.PORT || 4000);
const feePercent = Number(process.env.PLATFORM_FEE_PERCENT || 12);

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || '*' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'movenear-backend' });
});

app.post('/api/quote', (req, res) => {
  const quote = calculateQuote(req.body || {});
  res.json(quote);
});

app.post('/api/rides', (req, res) => {
  const {
    riderName,
    mode,
    fromLabel,
    toLabel,
    distanceKm,
    radiusMeters,
    zone,
    vehicleClass
  } = req.body || {};

  if (!riderName || !mode || !fromLabel || !toLabel) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const quote = calculateQuote({ mode, distanceKm, radiusMeters, zone, vehicleClass });
  const insert = db.prepare(`
    INSERT INTO rides (
      rider_name, mode, from_label, to_label, distance_km, radius_meters, zone, vehicle_class, amount, currency
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insert.run(
    riderName,
    mode,
    fromLabel,
    toLabel,
    Number(distanceKm),
    Number(radiusMeters),
    zone || 'urban',
    vehicleClass || 'economy',
    quote.recommended,
    quote.currency
  );

  return res.status(201).json({ rideId: result.lastInsertRowid, quote });
});

app.get('/api/rides/active', (_req, res) => {
  const rows = db.prepare("SELECT * FROM rides WHERE status IN ('requested', 'matched') ORDER BY id DESC LIMIT 50").all();
  res.json({ items: rows });
});

app.post('/api/payments/intent', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe not configured. Add STRIPE_SECRET_KEY.' });
  }

  const { rideId } = req.body || {};
  const ride = db.prepare('SELECT * FROM rides WHERE id = ?').get(rideId);

  if (!ride) {
    return res.status(404).json({ error: 'Ride not found' });
  }

  const amountCents = Math.round(Number(ride.amount) * 100);
  const transferToDriverCents = Math.round(amountCents * (1 - feePercent / 100));

  const intent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: ride.currency,
    metadata: {
      ride_id: String(ride.id),
      rider_name: ride.rider_name,
      transfer_to_driver_cents: String(transferToDriverCents)
    },
    automatic_payment_methods: { enabled: true }
  });

  res.json({
    clientSecret: intent.client_secret,
    amount: ride.amount,
    currency: ride.currency,
    platformFeePercent: feePercent
  });
});

app.listen(port, () => {
  console.log(`MoveNear backend listening on :${port}`);
});
