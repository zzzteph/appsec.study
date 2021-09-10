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
	
	    protected static function booted()
    {
        static::created(function ($entry) {
            $entry->order = LabLessonQuestion::where('lab_lesson_id',$entry->lab_lesson_id)->max('order')+1;
			$entry->save();
        });
    }

	
	
	public function getCorrectAttribute()
    {
       	$userQuesions=$this->hasMany(UserLabLessonQuestion::class)->where('correct',TRUE)->where('user_id',Auth::user()->id)->first();
		if($userQuesions!=null)
			return (bool)$userQuesions->correct;
		return FALSE;
    }
 
}
