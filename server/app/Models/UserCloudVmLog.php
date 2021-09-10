<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class UserCloudVmLog extends Model
{
    use HasFactory;
	
	public function user_cloud_vm()
    {
        return $this->belongsTo(UserCloudVm::class);
    }


	
}
