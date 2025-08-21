package subjects

import (
	"net/http"
	"reg_system/config"
	"reg_system/entity"

	"github.com/gin-gonic/gin"
)

func GetSubjects(c *gin.Context) {
	db := config.DB()
	var subjects []entity.Subjects
	if err := db.Find(&subjects).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, subjects)

	if len(subjects) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "no subjects found"})
		return
	}else {
		c.JSON(http.StatusOK, subjects)
	}
}



