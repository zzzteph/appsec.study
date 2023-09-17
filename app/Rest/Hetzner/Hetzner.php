<?php


namespace App\Rest\Hetzner;
use Illuminate\Support\Facades\Http;
use App\Rest\Hetzner\Model\Instance;
use App\Rest\Hetzner\Model\Image;
use App\Rest\Hetzner\Model\PrimaryIP;
use App\Rest\Hetzner\Model\Network;
class Hetzner
{
	private $API_KEY;
	protected $instance;
	protected $image;
	protected $primary_ip;
	protected $network;
	public function __construct($API_KEY=null) {
		$this->API_KEY=$API_KEY;
		if($this->API_KEY==null)
		{
			$this->API_KEY=env('HETZNER_TOKEN', false);
		}
		$this->instance=new Instance($this->API_KEY);
		$this->image=new Image($this->API_KEY);
		$this->primary_ip=new PrimaryIP($this->API_KEY);
		$this->network=new Network($this->API_KEY);
    }
	
	public function instance()
	{
		return $this->instance;
	}
	public function image()
	{
		return $this->image;
	}
	public function primary_ip()
	{
		return $this->primary_ip;
	}
		public function network()
	{
		return $this->network;
	}
}

