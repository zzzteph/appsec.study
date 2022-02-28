<?php

namespace App\Jobs\Google;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Rest\Google\Instance\GetInstance;
use App\Rest\Google\Instance\DeleteInstance;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\UserToolVm;
use App\Models\Cloud;
class ToolStop implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     *
     * @return void
     */
	 protected $uservm;
    public function __construct(UserToolVm $uservm)
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

		$cloud=Cloud::first();	
		$info=new DeleteInstance($this->uservm->instance_id,$cloud->project,Storage::path($cloud->path));
		$info->execute();
		
		$this->uservm->status="stopping";
		$this->uservm->progress=100;
		$this->uservm->save();
		while(true)
		{
				$info=new GetInstance($this->uservm->instance_id,$cloud->project,Storage::path($cloud->path));
			$response=$info->execute();	
			if($this->uservm->progress>0)
			{
				$this->uservm->progress=$this->uservm->progress-1;
				$this->uservm->save();
			}	
			
			
			if($response==FALSE)
			{
				$this->uservm->status="terminated";
				$this->uservm->save();
				return;
			}
		}
				
				
		}
    
}
