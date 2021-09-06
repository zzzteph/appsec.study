<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\UserCloudVm;
use App\Jobs\Yandex\ActionStop;
use Carbon\Carbon;

class ScheduleStop extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'uservm:stop';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Stops running user VMS';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
		$runningLabs=UserCloudVm::where('status','!=','terminated')->get();
		foreach($runningLabs as $user_vm)
		{
			
			if(
			   ($user_vm->status=='running' && $user_vm->updated_at->diffInSeconds(Carbon::now())>3600) || 
			   ($user_vm->status!='running' && $user_vm->updated_at->diffInSeconds(Carbon::now())>1200)
			   )
				
			{
				$user_vm->status="tostop";
				$user_vm->progress=100;
				$user_vm->save();
				//TODO another type of cloud
				ActionStop::dispatch($user_vm)->onQueue('yandex');
			}

		}
		
	
		
		

    }
}
