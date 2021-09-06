<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Topic extends Model
{
    use HasFactory;
    public function course()
    {
        return $this->belongsTo(Course::class);
    }
	public function lessons()
    {
        return $this->hasMany(Lesson::class);
    }
	
	public function getLabLessonCountAttribute()
    {
		$count=0;
      foreach($this->lessons as $lesson)
	  {
		  if($lesson->type=="lab" && $lesson->published==TRUE)$count++;
	  }
		return $count;
    }
	
	public function getTheoryLessonCountAttribute()
    {
     
	  $count=0;
      foreach($this->lessons as $lesson)
	  {
		  if($lesson->type=="theory" && $lesson->published==TRUE)$count++;
	  }
		return $count;
    }
	
	public function getTheoryLessonDoneCountAttribute()
    {
     
	  $count=0;
      foreach($this->lessons as $lesson)
	  {
		  if($lesson->type=="theory" &&$lesson->is_done && $lesson->published==TRUE)$count++;
	  }
		return $count;
    }
		public function getLabLessonDoneCountAttribute()
    {
     
	  $count=0;
      foreach($this->lessons as $lesson)
	  {
		  if($lesson->type=="lab" &&$lesson->is_done && $lesson->published==TRUE)$count++;
	  }
		return $count;
    }
	
	
	
	
	public function getIsDoneAttribute()
	{
		 foreach($this->lessons as $lesson)
	  {
		  if(!$lesson->is_done && $lesson->published==TRUE)return FALSE;
	  }
	  return true;
	}
	
    protected static function booted()
    {
        static::created(function ($entry) {
            $entry->order = Topic::where('course_id',$entry->course_id)->max('order')+1;
			$entry->save();
        });
    }

	
}
