<?php

namespace App\Jobs\Google;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\UserCloudVm;
use Illuminate\Support\Str;
class Timeout implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     *
     * @return void
     */
	 public $timeout = 600;
	 protected $uservm;
	 private $response;

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
		$start=intval($this->uservm->progress);
		if($start<40)$start=40;
		if($start<100)
		{
			for($i=$start;$i<100;$i++)
			{
				sleep(1);
				
				$this->uservm->progress=$i;
				$this->uservm->save();
			}
		}
		else
		{
			for($i=0;$i<60;$i++)
			{
				sleep(1);
			}
		}
		$this->uservm->progress=100;
		$this->uservm->status="running";
		$this->uservm->save();		
			
			
			
			
    }

}
