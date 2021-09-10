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
	
	public function vm_config()
    {
        return $this->hasOne(VmConfig::class);
    }
	
	
	public function getTemplateIdAttribute()
    {
        return $this->cloud->template_id;
    }
	
	
	
}
