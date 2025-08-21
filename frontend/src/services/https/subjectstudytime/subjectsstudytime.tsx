import axios from "axios";
import { type SubjectStudyTimeInterface } from "../../../interfaces/SubjectsStudyTime";

import { apiUrl } from "../../api";

const mapStudyTime = (data: any): SubjectStudyTimeInterface => ({
  ID: data.id ?? data.ID,
  SubjectID: data.subjectId ?? data.subject_id ?? data.SubjectID,
  StartAt: data.start ?? data.start_at ?? data.StartAt,
  EndAt: data.end ?? data.end_at ?? data.EndAt,
});


/**
 * ✅ ดึงช่วงเวลาเรียนทั้งหมดของรายวิชา
 * GET /subjects/:subjectId/times
 */
export const getStudyTimesBySubject = async (
  subjectId: string,
): Promise<SubjectStudyTimeInterface[]> => {
  if (!subjectId) {
    throw new Error("subjectId is required");
  }
  try {
    const response = await axios.get(`${apiUrl}/subjects/${subjectId}/times/`);
    console.log("api study times:", response);
    return (Array.isArray(response.data) ? response.data : []).map(mapStudyTime);
  } catch (error) {
    console.error("Error fetching study times:", error);
    throw error;
  }
};

/**
 * ✅ ดึงช่วงเวลาเรียน 1 รายการ
 * GET /subjects/:subjectId/times/:timeId
 */
export const getStudyTimeOne = async (
  subjectId: string,
  timeId: number | string,
): Promise<SubjectStudyTimeInterface> => {
  if (!subjectId) throw new Error("subjectId is required");
  if (timeId === null || timeId === undefined)
    throw new Error("timeId is required");

  try {
    const response = await axios.get(
      `${apiUrl}/subjects/${subjectId}/times/${timeId}`,
    );
    return mapStudyTime(response.data);
  } catch (error) {
    console.error("Error fetching study time:", error);
    throw error;
  }
};

/**
 * ✅ เพิ่มช่วงเวลาเรียนใหม่ (หนึ่งช่วง)
 * POST /subjects/:subjectId/times
 * body: { start, end } // ไม่ต้องส่ง subject_id
 */
export const addStudyTime = async (
  subjectId: string,
  data: { start: string; end: string },
): Promise<SubjectStudyTimeInterface> => {
  if (!subjectId) throw new Error("subjectId is required");
  try {
    const response = await axios.post(
      `${apiUrl}/subjects/${subjectId}/times/`,
      data,
    );
    return mapStudyTime(response.data);
  } catch (error) {
    console.error("Error creating study time:", error);
    throw error;
  }
};

/**
 * ✅ อัปเดตช่วงเวลาเรียน (แก้ start/end บางส่วนได้)
 * PUT /subjects/:subjectId/times/:timeId
 */
export const updateStudyTime = async (
  subjectId: string,
  timeId: number | string,
  data: Partial<{ start: string; end: string }>,
): Promise<SubjectStudyTimeInterface> => {
  if (!subjectId) throw new Error("subjectId is required");
  if (timeId === null || timeId === undefined)
    throw new Error("timeId is required");

  try {
    const response = await axios.put(
      `${apiUrl}/subjects/${subjectId}/times/${timeId}`,
      data,
    );
    return mapStudyTime(response.data);
  } catch (error) {
    console.error("Error updating study time:", error);
    throw error;
  }
};

/**
 * ✅ ลบช่วงเวลาเรียน 1 รายการ
 * DELETE /subjects/:subjectId/times/:timeId
 */
export const deleteStudyTime = async (
  subjectId: string,
  timeId: number | string,
): Promise<void> => {
  if (!subjectId) throw new Error("subjectId is required");
  if (timeId === null || timeId === undefined)
    throw new Error("timeId is required");

  try {
    await axios.delete(`${apiUrl}/subjects/${subjectId}/times/${timeId}`);
  } catch (error) {
    console.error("Error deleting study time:", error);
    throw error;
  }
};
