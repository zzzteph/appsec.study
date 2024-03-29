<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Events\UserStatisticsChange;
class UserTopicNode extends Model
{
    use HasFactory;

	public function topic_node()
    {
        return $this->belongsTo(TopicNode::class);
    }
 
 	public function user()
    {
        return $this->belongsTo(User::class);
    }
 
 
 
	protected static function booted()
    {
        static::created(function ($entry) {
			
				event(new UserStatisticsChange($entry));
        });
		
		static::updated(function ($entry) {
						event(new UserStatisticsChange($entry));
        });
		
		
		
    }
	
		public function getQuestionsCountAttribute()
    {
		 return $this->hasMany(UserLabLessonQuestion::class)->count();

    }
			public function getQuestionsCorrectCountAttribute()
    {
		 return $this->hasMany(UserLabLessonQuestion::class)->where('correct',TRUE)->count();

    }
	
		public function user_lab_lesson_questions()
    {
        return $this->hasMany(UserLabLessonQuestion::class);
    }
 
	
	
}
