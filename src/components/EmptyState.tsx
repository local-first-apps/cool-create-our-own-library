import { StyleSheet, Text, View } from "react-native";

type EmptyStateProps = {
  message: string;
};

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 24
  },
  message: {
    color: "#64748b",
    fontSize: 16,
    textAlign: "center"
  }
});
