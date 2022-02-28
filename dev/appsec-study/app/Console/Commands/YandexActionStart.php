<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
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
class YandexActionStart extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'yandex:debug_start';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Yandex Cloud IamToken update';

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
		
	$timeout = 6000;
	$uservm=UserCloudVm::find(322);
	$cloud=Cloud::find(1);	
	$iamtoken = Iamtoken::where('cloud_id',$cloud->id)->first();
		
	//get vm size
	$image=new GetImage("fd804prvr0kpjldh8epm",$iamtoken->id);
	$response=$image->execute();
	$size=0;
	if(isset($response->minDiskSize))
	{
		$size=$response->minDiskSize;
	}
	var_dump($size);

    }
}
