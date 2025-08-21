import axios from "axios";
import { type CurriculumInterface } from "../../../interfaces/Curriculum";

import { apiUrl } from "../../api";

export const getCurriculumAll = async (): Promise<CurriculumInterface[]> => {
    try{
        const response = await axios.get(`${apiUrl}/curriculums/`)
        console.log("api curriculum data:", response);
        
        return response.data
    }
    catch(error){
        console.error("Error fetching curriculum data:", error);
        throw error;
    }
}