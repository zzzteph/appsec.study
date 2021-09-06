<?php

namespace App\Listeners;

use App\Events\UserStatisticsChange;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use App\Models\User;
use App\Models\UserStatistic;
use App\Models\UserCloudVm;
use App\Models\UserLesson;
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
		
		$user->user_statistic->lessons_done=UserLesson::where('user_id',$user->id)->where('status','done')->count();
		$user->user_statistic->answers=UserLabLessonQuestion::where('user_id',$user->id)->count();
		$user->user_statistic->correct_answers=UserLabLessonQuestion::where('user_id',$user->id)->where('correct',TRUE)->count();
		$user_lessons=UserLesson::where('user_id',$user->id)->where('status','done')->get();
		$userLabsDoneCount=0;
		foreach($user_lessons as $user_lesson)
		{
			if($user_lesson->lesson->type=='lab')
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
			if($user_lesson->lesson->type=='theory')
				$score+=$user_lesson->lesson->theory->score;
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
