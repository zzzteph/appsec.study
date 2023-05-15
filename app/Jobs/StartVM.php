<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Bus;
use App\Models\UserCloudVm;
use App\Models\Cloud;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use App\Jobs\Google\Start as GoogleStart;
use App\Jobs\Google\Stop as GoogleStop;
class StartVM implements ShouldQueue 
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
	public $timeout = 600;

 
	protected $uservm;

	 
    public function __construct(UserCloudVm $uservm)
    {
		 $this->onQueue('listeners');
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
		if($cloud->type=="google")
		{
				GoogleStart::dispatch($this->uservm);
		}
	
    }

}
