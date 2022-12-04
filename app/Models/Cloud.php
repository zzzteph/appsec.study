<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cloud extends Model
{
    use HasFactory;
	
	
	public function cloud_configs()
    {
        return $this->hasMany(CloudConfig::class);
    }
	
	
	//machine
	//project
	//zone
	//network
	//keyfile
	
	function get_cloud_config_attribute($name)
	{
		$option=$this->cloud_configs()->where('name',$name)->first();
		if($option==null)return null;
		return $option->value;
	}
	
	
	
	public function getProjectAttribute()
	{
		return  $this->get_cloud_config_attribute('project');
	}
	
	
		public function getMachineAttribute()
	{
		return  $this->get_cloud_config_attribute('machine');
	}
	
		public function getZoneAttribute()
	{
		return  $this->get_cloud_config_attribute('zone');
	}
	
		public function getNetworkAttribute()
	{
		return  $this->get_cloud_config_attribute('network');
	}
	
			public function getKeyfileAttribute()
	{
		return  $this->get_cloud_config_attribute('keyfile');
	}

	
	
	
	
}
