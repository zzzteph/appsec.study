<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserLabLessonQuestionHint extends Model
{
    use HasFactory;
	
		public function lab_lesson_question_hint()
    {
		return $this->belongsTo(LabLessonQuestionHint::class);
    }
	
	
}
