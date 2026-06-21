import { StyleSheet, Text, View } from "react-native";

type InfoRowProps = {
  label: string;
  value?: string | number | null;
};

export function InfoRow({ label, value }: InfoRowProps) {
  const text = value === null || value === undefined || value === "" ? "-" : String(value);

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 3
  },
  row: {
    borderBottomColor: "#e2e8f0",
    borderBottomWidth: 1,
    paddingVertical: 10
  },
  value: {
    color: "#111827",
    fontSize: 16
  }
});
