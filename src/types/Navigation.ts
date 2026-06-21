import type { BookInput } from "./Book";
import type { BookFilterParams } from "../utils/bookFilters";

export type RootStackParamList = {
  Home: undefined;
  Library: BookFilterParams | undefined;
  Scanner: undefined;
  BookConfirm: { book: BookInput };
  ManualBook: { initialBook?: Partial<BookInput> } | undefined;
  BookDetail: { id: number };
  Settings: undefined;
  Instructions: undefined;
};
