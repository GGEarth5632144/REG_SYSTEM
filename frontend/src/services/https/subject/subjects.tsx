// services/https/subject/subjects.ts
import axios from "axios";
import { apiUrl } from "../../api";
import { type SubjectInterface } from "../../../interfaces/Subjects";

type SubjectCreateDTO = {
  subject_id: string;
  subject_name: string;
  credit: number;
  major_id: string;
  faculty_id: string;
};

type SubjectAPI = {
  subject_id?: string; SubjectID?: string; id?: string;
  subject_name?: string; SubjectName?: string; name?: string;
  credit?: number | string;
  major_id?: string; MajorID?: string;
  faculty_id?: string; FacultyID?: string;
};

const mapSubjectFromAPI = (s: SubjectAPI): SubjectInterface => ({
  SubjectID:   s.subject_id ?? s.SubjectID ?? s.id ?? "",
  SubjectName: s.subject_name ?? s.SubjectName ?? s.name ?? "",
  Credit:      Number(s.credit ?? 0),
  MajorID:     s.major_id ?? s.MajorID ?? "",
  FacultyID:   s.faculty_id ?? s.FacultyID ?? "",
});

export const createSubject = async (
  data: SubjectInterface
): Promise<SubjectInterface> => {
  // ---- Runtime guards (ช่วยทั้งความถูกต้องและให้ TS narrow type) ----
  const { SubjectID, SubjectName, MajorID, FacultyID, Credit } = data;

  if (!SubjectID)   throw new Error("SubjectID is required");
  if (!SubjectName) throw new Error("SubjectName is required");
  if (!MajorID)     throw new Error("MajorID is required");
  if (!FacultyID)   throw new Error("FacultyID is required");

  const creditNum = Number(Credit);
  if (!Number.isFinite(creditNum) || creditNum < 1 || creditNum > 5) {
    throw new Error("Credit must be a number between 1 and 5");
  }

  const payload: SubjectCreateDTO = {
    subject_id:   SubjectID,    // ตอนนี้ TS รู้ว่าเป็น string แน่นอน
    subject_name: SubjectName,
    credit:       creditNum,
    major_id:     MajorID,
    faculty_id:   FacultyID,
  };

  const res = await axios.post<SubjectAPI>(
    `${apiUrl}/subjects/`,
    payload,
    { headers: { "Content-Type": "application/json" } }
  );

  return mapSubjectFromAPI(res.data);
};

export const getSubjectAll = async (): Promise<SubjectInterface[]> => {
  const res = await axios.get<SubjectAPI[]>(`${apiUrl}/subjects/`);
  const arr = Array.isArray(res.data) ? res.data : [];
  return arr.map(mapSubjectFromAPI);
};
