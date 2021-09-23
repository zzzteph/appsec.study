<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Auth;
class LabLessonQuestion extends Model
{
    use HasFactory;
	public function lab_lesson()
    {
        return $this->belongsTo(LabLesson::class);
    }
	
	
		public function answers()
    {
        return $this->hasMany(LabLessonQuestionAnswer::class);
    }
	public function answer()
    {
        return $this->hasOne(LabLessonQuestionAnswer::class);
    }
	    protected static function booted()
    {
        static::created(function ($entry) {
            $entry->order = LabLessonQuestion::where('lab_lesson_id',$entry->lab_lesson_id)->max('order')+1;
			$entry->save();
        });
    }

	
	public function left_answers()
	{
			$left_answers =collect();
			$userAnswers=$this->hasMany(UserLabLessonQuestion::class)->where('correct',TRUE)->where('user_id',Auth::user()->id)->get();
			foreach($this->answers as $answer)
			{
				$found=false;
				foreach($userAnswers as $userAnswer)
				{
						similar_text($answer->answer,$userAnswer->answer,$similar_answers);
						if($similar_answers>90)
						{
							$found=true;
						}
				}
				if(!$found)
				{
					$left_answers->push($answer);
				}
				
				
			}
			
			return $left_answers;
	}
	

	public function user_answers()
	{
		return $this->hasMany(UserLabLessonQuestion::class)->where('correct',TRUE)->where('user_id',Auth::user()->id)->get();
	}
	
	
	
	
	
	
	public function getCorrectAttribute()
    {
       	$userAnswers=$this->hasMany(UserLabLessonQuestion::class)->where('correct',TRUE)->where('user_id',Auth::user()->id)->first();
		
		if($this->type=="yes" || $this->type=="string")
		{
			if($userAnswers!=null)return TRUE;
			return FALSE;
		}
	
		$correctUserAnswersCount=$this->hasMany(UserLabLessonQuestion::class)->where('correct',TRUE)->where('user_id',Auth::user()->id)->count();
		$totalAnswers=$this->answers()->count();
		if($this->type=="vuln" || $this->type=="repeat")
		{
			if($totalAnswers==$correctUserAnswersCount)return TRUE;
		}
		
		
		return FALSE;
    }
 
}
