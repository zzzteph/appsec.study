<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Auth;
class LabLessonQuestionHint extends Model
{
    use HasFactory;
	
		protected static function booted()
		{
			static::created(function ($entry) {
				$entry->order = LabLessonQuestionHint::where('lab_lesson_question_id',$entry->lab_lesson_question_id)->max('order')+1;
				$entry->save();
			});
		}
	
	public function users()
    {
        return $this->hasMany(UserLabLessonQuestionHint::class);
    }
		
	public function getBoughtAttribute()
    {
		$hint=UserLabLessonQuestionHint::where('user_id',Auth::user()->id)->where('lab_lesson_question_hint_id',$this->id)->first();
		
			if($hint==null)		return FALSE;
			return true;
    }
 
	
}
