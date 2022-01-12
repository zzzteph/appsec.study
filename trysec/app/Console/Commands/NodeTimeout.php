<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Topic;
use App\Models\Lesson;
use App\Models\TopicNode;
use App\Models\TopicNodeRoute;
use App\Models\UserTopicNode;
use Carbon\Carbon;
class NodeTimeout extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'nodes:timeout';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Timeout scheduler for nodes';

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
		$timeoutNodes=UserTopicNode::where('status','todo')->get();
		foreach($timeoutNodes as $node)
		{
			if($node->topic_node->topic_node_condition!=null)
			{ 
				if($node->updated_at->diffInMinutes(Carbon::now())>intval($node->topic_node->topic_node_condition->value))
				{
					$node->status='fail';
					$node->save();
				}
			}
		}
		
        return 0;
    }
}
