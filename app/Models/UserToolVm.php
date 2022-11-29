<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Carbon\Carbon;
class UserToolVm extends Model
{
    use HasFactory;

    protected $appends = ['timeout'];
    	public function user()
        {
            return $this->belongsTo(User::class);
        }

      		public function getTimeoutAttribute()
          {
      		if($this->status!=='running')return 0;

      		$timeout=60-$this->updated_at->diffInMinutes(Carbon::now());
      		if($timeout<=0)return 0;



      		return $timeout;
          }

}
