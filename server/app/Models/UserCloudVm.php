<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Events\UserStatisticsChange;
use Auth;
use Carbon\Carbon;
class UserCloudVm extends Model
{
    use HasFactory;
	protected $appends = ['timeout'];
	public function user()
    {
        return $this->belongsTo(User::class);
    }
	
	
	protected static function booted()
    {
        static::created(function ($entry) {
			
				event(new UserStatisticsChange(User::find($entry->user_id)));
        });
		
		static::updated(function ($entry) {
			event(new UserStatisticsChange(User::find($entry->user_id)));
			$log=new UserCloudVmLog;
			$log->type='action';
			$log->message=$entry->status."   ".$entry->progress;
			$entry->user_cloud_vm_logs()->save($log);
			
        });
    }

	public function lesson()
    {
		return LabLesson::find($this->lab_lesson_id)->lesson;
    }

	public function getSizeAttribute()
    {
		return LabLesson::find($this->lab_lesson_id)->vm->vm_config->size;
    }

	public function getParamAttribute()
    {
		return LabLesson::find($this->lab_lesson_id)->vm->vm_config->param; 
    }


		public function user_cloud_vm_logs()
    {
        return $this->hasMany(UserCloudVmLog::class);
    }

	
		public function getTimeoutAttribute()
    {
		if($this->status!=='running')return 0;
		
		$timeout=60-$this->updated_at->diffInMinutes(Carbon::now());
		if($timeout<=0)return 0;
		
		
		
		return $timeout;
    }

	
	
}
