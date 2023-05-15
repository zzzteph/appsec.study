<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Events\UserStatisticsChange;
class UserLabLessonQuestion extends Model
{
    use HasFactory;
	
		public function lab_lesson_question()
    {
        return $this->belongsTo(LabLessonQuestion::class);
    }
	
	
	    protected static function booted()
    {
        static::created(function ($entry) {
			
			$user_topic_node=UserTopicNode::where('id',$entry->user_topic_node_id)->first();
			event(new UserStatisticsChange($user_topic_node));
        });
		
		static::updated(function ($entry) {
			$user_topic_node=UserTopicNode::where('id',$entry->user_topic_node_id)->first();
			event(new UserStatisticsChange($user_topic_node));
        });
		
		
		
    }

	
	
	
}
	
	