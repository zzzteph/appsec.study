<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VmConfig extends Model
{
    use HasFactory;
	
	
	    public function vm(){
			return $this->belongsTo(Vm::class,'vm_id');
    }
}
