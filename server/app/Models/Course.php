<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    use HasFactory;
	public function topics()
    {
        return $this->hasMany(Topic::class)->orderBy('order');
    }


    protected static function booted()
    {
        static::created(function ($entry) {
            $entry->order = Course::max('order')+1;
			$entry->save();
        });
    }



	public function getTheoryLessonDoneCountAttribute()
    {
     
	  $count=0;
      foreach($this->topics as $topic)
	  {if($topic->published)
		   $count+=$topic->theory_lesson_done_count;
	  }
		return $count;
    }
	public function getLabLessonDoneCountAttribute()
    {
     
	  $count=0;
     foreach($this->topics as $topic)
	  {
		  if($topic->published)
		  $count+=$topic->lab_lesson_done_count;
	  }
		return $count;
    }

	public function getTopicsCountAttribute()
    {
     
			return $this->hasMany(Topic::class)->where('published',TRUE)->count();
    }


	public function getTopicsDoneCountAttribute()
	{
		
		$count=0;
		foreach($this->topics as $topic)
		{
if($topic->published)
			if($topic->is_done)$count++;
		}
		return $count;
	}

}
