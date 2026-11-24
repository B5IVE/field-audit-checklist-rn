import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const INITIAL_ITEMS = [
  {
    id: "chk-1",
    code: "PWR-01",
    label: "3.3V supply rail nominal within +/- 3% under load",
    status: "PASS",
    notes: "Measured 3.31V on DSO with 18mVpp ripple.",
    updatedAt: "2026-11-24T10:15:00Z",
  },
  {
    id: "chk-2",
    code: "EMC-02",
    label: "Near-field H-field scan clean near switching regulator",
    status: "FLAGGED",
    notes: "Minor harmonic peak at 48MHz; review ground stitching.",
    updatedAt: "2026-11-24T10:22:00Z",
  },
  {
    id: "chk-3",
    code: "RF-03",
    label: "Antenna RSSI and SNR within link margin spec",
    status: "PENDING",
    notes: "",
    updatedAt: "",
  },
];

const STATUS_ORDER = ["PASS", "FLAGGED", "FAIL", "PENDING"];

export default function App() {
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [newLabel, setNewLabel] = useState("");
  const [newCode, setNewCode] = useState("");
  const [filter, setFilter] = useState("ALL");

  function cycleStatus(id) {
    const now = new Date().toISOString();
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const idx = STATUS_ORDER.indexOf(item.status);
        const nextStatus = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
        return { ...item, status: nextStatus, updatedAt: now };
      })
    );
  }

  function updateNotes(id, notes) {
    const now = new Date().toISOString();
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, notes, updatedAt: now } : item))
    );
  }

  function addItem() {
    const cleanLabel = newLabel.trim();
    if (!cleanLabel) return;
    const cleanCode = (newCode.trim() || `CHK-0${items.length + 1}`).toUpperCase();
    setItems((prev) => [
      ...prev,
      {
        id: `chk-${Date.now()}`,
        code: cleanCode,
        label: cleanLabel,
        status: "PENDING",
        notes: "",
        updatedAt: new Date().toISOString(),
      },
    ]);
    setNewLabel("");
    setNewCode("");
  }

  const summary = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.total += 1;
        if (item.status === "PASS") acc.pass += 1;
        else if (item.status === "FLAGGED" || item.status === "FAIL") acc.issues += 1;
        else acc.pending += 1;
        return acc;
      },
      { total: 0, pass: 0, issues: 0, pending: 0 }
    );
  }, [items]);

  const visibleItems = useMemo(() => {
    if (filter === "ALL") return items;
    return items.filter((item) => item.status === filter);
  }, [items, filter]);

  const exportPayload = useMemo(
    () =>
      JSON.stringify(
        {
          exported_utc: new Date().toISOString(),
          summary,
          checklist: items,
        },
        null,
        2
      ),
    [items, summary]
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Field & Bench Audit Checklist</Text>
        <Text style={styles.subtitle}>
          Tap any status badge to cycle state • Add notes & export JSON
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{summary.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{summary.pass}</Text>
            <Text style={styles.statLabel}>Pass</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{summary.issues}</Text>
            <Text style={styles.statLabel}>Flagged/Fail</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{summary.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        <View style={styles.addCard}>
          <TextInput
            style={styles.codeInput}
            placeholder="Code (e.g. RF-04)"
            placeholderTextColor="#64748b"
            value={newCode}
            onChangeText={setNewCode}
          />
          <TextInput
            style={styles.labelInput}
            placeholder="Inspection item..."
            placeholderTextColor="#64748b"
            value={newLabel}
            onChangeText={setNewLabel}
          />
          <TouchableOpacity style={styles.addBtn} onPress={addItem}>
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          {["ALL", "PASS", "FLAGGED", "FAIL", "PENDING"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.filterPill, filter === tab && styles.filterPillActive]}
              onPress={() => setFilter(tab)}
            >
              <Text style={styles.filterText}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {visibleItems.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemCode}>{item.code}</Text>
              <TouchableOpacity
                style={[styles.badge, styles[`badge_${item.status}`]]}
                onPress={() => cycleStatus(item.id)}
              >
                <Text style={styles.badgeText}>{item.status}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.itemLabel}>{item.label}</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add bench/field notes..."
              placeholderTextColor="#64748b"
              value={item.notes}
              onChangeText={(txt) => updateNotes(item.id, txt)}
            />
          </View>
        ))}

        <View style={styles.exportBox}>
          <Text style={styles.exportTitle}>JSON Audit Export Preview</Text>
          <Text style={styles.exportJson}>{exportPayload}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0f172a" },
  container: { padding: 16, paddingBottom: 40 },
  title: { color: "#f8fafc", fontSize: 22, fontWeight: "700" },
  subtitle: { color: "#94a3b8", fontSize: 13, marginTop: 4, marginBottom: 14 },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  statBox: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  statNum: { color: "#f8fafc", fontSize: 18, fontWeight: "700" },
  statLabel: { color: "#94a3b8", fontSize: 11, marginTop: 2 },
  addCard: { flexDirection: "row", gap: 8, marginBottom: 12 },
  codeInput: {
    width: 96,
    backgroundColor: "#1e293b",
    color: "#f8fafc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#334155",
    fontSize: 13,
  },
  labelInput: {
    flex: 1,
    backgroundColor: "#1e293b",
    color: "#f8fafc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#334155",
    fontSize: 13,
  },
  addBtn: {
    backgroundColor: "#0284c7",
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  filterPill: {
    backgroundColor: "#1e293b",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#334155",
  },
  filterPillActive: { borderColor: "#38bdf8", backgroundColor: "#0c4a6e" },
  filterText: { color: "#e2e8f0", fontSize: 11, fontWeight: "600" },
  itemCard: {
    backgroundColor: "#1e293b",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemCode: { color: "#38bdf8", fontWeight: "700", fontSize: 13 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badge_PASS: { backgroundColor: "#14532d" },
  badge_FLAGGED: { backgroundColor: "#713f12" },
  badge_FAIL: { backgroundColor: "#7f1d1d" },
  badge_PENDING: { backgroundColor: "#334155" },
  badgeText: { color: "#f8fafc", fontSize: 11, fontWeight: "700" },
  itemLabel: { color: "#f1f5f9", fontSize: 14, marginTop: 8, marginBottom: 8 },
  notesInput: {
    backgroundColor: "#0f172a",
    color: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#334155",
    fontSize: 13,
  },
  exportBox: {
    marginTop: 8,
    backgroundColor: "#1e293b",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  exportTitle: { color: "#cbd5e1", fontSize: 13, fontWeight: "700", marginBottom: 6 },
  exportJson: { color: "#94a3b8", fontSize: 11, fontFamily: "monospace" },
});
