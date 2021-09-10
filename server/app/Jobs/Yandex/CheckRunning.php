<?php

namespace App\Jobs\Yandex;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Bus;
use App\Rest\Yandex\Instance\GetInstance;
use App\Rest\Yandex\Instance\CreateInstance;
use App\Rest\Yandex\Instance\DeleteInstance;
use App\Models\User;
use App\Models\UserCloudVm;
use App\Models\Cloud;
use App\Models\Iamtoken;
use Illuminate\Support\Str;
class CheckRunning implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     *
     * @return void
     */
	 protected $uservm;
	 protected $cloud;
	  protected $from;
	  protected $to;
	  
	 private $response;
    public function __construct(UserCloudVm $uservm,Cloud $cloud,$from,$to)
    {
         $this->uservm=$uservm;
		 $this->cloud=$cloud;
		 $this->from=$from;
		 $this->to=$to;
		 
    }


    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
		
		$iamtoken = Iamtoken::where('cloud_id',$this->cloud->id)->first();
		$this->uservm->progress=$this->from;
		$this->uservm->save();
		for($i=$this->from;$i<$this->to;$i++)
		{
			$info=new GetInstance($this->uservm->instance_id,$iamtoken->id);
			$response=$info->execute();		
			$this->uservm->progress=$i;
			$this->uservm->save();		
			if($response->{'status'}=="RUNNING")
			{					
				return;	
			}					
		}
		$this->uservm->progress=$this->to;
		$this->uservm->save();

			
			
			
			
    }

}
