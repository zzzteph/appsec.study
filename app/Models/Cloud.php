<?php

namespace App\Models;
define("folder_id", "folder_id");
define("subnet_id", "subnet_id");
define("platform_id", "platform_id");
define("zone_id", "zone_id");
define("service_account_id", "service_account_id");
define("key_id", "key_id");
define("vms_count", "vms_count");

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cloud extends Model
{


	
    use HasFactory;

	public function config()
    {
        return $this->hasMany(CloudConfig::class);
    }

	
	function get_by_config_key($key)
	{
		foreach($this->config as $entry)
		{
			if($entry->name==$key)return $entry->value;
		}
	}
	
		public function getServiceAccountIdAttribute()
	 {
	 
		return $this->get_by_config_key(service_account_id);
	 }
	 
	 	public function getKeyIdAttribute()
	 {
	 
		return $this->get_by_config_key(key_id);
	 }
	
	
	public function getFolderIdAttribute()
	 {
	 
		return $this->get_by_config_key(folder_id);
	 }
 	public function getSubnetIdAttribute()
	 {
	 
		return $this->get_by_config_key(subnet_id);
	 }
	 	public function getPlatformIdAttribute()
	 {
	 
		return $this->get_by_config_key(platform_id);
	 }
	 	public function getZoneIdAttribute()
	 {
	 
		return $this->get_by_config_key(zone_id);
	 }
		 	public function getVmsCountAttribute()
	 {
	 
		return $this->get_by_config_key(vms_count);
	 }
	
		public function set_config($key,$value)
		{
			$entry=$this->config()->where('name',$key)->first();
			if($entry==null)
			{
				$this->config()->save(new CloudConfig(['name' => $key,'value' => $value]));
			}
			else
			{
				$entry->value=$value;
				$entry->save();
			}
			
		}

	
}
