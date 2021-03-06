<?php

namespace App\Jobs\Yandex;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Bus;
use App\Rest\Yandex\Operation\GetOperation;
use App\Rest\Yandex\Instance\GetInstance;
use App\Rest\Yandex\Instance\CreateInstance;
use App\Rest\Yandex\Instance\DeleteInstance;
use App\Rest\Yandex\Image\Get as GetImage;
use App\Models\User;
use App\Models\UserCloudVm;
use App\Models\Cloud;
use App\Models\Vm;
use App\Models\Iamtoken;
use Illuminate\Support\Str;
use App\Models\UserCloudVmLog;
use App\Jobs\Yandex\ActionStop;
class ActionStart implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     *
     * @return void
     */
	 public $timeout = 6000;
	 protected $uservm;
	 protected $cloud;
	 private $response;
    public function __construct(UserCloudVm $uservm,Cloud $cloud)
    {
         $this->uservm=$uservm;
		 $this->cloud=$cloud;
    }


    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
		
			$iamtoken = Iamtoken::where('cloud_id',$this->cloud->id)->first();
		
			$name="id-".$this->uservm->id."-template-".$this->uservm->template_id."-user-".$this->uservm->user_id."-".strtolower(Str::random(5));		
			//get vm size
			$image=new GetImage($this->uservm->template_id,$iamtoken->id);
			$response=$image->execute();
			$size=0;
			if(isset($response->minDiskSize))
			{
				$size=$response->minDiskSize;
			}
			if($size==0)
			{
				$this->uservm->status="tostop";
				$this->uservm->save();
				ActionStop::dispatch($this->uservm)->onQueue('yandex');
				
				
				return;
			}
			$info=new CreateInstance($this->cloud->folder_id,$name,$size,$this->uservm->template_id,$this->cloud->subnet_id,$this->cloud->zone_id,$this->cloud->platform_id,$iamtoken->id);//4294967296
		
			$response=$info->execute();
			$this->response=$response;

			if(is_array($response))
			{
				
				$instanceId=$response['instanceId'];
				$this->uservm->status="starting";
				$this->uservm->instance_id=$instanceId;
				$this->uservm->progress=5;
				$this->uservm->save();
				$operationId=$response['operationId'];
				
				while(true)
				{
					$info=new GetInstance($instanceId,$iamtoken->id);
					$response=$info->execute();		
					if($this->uservm->progress<100)
					{
						$this->uservm->progress=$this->uservm->progress+1;
						$this->uservm->save();	
					}					
					if(isset($response->{'networkInterfaces'}[0]->{'primaryV4Address'}->{'oneToOneNat'}->{'address'}))
					{							
						$this->uservm->ip=$response->{'networkInterfaces'}[0]->{'primaryV4Address'}->{'oneToOneNat'}->{'address'};
						$this->uservm->save();
						if($this->uservm->progress<100)
						{
							$this->uservm->progress=$this->uservm->progress+1;
							$this->uservm->save();
						}
						break;
					}

				}


						
				while(true)
				{	
					$operation=new GetOperation($operationId,$iamtoken->id);
					$response=$operation->execute();
					if($this->uservm->progress<100)
					{
						$this->uservm->progress=$this->uservm->progress+1;
						$this->uservm->save();
					}
					if($response==true)
					{
						Bus::chain([new Timeout( $this->uservm, $this->cloud)])->onQueue('timeout')->dispatch($this->uservm,$this->cloud);
						
						return;
					}
				}


			}
			ActionStop::dispatch($this->uservm)->onQueue('yandex');
			
			
			

			
			
			
			
    }

}
