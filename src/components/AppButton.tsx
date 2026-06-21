import { Pressable, StyleSheet, Text } from "react-native";

type AppButtonProps = {
  label: string;
  onPress: () => unknown;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
};

export function AppButton({ label, onPress, variant = "primary", disabled = false }: AppButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed
      ]}
    >
      <Text style={[styles.label, variant !== "primary" && styles.secondaryLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 8,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  danger: {
    backgroundColor: "#fee2e2",
    borderColor: "#fecaca",
    borderWidth: 1
  },
  disabled: {
    opacity: 0.55
  },
  label: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center"
  },
  pressed: {
    opacity: 0.82
  },
  primary: {
    backgroundColor: "#2563EB"
  },
  secondary: {
    backgroundColor: "#ffffff",
    borderColor: "#cbd5e1",
    borderWidth: 1
  },
  secondaryLabel: {
    color: "#1f2937"
  }
});
