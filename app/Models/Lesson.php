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
            $entry->order = Lesson::where('topic_id',$entry->topic_id)->max('order')+1;
			$entry->save();
        });
    }

	
	
	    public function topic()
    {
        return $this->belongsTo(Topic::class);
    }
	public function theory()
    {
        return $this->hasOne(TheoryLesson::class);
    }
 
		public function lab()
    {
        return $this->hasOne(LabLesson::class);
    }

	public function getIsDoneAttribute()
	{
		if($this->status=="done")return TRUE;
		return FALSE;
	}

	public function getIsOpenedAttribute()
	{
	  $lessons = Lesson::where('topic_id',$this->topic_id)->orderBy('order', 'asc')->get();
	  foreach( $lessons as $lesson)
	  {
		  if($lesson->id==$this->id)return TRUE;
		  if($lesson->id!=$this->id && !$lesson->is_done)return FALSE;
	  }
	  return TRUE;
	}



	public function getStatusAttribute()
    {
		$userLesson=$this->hasOne(UserLesson::class)->where('user_id',Auth::user()->id)->first();
		if($userLesson!=null)
			return $userLesson->status;
		return 'todo';
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
			return 0;
	}

	



		
	
}
