import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import { api } from './src/api';
import { GlassCard } from './src/components/GlassCard';
import { colors } from './src/theme';

const pk = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

function RideForm() {
  const stripe = useStripe();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('near');
  const [riderName, setRiderName] = useState('Citizen X');
  const [fromLabel, setFromLabel] = useState('Current GPS');
  const [toLabel, setToLabel] = useState('Approx point B');
  const [distanceKm, setDistanceKm] = useState('8');
  const [radiusMeters, setRadiusMeters] = useState('1000');
  const [vehicleClass, setVehicleClass] = useState('economy');
  const [quote, setQuote] = useState(null);

  const payload = useMemo(
    () => ({
      riderName,
      mode,
      fromLabel,
      toLabel,
      distanceKm: Number(distanceKm),
      radiusMeters: Number(radiusMeters),
      zone: 'urban',
      vehicleClass
    }),
    [riderName, mode, fromLabel, toLabel, distanceKm, radiusMeters, vehicleClass]
  );

  const runQuote = async () => {
    setLoading(true);
    try {
      const q = await api.quote(payload);
      setQuote(q);
    } catch (e) {
      Alert.alert('Quote error', String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  const bookAndPay = async () => {
    setLoading(true);
    try {
      const created = await api.createRide(payload);
      const payment = await api.createPaymentIntent(created.rideId);

      const init = await stripe.initPaymentSheet({
        merchantDisplayName: 'MoveNear',
        paymentIntentClientSecret: payment.clientSecret
      });

      if (init.error) {
        throw new Error(init.error.message);
      }

      const present = await stripe.presentPaymentSheet();
      if (present.error) {
        throw new Error(present.error.message);
      }

      Alert.alert('Success', `Ride #${created.rideId} paid successfully.`);
    } catch (e) {
      Alert.alert('Payment error', String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>MoveNear</Text>
      <Text style={styles.subtitle}>Affordable mobility with approximate drop-off</Text>

      <GlassCard>
        <Text style={styles.label}>Mode</Text>
        <View style={styles.row}>
          {['near', 'long'].map((m) => (
            <TouchableOpacity key={m} style={[styles.chip, mode === m && styles.chipActive]} onPress={() => setMode(m)}>
              <Text style={styles.chipText}>{m === 'near' ? 'NearRide' : 'LongRide'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Field label="Passenger" value={riderName} onChangeText={setRiderName} />
        <Field label="From" value={fromLabel} onChangeText={setFromLabel} />
        <Field label="To (approx)" value={toLabel} onChangeText={setToLabel} />
        <Field label="Distance (km)" value={distanceKm} onChangeText={setDistanceKm} keyboardType="numeric" />

        <Text style={styles.label}>Drop-off radius</Text>
        <View style={styles.row}>
          {['200', '1000', '2000'].map((r) => (
            <TouchableOpacity key={r} style={[styles.chip, radiusMeters === r && styles.chipActive]} onPress={() => setRadiusMeters(r)}>
              <Text style={styles.chipText}>{r}m</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Vehicle class</Text>
        <View style={styles.row}>
          {['economy', 'comfort', 'van', 'bus'].map((v) => (
            <TouchableOpacity key={v} style={[styles.chip, vehicleClass === v && styles.chipActive]} onPress={() => setVehicleClass(v)}>
              <Text style={styles.chipText}>{v}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={runQuote} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Loading...' : 'Calculate price'}</Text>
        </TouchableOpacity>

        {quote && (
          <View style={styles.quoteBox}>
            <Text style={styles.quoteText}>Recommended: {quote.recommended} {quote.currency.toUpperCase()}</Text>
          </View>
        )}

        <TouchableOpacity style={[styles.button, styles.payButton]} onPress={bookAndPay} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Processing...' : 'Book & Pay'}</Text>
        </TouchableOpacity>
      </GlassCard>
    </ScrollView>
  );
}

function Field({ label, ...props }) {
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...props} placeholderTextColor={colors.muted} style={styles.input} />
    </View>
  );
}

export default function App() {
  return (
    <StripeProvider publishableKey={pk}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <RideForm />
      </SafeAreaView>
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgStart
  },
  content: {
    padding: 16,
    paddingBottom: 40
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '700'
  },
  subtitle: {
    color: colors.muted,
    marginBottom: 16
  },
  label: {
    color: colors.text,
    marginBottom: 6,
    marginTop: 4
  },
  input: {
    color: colors.text,
    borderColor: colors.glassStroke,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.08)'
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.glassStroke,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.05)'
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(109, 211, 255, 0.2)'
  },
  chipText: {
    color: colors.text,
    fontSize: 12
  },
  button: {
    marginTop: 14,
    backgroundColor: colors.accent2,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12
  },
  payButton: {
    backgroundColor: colors.success
  },
  buttonText: {
    color: '#09101F',
    fontWeight: '700'
  },
  quoteBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)'
  },
  quoteText: {
    color: colors.text,
    fontWeight: '600'
  }
});
