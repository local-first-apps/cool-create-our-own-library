import { Directory, File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";

function extensionFromUri(uri: string): string {
  const match = uri.match(/\.(jpe?g|png|webp)$/i);
  return match ? `.${match[1].toLowerCase().replace("jpeg", "jpg")}` : ".jpg";
}

export async function takeCoverPhoto(): Promise<string | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error("CAMERA_PERMISSION_DENIED");
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [2, 3],
    quality: 0.82
  });

  if (result.canceled || !result.assets[0]?.uri) {
    return null;
  }

  const source = new File(result.assets[0].uri);
  const coversDirectory = new Directory(Paths.document, "covers");
  coversDirectory.create({ idempotent: true, intermediates: true });

  const destination = new File(coversDirectory, `cover_${Date.now()}${extensionFromUri(result.assets[0].uri)}`);
  source.copy(destination);
  return destination.uri;
}
