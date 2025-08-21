package subjects

import (
	"errors"
	"net/http"
	"reg_system/config"
	"reg_system/entity"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// POST /subjects
type SubjectCreateReq struct {
	SubjectID   string `json:"subject_id"   binding:"required"`
	SubjectName string `json:"subject_name" binding:"required"`
	Credit      int    `json:"credit"       binding:"required"`
	MajorID     string `json:"major_id"     binding:"required"`
}

func CreateSubject(c *gin.Context) {
	var req SubjectCreateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db := config.DB()
	sub := entity.Subjects{
		SubjectID:   req.SubjectID,
		SubjectName: req.SubjectName,
		Credit:      req.Credit,
		MajorID:     req.MajorID,
	}
	if err := db.Create(&sub).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message":     "Create subject success",
		"SubjectID":   sub.SubjectID,
		"SubjectName": sub.SubjectName,
	})
}

// GET /subjects/:id
func GetSubjectID(c *gin.Context) {
	id := c.Param("id")
	db := config.DB()
	var sub entity.Subjects

	// อยากได้เวลาติดมาด้วยก็ Preload
	if err := db.Preload("Major").Preload("StudyTimes").
		First(&sub, "subject_id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "subject not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp := map[string]interface{}{
		"SubjectID":   sub.SubjectID,
		"SubjectName": sub.SubjectName,
		"Credit":      sub.Credit,
		"MajorID":     sub.MajorID,
		"StudyTimes":  sub.StudyTimes, // อ่านอย่างเดียว แก้ไขไปทำที่ study time controller
	}
	if sub.Major != nil {
		resp["MajorName"] = sub.Major.MajorName
	}
	c.JSON(http.StatusOK, resp)
}

// GET /subjects
func GetSubjectAll(c *gin.Context) {
	db := config.DB()
	var subs []entity.Subjects
	if err := db.Preload("Major").Preload("StudyTimes").Find(&subs).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	out := make([]map[string]interface{}, 0, len(subs))
	for i, s := range subs {
		row := map[string]interface{}{
			"ID":          i + 1,
			"SubjectID":   s.SubjectID,
			"SubjectName": s.SubjectName,
			"Credit":      s.Credit,
			"MajorID":     s.MajorID,
			"StudyTimes":  s.StudyTimes,
		}
		if s.Major != nil {
			row["MajorName"] = s.Major.MajorName
		}
		out = append(out, row)
	}
	c.JSON(http.StatusOK, out)
}

// PUT /subjects/:id
type SubjectUpdateReq struct {
	SubjectName *string `json:"subject_name,omitempty"`
	Credit      *int    `json:"credit,omitempty"`
	MajorID     *string `json:"major_id,omitempty"`
}

func UpdateSubject(c *gin.Context) {
	id := c.Param("id")
	db := config.DB()

	var req SubjectUpdateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var sub entity.Subjects
	if err := db.First(&sub, "subject_id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "subject not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.SubjectName != nil {
		sub.SubjectName = *req.SubjectName
	}
	if req.Credit != nil {
		sub.Credit = *req.Credit
	}
	if req.MajorID != nil {
		sub.MajorID = *req.MajorID
	}

	if err := db.Save(&sub).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, sub)
}

// DELETE /subjects/:id
func DeleteSubject(c *gin.Context) {
	id := c.Param("id")
	db := config.DB()

	// ถ้า entity ตั้ง constraint:OnDelete:CASCADE ไว้ที่ StudyTimes
	// การลบ Subject จะพาเวลาที่เกี่ยวถูกลบตามอัตโนมัติ
	if err := db.Delete(&entity.Subjects{}, "subject_id = ?", id).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Delete subject success"})
}
