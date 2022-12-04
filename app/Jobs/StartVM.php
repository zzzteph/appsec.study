<?php

namespace App\Jobs\Google;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Bus;
use App\Models\UserCloudVm;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use App\Jobs\Google\Start as GoogleStart;
class Start implements ShouldQueue , ShouldBeUnique
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     *
     * @return void
     */
	 public $timeout = 600;
	 
	 public $uniqueFor = 600;
 
	protected $uservm;
    public function uniqueId()
    {
        return $this->uservm->id;
    }
	 
	 
	 
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
		$cloud=env("CLOUD", FALSE);
		if($cloud=="google")
		{
				GoogleStart::dispatch($this->uservm);
		}
	
    }

}
