import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import PayoutBottomSheet from '@/components/PayoutBottomSheet';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  EarningsData,
  PayoutHistoryItem,
  PayoutResponse,
  getEarnings,
} from '@/services/payouts';

const METHOD_LABEL: Record<string, string> = {
  bank: 'Bank Transfer',
  paypal: 'PayPal',
  btc: 'Bitcoin',
  stellar: 'Stellar',
};

const STATUS_COLOR: Record<string, string> = {
  completed: '#22c55e',
  processing: '#f59e0b',
  pending: '#6b7280',
  failed: '#e53e3e',
};

export default function EarningsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const load = useCallback(async () => {
    const result = await getEarnings();
    setData(result);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function handlePayoutSuccess(payout: PayoutResponse) {
    setData((prev) => {
      if (!prev) return prev;
      const newItem: PayoutHistoryItem = {
        id: payout.id,
        amount: payout.amount,
        method: payout.method,
        status: payout.status,
        fee: payout.fee,
        createdAt: payout.createdAt,
        reference: payout.reference,
      };
      return {
        ...prev,
        available: prev.available - payout.amount,
        payouts: [newItem, ...prev.payouts],
      };
    });
  }

  const isDark = theme.background === '#000000';
  const bottomPad = insets.bottom + BottomTabInset + Spacing.three;

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator color={theme.text} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={data?.payouts ?? []}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={[
          styles.listContent,
          Platform.OS !== 'web' && { paddingBottom: bottomPad },
        ]}
        contentInset={Platform.OS === 'ios' ? { top: insets.top } : undefined}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="subtitle">Earnings</ThemedText>

            {/* Balance card */}
            <ThemedView type="backgroundElement" style={styles.balanceCard}>
              <View style={styles.balanceRow}>
                <View>
                  <ThemedText type="small" themeColor="textSecondary">Available</ThemedText>
                  <ThemedText type="subtitle">${(data?.available ?? 0).toFixed(2)}</ThemedText>
                </View>
                <View style={styles.balanceRight}>
                  <ThemedText type="small" themeColor="textSecondary">Total Earned</ThemedText>
                  <ThemedText type="smallBold">${(data?.totalEarned ?? 0).toFixed(2)}</ThemedText>
                </View>
              </View>
              <Pressable
                onPress={() => setSheetOpen(true)}
                style={[styles.payoutBtn, { backgroundColor: isDark ? '#fff' : '#000' }]}>
                <SymbolView
                  name={{ ios: 'arrow.up.circle', android: 'upload', web: 'upload' }}
                  size={18}
                  tintColor={isDark ? '#000' : '#fff'}
                />
                <ThemedText type="smallBold" style={{ color: isDark ? '#000' : '#fff' }}>
                  Request Payout
                </ThemedText>
              </Pressable>
            </ThemedView>

            {data?.payouts.length ? (
              <ThemedText type="smallBold" style={styles.historyLabel}>
                Payout History
              </ThemedText>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
            No payouts yet
          </ThemedText>
        }
        renderItem={({ item }) => <PayoutRow item={item} />}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: theme.backgroundElement }]} />
        )}
      />

      <PayoutBottomSheet
        visible={sheetOpen}
        availableBalance={data?.available ?? 0}
        onClose={() => setSheetOpen(false)}
        onSuccess={handlePayoutSuccess}
      />
    </ThemedView>
  );
}

function PayoutRow({ item }: { item: PayoutHistoryItem }) {
  const date = new Date(item.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <ThemedView style={styles.row}>
      <View style={styles.rowLeft}>
        <ThemedText type="smallBold">{METHOD_LABEL[item.method] ?? item.method}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">{date}</ThemedText>
        <ThemedText type="code" themeColor="textSecondary">{item.reference}</ThemedText>
      </View>
      <View style={styles.rowRight}>
        <ThemedText type="smallBold">${item.amount.toFixed(2)}</ThemedText>
        <ThemedText type="small" style={{ color: STATUS_COLOR[item.status] ?? '#6b7280' }}>
          {item.status}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: {
    flexDirection: 'column',
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    paddingTop: Platform.OS === 'web' ? Spacing.six : Spacing.four,
    paddingBottom: Spacing.four,
  },
  header: { gap: Spacing.three, marginBottom: Spacing.two },
  balanceCard: {
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  balanceRight: { alignItems: 'flex-end' },
  payoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    borderRadius: 12,
    paddingVertical: Spacing.two + 2,
  },
  historyLabel: { marginTop: Spacing.two },
  empty: { textAlign: 'center', paddingVertical: Spacing.four },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.three,
  },
  rowLeft: { gap: 2 },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  separator: { height: 1 },
});
