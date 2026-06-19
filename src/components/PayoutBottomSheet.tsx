import { SymbolView } from 'expo-symbols';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  FEE_RATES,
  MIN_PAYOUT,
  PayoutMethod,
  PayoutResponse,
  calcFee,
  requestPayout,
} from '@/services/payouts';

type Step = 'method' | 'amount' | 'confirm' | 'success';

interface Props {
  visible: boolean;
  availableBalance: number;
  onClose: () => void;
  onSuccess: (payout: PayoutResponse) => void;
}

const METHODS: { id: PayoutMethod; label: string; icon: string }[] = [
  { id: 'bank', label: 'Bank Transfer', icon: 'building.columns' },
  { id: 'paypal', label: 'PayPal', icon: 'creditcard' },
  { id: 'btc', label: 'Bitcoin', icon: 'bitcoinsign.circle' },
  { id: 'stellar', label: 'Stellar', icon: 'star.circle' },
];

const ARRIVAL: Record<PayoutMethod, string> = {
  bank: '2–5 business days',
  paypal: 'Within 24 hours',
  btc: '1–2 hours',
  stellar: 'Under 5 seconds',
};

export default function PayoutBottomSheet({ visible, availableBalance, onClose, onSuccess }: Props) {
  const theme = useTheme();
  const [step, setStep] = useState<Step>('method');
  const [method, setMethod] = useState<PayoutMethod>('bank');
  const [amountText, setAmountText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PayoutResponse | null>(null);
  const inputRef = useRef<TextInput>(null);

  const amount = parseFloat(amountText) || 0;
  const fee = calcFee(amount, method);
  const net = amount - fee;

  function reset() {
    setStep('method');
    setMethod('bank');
    setAmountText('');
    setError('');
    setLoading(false);
    setResult(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function validateAmount(): boolean {
    if (amount < MIN_PAYOUT) {
      setError(`Minimum payout is $${MIN_PAYOUT}`);
      return false;
    }
    if (amount > availableBalance) {
      setError(`Cannot exceed available balance ($${availableBalance.toFixed(2)})`);
      return false;
    }
    setError('');
    return true;
  }

  async function handleConfirm() {
    setLoading(true);
    setError('');
    try {
      const payout = await requestPayout({ amount, method });
      setResult(payout);
      setStep('success');
      onSuccess(payout);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const isDark = theme.background === '#000000';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetWrapper}>
        <ThemedView style={[styles.sheet, { borderColor: theme.backgroundElement }]}>
          {/* Handle bar */}
          <View style={[styles.handle, { backgroundColor: theme.backgroundElement }]} />

          {/* Header */}
          <View style={styles.header}>
            {step !== 'method' && step !== 'success' && (
              <Pressable
                onPress={() => setStep(step === 'confirm' ? 'amount' : 'method')}
                style={styles.iconBtn}>
                <SymbolView
                  name={{ ios: 'chevron.left', android: 'keyboard_arrow_left', web: 'chevron_backward' }}
                  size={20}
                  tintColor={theme.text}
                />
              </Pressable>
            )}
            <ThemedText type="smallBold" style={styles.headerTitle}>
              {step === 'method' && 'Request Payout'}
              {step === 'amount' && 'Enter Amount'}
              {step === 'confirm' && 'Confirm Payout'}
              {step === 'success' && 'Payout Requested!'}
            </ThemedText>
            <Pressable onPress={handleClose} style={styles.iconBtn}>
              <SymbolView
                name={{ ios: 'xmark', android: 'close', web: 'close' }}
                size={18}
                tintColor={theme.textSecondary}
              />
            </Pressable>
          </View>

          {/* Step: Method */}
          {step === 'method' && (
            <View style={styles.body}>
              {METHODS.map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => { setMethod(m.id); setStep('amount'); }}
                  style={({ pressed }) => [
                    styles.methodRow,
                    { backgroundColor: theme.backgroundElement },
                    pressed && { opacity: 0.7 },
                  ]}>
                  <SymbolView
                    name={{ ios: m.icon as never, android: m.icon as never, web: m.icon as never }}
                    size={24}
                    tintColor={theme.text}
                  />
                  <ThemedText style={styles.methodLabel}>{m.label}</ThemedText>
                  <SymbolView
                    name={{ ios: 'chevron.right', android: 'keyboard_arrow_right', web: 'chevron_forward' }}
                    size={16}
                    tintColor={theme.textSecondary}
                  />
                </Pressable>
              ))}
            </View>
          )}

          {/* Step: Amount */}
          {step === 'amount' && (
            <View style={styles.body}>
              <ThemedText type="small" themeColor="textSecondary">
                Available: ${availableBalance.toFixed(2)}
              </ThemedText>
              <View style={[styles.inputWrap, { borderColor: error ? '#e53e3e' : theme.backgroundElement }]}>
                <ThemedText type="subtitle" style={styles.dollarSign}>$</ThemedText>
                <TextInput
                  ref={inputRef}
                  autoFocus
                  keyboardType="decimal-pad"
                  value={amountText}
                  onChangeText={(v) => { setAmountText(v); setError(''); }}
                  placeholder="0.00"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.amountInput, { color: theme.text }]}
                />
              </View>
              {error ? <ThemedText type="small" style={styles.errorText}>{error}</ThemedText> : null}
              <ThemedText type="small" themeColor="textSecondary">
                Min: ${MIN_PAYOUT} · Fee: {(FEE_RATES[method] * 100).toFixed(1)}%
              </ThemedText>
              <Pressable
                onPress={() => { if (validateAmount()) setStep('confirm'); }}
                style={[styles.primaryBtn, { backgroundColor: isDark ? '#fff' : '#000' }]}>
                <ThemedText type="smallBold" style={{ color: isDark ? '#000' : '#fff' }}>
                  Continue
                </ThemedText>
              </Pressable>
            </View>
          )}

          {/* Step: Confirm */}
          {step === 'confirm' && (
            <View style={styles.body}>
              <ThemedView type="backgroundElement" style={styles.summaryBox}>
                <SummaryRow label="Method" value={METHODS.find((m) => m.id === method)!.label} />
                <SummaryRow label="Amount" value={`$${amount.toFixed(2)}`} />
                <SummaryRow label="Platform fee" value={`$${fee.toFixed(2)}`} />
                <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />
                <SummaryRow label="You receive" value={`$${net.toFixed(2)}`} bold />
                <SummaryRow label="Est. arrival" value={ARRIVAL[method]} />
              </ThemedView>
              {error ? <ThemedText type="small" style={styles.errorText}>{error}</ThemedText> : null}
              <Pressable
                onPress={handleConfirm}
                disabled={loading}
                style={[styles.primaryBtn, { backgroundColor: isDark ? '#fff' : '#000', opacity: loading ? 0.6 : 1 }]}>
                {loading
                  ? <ActivityIndicator color={isDark ? '#000' : '#fff'} />
                  : <ThemedText type="smallBold" style={{ color: isDark ? '#000' : '#fff' }}>Confirm Payout</ThemedText>
                }
              </Pressable>
            </View>
          )}

          {/* Step: Success */}
          {step === 'success' && result && (
            <View style={[styles.body, styles.successBody]}>
              <SymbolView
                name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
                size={56}
                tintColor="#22c55e"
              />
              <ThemedText type="subtitle" style={styles.centerText}>
                ${result.amount.toFixed(2)} on the way
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
                Est. arrival: {ARRIVAL[result.method]}
              </ThemedText>
              <ThemedText type="code" themeColor="textSecondary" style={styles.centerText}>
                Ref: {result.reference}
              </ThemedText>
              <Pressable
                onPress={handleClose}
                style={[styles.primaryBtn, { backgroundColor: isDark ? '#fff' : '#000' }]}>
                <ThemedText type="smallBold" style={{ color: isDark ? '#000' : '#fff' }}>
                  Done
                </ThemedText>
              </Pressable>
            </View>
          )}
        </ThemedView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <ThemedText type={bold ? 'smallBold' : 'small'} themeColor="textSecondary">{label}</ThemedText>
      <ThemedText type={bold ? 'smallBold' : 'small'}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheetWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: MaxContentWidth,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    paddingBottom: 40,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  iconBtn: { padding: Spacing.one, width: 32, alignItems: 'center' },
  body: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: 12,
    padding: Spacing.three,
  },
  methodLabel: { flex: 1, fontSize: 16 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  dollarSign: { fontSize: 24, lineHeight: 32 },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '600',
    paddingVertical: 0,
    marginLeft: Spacing.one,
  },
  errorText: { color: '#e53e3e' },
  primaryBtn: {
    borderRadius: 12,
    paddingVertical: Spacing.two + 2,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  summaryBox: {
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  divider: { height: 1 },
  successBody: {
    alignItems: 'center',
    paddingTop: Spacing.four,
    gap: Spacing.three,
    alignSelf: 'stretch',
  },
  centerText: { textAlign: 'center' },
});
