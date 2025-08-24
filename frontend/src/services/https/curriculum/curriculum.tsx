import axios from "axios";
import { apiUrl } from "../../api";
import { type CurriculumInterface } from "../../../interfaces/Curriculum";

// ---------- API DTOs ----------
type CurriculumCreateDTO = {
  curriculum_id: string;
  curriculum_name: string;
  total_credit: number;
  start_year: number;
  faculty_id: string;
  major_id?: string;
  book_id?: number;
  description?: string;
};

export type CurriculumAPI = {
  curriculum_id?: string; CurriculumID?: string;
  curriculum_name?: string; CurriculumName?: string;
  total_credit?: number | string;
  start_year?: number | string;
  faculty_id?: string; FacultyID?: string;
  major_id?: string;  MajorID?: string;
  book_id?: number | string;
  description?: string;
  faculty_name?: string;
  major_name?: string;
  book_path?: string;
};

// ฝั่ง BE อาจตอบ { message, data: {...} } หรือ {...} ตรง ๆ
type CreateRespShape = { message?: string; data?: CurriculumAPI } | CurriculumAPI;

// ---------- Mappers ----------
const mapCurriculumFromAPI = (c: CurriculumAPI): CurriculumInterface => ({
  CurriculumID:   c.curriculum_id ?? c.CurriculumID ?? "",
  CurriculumName: c.curriculum_name ?? c.CurriculumName ?? "",
  TotalCredit:    Number(c.total_credit ?? 0),
  StartYear:      Number(c.start_year ?? 0),
  FacultyID:      c.faculty_id ?? c.FacultyID ?? "",
  MajorID:        c.major_id ?? c.MajorID ?? "",
  BookID:         c.book_id !== undefined && c.book_id !== null ? Number(c.book_id) : undefined,
  Description:    c.description ?? "",
  FacultyName:    c.faculty_name ?? "",
  MajorName:      c.major_name ?? "",
  BookPath:       c.book_path ?? "",
});

// ดึง payload ให้ได้ CurriculumAPI เสมอ ไม่ว่าจะห่อใน {data: ...} หรือไม่
function unwrapCurriculum(payload: CreateRespShape): CurriculumAPI {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "data" in payload &&
    payload.data
  ) {
    return payload.data;
  }
  return payload as CurriculumAPI;
}


// ---------- Services ----------
export const createCurriculum = async (
  data: CurriculumInterface
): Promise<CurriculumInterface> => {
  const { CurriculumID, CurriculumName, TotalCredit, StartYear, FacultyID } = data;
  if (!CurriculumID || !CurriculumName || TotalCredit == null || StartYear == null || !FacultyID) {
    throw new Error("Missing required curriculum fields");
  }

  const payload: CurriculumCreateDTO = {
    curriculum_id:   CurriculumID,
    curriculum_name: CurriculumName,
    total_credit:    Number(TotalCredit),
    start_year:      Number(StartYear),
    faculty_id:      FacultyID,
    major_id:        data.MajorID,
    book_id:         data.BookID,
    description:     data.Description,
  };

  const res = await axios.post<CreateRespShape>(
    `${apiUrl}/curriculums/`,
    payload,
    { headers: { "Content-Type": "application/json" } }
  );

  const body = unwrapCurriculum(res.data);
  return mapCurriculumFromAPI(body);
};

export const getCurriculumAll = async (): Promise<CurriculumInterface[]> => {
  const res = await axios.get<CurriculumAPI[] | { data?: CurriculumAPI[] }>(`${apiUrl}/curriculums/`);

  // รองรับทั้งแบบ array ตรง ๆ และแบบ { data: [...] }
  const arr: CurriculumAPI[] =
    Array.isArray(res.data)
      ? res.data
      : (res.data?.data ?? []);

  return arr.map(mapCurriculumFromAPI);
};

export const updateCurriculum = async (
  curriculumId: string,
  data: Partial<CurriculumCreateDTO>
): Promise<void> => {
  if (!curriculumId) throw new Error("curriculumId is required");
  await axios.put(`${apiUrl}/curriculums/${curriculumId}`, data, {
    headers: { "Content-Type": "application/json" },
  });
};

export const deleteCurriculum = async (curriculumId: string): Promise<void> => {
  if (!curriculumId) throw new Error("curriculumId is required");
  await axios.delete(`${apiUrl}/curriculums/${curriculumId}`);
};
