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
use Carbon\Carbon;

class RefreshUserStatistics
{
    /**
     * Create the event listener.
     *
     * @return void
     */
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
        $user=$event->user;
		
		$user->user_statistic->lessons_done=UserTopicNode::where('user_id',$user->id)->where('status','!=','todo')->count();
		$user->user_statistic->answers=UserLabLessonQuestion::where('user_id',$user->id)->count();
		$user->user_statistic->correct_answers=UserLabLessonQuestion::where('user_id',$user->id)->where('correct',TRUE)->count();
		$user_lessons=UserTopicNode::where('user_id',$user->id)->get();
		$userLabsDoneCount=0;
		foreach($user_lessons as $user_lesson)
		{
			//we can't remove user statistics, but can supress it
			if($user_lesson->topic_node->lesson->type=='lab')
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
		//score calculating
		$score=0;
		foreach($user_lessons as $user_lesson)
		{
			if($user_lesson->topic_node->lesson->type=='theory')
				$score+=$user_lesson->topic_node->lesson->theory->score;
		}			
		//
		$correctAnswers=UserLabLessonQuestion::where('user_id',$user->id)->where('correct',TRUE)->get();
		
		foreach($correctAnswers as $answer)
		{
			$score+=$answer->lab_lesson_question->score;
		}
		
			$user->user_statistic->score=$score;
			$user->user_statistic->total_score=$score;
			$user->user_statistic->save();
    }
}
