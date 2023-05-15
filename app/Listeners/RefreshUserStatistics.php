<?php

namespace App\Listeners;

use App\Events\UserStatisticsChange;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use App\Models\User;
use App\Models\UserStatistic;
use App\Models\UserCloudVm;
use App\Models\UserTopicNode;
use App\Models\UserLabLessonQuestion;
use App\Models\UserLabLessonQuestionHint;
use App\Models\TopicLeaderboard;
use Carbon\Carbon;

class RefreshUserStatistics  implements ShouldQueue
{
    /**
     * Create the event listener.
     *
     * @return void
     */
	public $queue = 'listeners';

    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     *
     * @param  UserStatisticsChange  $event
     * @return void
     */
    public function handle(UserStatisticsChange $event)
    {
        $user_topic=$event->node;
		$user=$user_topic->user;
		$user_topics=UserTopicNode::where('user_id',$user->id)->get();
		$user->user_statistic->lessons_done=UserTopicNode::where('user_id',$user->id)->where('status','!=','todo')->count();
		$user->user_statistic->answers=0;
		$user->user_statistic->correct_answers=0;
		$userLabsDoneCount=0;
		foreach($user_topics as $user_topic)
		{
			$user->user_statistic->answers+=$user_topic->questions_count;
			$user->user_statistic->correct_answers+=$user_topic->questions_correct_count;
			if($user_topic->topic_node->lesson->type=='lab')
				$userLabsDoneCount++;
		}
		$user->user_statistic->labs_done=$userLabsDoneCount;
		$userCloudVMS=UserCloudVm::where('user_id',$user->id)->get();
		$userTimeSpend=0;
		foreach($userCloudVMS as $vm)
		{
			$userTimeSpend+=$vm->updated_at->diffInSeconds($vm->created_at);
		}
		$user->user_statistic->labs_time_spend=$userTimeSpend;
		$user->user_statistic->save();
		
		//updating topic leaderboards
		
		
		$topic= $user_topic->topic_node->topic;
		$topic_leaderboard=TopicLeaderboard::where('topic_id',$topic->id)->where('user_id',$user->id)->first();
		$topic_score=0;
		if($topic_leaderboard==null)
		{
			$topic_leaderboard=new TopicLeaderboard;
		}
		$timespend=0;
		foreach($topic->topic_nodes as $topic_node)
		{
			//it's job task, so we can't use user_topic_node function, cause it uses Auth facade
			$user_topic_node=UserTopicNode::where('user_id',$user->id)->where('topic_node_id',$topic_node->id)->first();
			if($user_topic_node==null)continue;
			foreach($user_topic_node->user_lab_lesson_questions as $user_question)
			{
				if($user_question->correct)
				{
					$topic_score+=$user_question->lab_lesson_question->score;
				}
			}
			$user_vms=UserCloudVm::where('user_id',$user->id)->where('topic_node_id',$topic_node->id)->get();
			foreach($user_vms as $user_vm)
			{
				$timespend+=$user_vm->updated_at->diffInSeconds($user_vm->created_at);
			}
		}
		$topic_leaderboard->user_id=$user->id;
		$topic_leaderboard->topic_id=$topic->id;
		$topic_leaderboard->score=$topic_score;
		$topic_leaderboard->timespend=$timespend;
		$topic_leaderboard->save();
		
		
    }
}
