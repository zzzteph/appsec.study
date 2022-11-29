<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LabLesson extends Model
{
    use HasFactory;
	public function lesson()
    {
        return $this->belongsTo(Lesson::class);
    }
	 public function vm()
    {
        return $this->belongsTo(Vm::class);
    }
	
	public function questions()
    {
        return $this->hasMany(LabLessonQuestion::class)->orderBy('order','asc');
    }
	
	
		public function getQuestionsCountAttribute()
    {
		 return $this->hasMany(LabLessonQuestion::class)->count();

    }
	
	
	public function correct_questions($user_topic_node_id)
    {
		$correct=0;
        foreach($this->questions as $question)
		{
			if($question->correct($user_topic_node_id))$correct++;
		}
		return $correct;
    }
	
	
	
}
