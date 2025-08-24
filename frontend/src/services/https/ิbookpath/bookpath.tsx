// services/https/bookpath/bookpaths.ts
import axios from "axios";
import { apiUrl } from "../../api";
import { type BookPathInterface } from "../../../interfaces/BookPath";

type BookAPI = {
  id?: number | string;
  original_name?: string;
  stored_name?: string;
  path?: string;
  public_path?: string;
  mime_type?: string;
  size?: number | string;
  checksum?: string;
  note?: string;
};

// อาจได้ { message, book: {...} } หรือได้ {...} ตรง ๆ
type UploadRespShape = { message?: string; book?: BookAPI } | BookAPI;
// เผื่ออนาคต GET all เปลี่ยนเป็น { data: [...] }
type ListRespShape = BookAPI[] | { data?: BookAPI[] };

const mapBookFromAPI = (b: BookAPI): BookPathInterface => ({
  ID:           b.id !== undefined ? Number(b.id) : undefined,
  OriginalName: b.original_name ?? "",
  StoredName:   b.stored_name ?? "",
  Path:         b.path ?? "",
  PublicPath:   b.public_path ?? "",
  MimeType:     b.mime_type ?? "",
  Size:         b.size !== undefined ? Number(b.size) : undefined,
  Checksum:     b.checksum ?? "",
  Note:         b.note ?? "",
});

// ดึง payload จาก response upload ให้ได้ BookAPI เสมอ (ไม่ใช้ any)
function unwrapBook(payload: UploadRespShape): BookAPI {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "book" in payload &&
    payload.book
  ) {
    return payload.book;
  }
  return payload as BookAPI;
}

export const uploadBookFile = async (file: File): Promise<BookPathInterface> => {
  const formData = new FormData();
  formData.append("currBook", file);

  const res = await axios.post<UploadRespShape>(`${apiUrl}/books/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  const body = unwrapBook(res.data);
  return mapBookFromAPI(body);
};

export const getBookAll = async (): Promise<BookPathInterface[]> => {
  const res = await axios.get<ListRespShape>(`${apiUrl}/books/`);
  const list: BookAPI[] = Array.isArray(res.data) ? res.data : (res.data.data ?? []);
  return list.map(mapBookFromAPI);
};

export const getBookByID = async (id: number): Promise<BookPathInterface> => {
  const res = await axios.get<BookAPI>(`${apiUrl}/books/${id}`);
  return mapBookFromAPI(res.data);
};

export const deleteBook = async (id: number): Promise<void> => {
  await axios.delete(`${apiUrl}/books/${id}`);
};
