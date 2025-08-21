import axios from "axios";
import { type SubjectInterface } from "../../../interfaces/Subjects";

import { apiUrl } from "../../api";

export const createSubject = async (
  data: SubjectInterface
): Promise<SubjectInterface> => {
  try {
    // map camelCase fields to snake_case expected by API if necessary
    const payload = {
      subject_id: data.SubjectID,
      subject_name: data.SubjectName,
      credit: data.Credit,
      major_id: data.MajorID,
      faculty_id: data.FacultyID,
    };

    const response = await axios.post(`${apiUrl}/subjects/`, payload);
    return response.data as SubjectInterface;
  } catch (error) {
    console.error("Error creating subject:", error);
    throw error;
  }
};

export const getSubjectAll = async (): Promise<SubjectInterface[]> => {
  try {
    const response = await axios.get(`${apiUrl}/subjects/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching subject data:", error);
    throw error;
  }
};