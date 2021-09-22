<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Auth;
class Lesson extends Model
{
    use HasFactory;
	
	    protected static function booted()
    {
        static::created(function ($entry) {
         //   $entry->order = Lesson::where('topic_id',$entry->topic_id)->max('order')+1;
		//	$entry->save();
        });
	}

	public function theory()
    {
        return $this->hasOne(TheoryLesson::class);
    }
 
		public function lab()
    {
        return $this->hasOne(LabLesson::class);
    }




public function getTypeAttribute()
{
	if($this->hasMany(TheoryLesson::class)->count()>0)
		{
			return "theory";
		}
		else if($this->hasMany(LabLesson::class)->count()>0)
		{return "lab";
		}
		return "unknown";
}




	public function getProgressAttribute()
	{
		/*
		if($this->hasMany(TheoryLesson::class)->count()>0)
		{
			if($this->status=='done')
				return 100;
			return 0;
		}
		else if($this->hasMany(LabLesson::class)->count()>0)
		{
			if($this->lab->questions_count>0)
			{
				return $this->lab->questions_count/$this->lab->questions_count;
			}
			else
				return 0;
		}
		else
*/		
			return 0;
	}

	



		
	
}
