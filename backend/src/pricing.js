const zoneMultiplier = {
  urban: 1.0,
  suburban: 0.9,
  highway: 0.95,
  remote: 1.15
};

const vehicleMultiplier = {
  economy: 1.0,
  comfort: 1.25,
  van: 1.5,
  bus: 1.8
};

const radiusDiscount = {
  200: 1.0,
  1000: 0.9,
  2000: 0.82
};

export function calculateQuote({
  mode,
  distanceKm,
  radiusMeters,
  zone = 'urban',
  vehicleClass = 'economy'
}) {
  const safeDistance = Math.max(Number(distanceKm || 0), 0.5);
  const baseFare = mode === 'long' ? 2.5 : 1.2;
  const perKm = mode === 'long' ? 0.23 : 0.42;

  const z = zoneMultiplier[zone] || 1.0;
  const v = vehicleMultiplier[vehicleClass] || 1.0;
  const r = radiusDiscount[String(radiusMeters)] || 1.0;

  const subtotal = (baseFare + safeDistance * perKm) * z * v * r;
  const recommended = Number(subtotal.toFixed(2));

  return {
    recommended,
    currency: 'eur',
    meta: { baseFare, perKm, z, v, r }
  };
}
