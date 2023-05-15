<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use App\Models\UserStatistic;
use Carbon\Carbon;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, Notifiable;

	protected static function booted()
    {
        static::created(function ($user) {
			$user->user_statistic()->save(new UserStatistic);
			
        });
    }



    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for arrays.
     *
     * @var array
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
    ];
	
  public function getAdminAttribute()
 {
 
    if($this->role==='admin')return true;
	return false;
 }
   public function getRatingAttribute()
 {
	$rating=UserStatistic::where('total_score','>',$this->user_statistic->total_score)->count();
	$table=UserStatistic::where('total_score',$this->user_statistic->total_score)->orderBy('labs_time_spend','ASC')->get();
	foreach($table as $entry)
	{
		$rating++;
		if($entry->user_id==$this->id)return $rating;
		
	}
	return $rating;
 }
 
 
    public function getDaysAttribute()
 {
		return $this->created_at->diffInDays(Carbon::now());
 }
 
 
	    public function nodes()
 {
		return $this->hasMany(UserTopicNode::class);
 }
 
 
 
 
	public function user_cloud_vm()
    {
        return $this->hasOne(UserCloudVm::class);
    }
	public function current_user_lab_vm()
    {
		return UserCloudVm::where('user_id', $this->id)->where('status', '!=','terminated')->first();
    }
	public function user_statistic()
    {
        return $this->hasOne(UserStatistic::class);
    }
	

	
	
	
	
}
