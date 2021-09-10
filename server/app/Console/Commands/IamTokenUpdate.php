<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Rest\Yandex\Iam\IamToken;
class IamTokenUpdate extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'iamtoken:yandex';

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
		$token=new IamToken();
		$token->create();
        return 0;
    }
}
