import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Alert } from "react-native";

import { BookForm } from "../components/BookForm";
import { saveBook } from "../services/db";
import { BookInput } from "../types/Book";
import { RootStackParamList } from "../types/Navigation";

type Props = NativeStackScreenProps<RootStackParamList, "ManualBook">;

export function ManualBookScreen({ navigation, route }: Props) {
  async function handleSubmit(book: BookInput) {
    const result = await saveBook(book);
    if (result.duplicate) {
      Alert.alert("Duplicato", "Questo libro è già presente nella biblioteca.", [
        { text: "Torna all'elenco", onPress: () => navigation.popToTop() }
      ]);
      return;
    }

    Alert.alert("Libro salvato", "Il libro è stato aggiunto alla biblioteca.", [
      { text: "OK", onPress: () => navigation.popToTop() }
    ]);
  }

  return (
    <BookForm
      initialValue={route.params?.initialBook}
      submitLabel="Salva libro"
      onCancel={() => navigation.goBack()}
      onSubmit={handleSubmit}
    />
  );
}
