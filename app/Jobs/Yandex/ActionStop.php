<?php

namespace App\Jobs\Yandex;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Rest\Yandex\Instance\GetInstance;
use App\Rest\Yandex\Instance\DeleteInstance;

use Illuminate\Support\Str;
use App\Models\UserCloudVm;
use App\Models\Cloud;
use App\Models\Iamtoken;
class ActionStop implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     *
     * @return void
     */
	 protected $uservm;
    public function __construct(UserCloudVm $uservm)
    {
         $this->uservm=$uservm;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {

		$iamtoken = Iamtoken::where('cloud_id',$this->uservm->cloud_id)->first();
		$info=new DeleteInstance($this->uservm->instance_id,$iamtoken->id);
		$info->execute();
		$this->uservm->status="stopping";
		$this->uservm->progress=100;
		$this->uservm->save();
		while(true)
		{
			$info=new GetInstance($this->uservm->instance_id,$iamtoken->id);
			$response=$info->execute();	
			if($this->uservm->progress>0)
			{
				$this->uservm->progress=$this->uservm->progress-1;
				$this->uservm->save();
			}	
			
			
			if(is_null($response))
			{
				$this->uservm->status="terminated";
				$this->uservm->save();
				return;
			}
		}
				
				
		}
    
}
