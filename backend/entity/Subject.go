package entity

type Subjects struct {
	SubjectID   string `json:"subject_id" gorm:"primaryKey"`
	SubjectName string `json:"subject_name"`
	Credit     int    `json:"credit"`
	Major   *Majors `gorm:"foreignKey:MajorID;references:MajorID"` // ระบุความสัมพันธ์ 1--1 [Majors]
	StudyTime   time.Time  `json:"study_time" gorm:"type:datetime"` // MySQL/MariaDB
}
