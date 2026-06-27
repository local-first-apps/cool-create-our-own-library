import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Alert } from "react-native";

import { BookForm } from "../components/BookForm";
import { useI18n } from "../i18n";
import { saveBook } from "../services/db";
import { BookInput } from "../types/Book";
import { RootStackParamList } from "../types/Navigation";

type Props = NativeStackScreenProps<RootStackParamList, "ManualBook">;

export function ManualBookScreen({ navigation, route }: Props) {
  const { t } = useI18n();

  async function handleSubmit(book: BookInput) {
    const result = await saveBook(book);
    if (result.duplicate) {
      Alert.alert(t("duplicate"), t("duplicateBody"), [
        { text: t("back"), style: "cancel" },
        { text: t("library"), onPress: () => navigation.navigate("Library", undefined) }
      ]);
      return;
    }

    Alert.alert(t("bookSaved"), t("bookAdded"), [
      { text: t("ok"), onPress: () => navigation.popToTop() }
    ]);
  }

  return (
    <BookForm
      initialValue={route.params?.initialBook}
      submitLabel={t("saveBook")}
      onCancel={() => navigation.goBack()}
      onSubmit={handleSubmit}
    />
  );
}
