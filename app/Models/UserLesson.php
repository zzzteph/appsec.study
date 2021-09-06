<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Events\UserStatisticsChange;
class UserLesson extends Model
{
    use HasFactory;

	public function lesson()
    {
        return $this->belongsTo(Lesson::class);
    }
 
	protected static function booted()
    {
        static::created(function ($entry) {
			
				event(new UserStatisticsChange(User::find($entry->user_id)));
        });
		
		static::updated(function ($entry) {
						event(new UserStatisticsChange(User::find($entry->user_id)));
        });
		
		
		
    }
	
}
