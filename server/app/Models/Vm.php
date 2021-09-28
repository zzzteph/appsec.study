<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vm extends Model
{
    use HasFactory;
	
	
	public function cloud()
    {
        return $this->hasOne(CloudVm::class);
    }
	
	public function config()
    {
        return $this->hasOne(VmConfig::class,'id');
    }
	
	
	public function getTemplateIdAttribute()
    {
        return $this->cloud->template_id;
    }
	
	
	
}
