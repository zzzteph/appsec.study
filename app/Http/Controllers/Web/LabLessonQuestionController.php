<?php

namespace App\Http\Controllers\Web;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Topic;
use App\Models\Lesson;
use App\Models\LabLesson;
use App\Models\LabLessonQuestion;
use App\Models\LabLessonQuestionHint;
use App\Models\UserLesson;
use App\Models\UserLabLessonQuestion;
use App\Models\UserLabLessonQuestionHint;
use App\Models\UserTopicNode;
use App\Models\TopicNode;
use Illuminate\Support\Facades\Storage;
class LabLessonQuestionController extends Controller
{
	
	
	public function hint(Request $request,$topic_id,$node_id,$question_id,$hint_id)
	{
		$topic = Topic::where('published', true)->where('id',$topic_id)->firstOrFail();	
		$node = TopicNode::where('id',$node_id)->where('topic_id',$topic_id)->firstOrFail();

		$hasAccess=false;
		foreach($topic->user_route() as $route)
		{
			if($route->id==$node->id)$hasAccess=true;
		}
		if(!$topic->published)$hasAccess=false;
		if(Auth::user()->admin)$hasAccess=true;
		if(!$hasAccess)
		{
			return redirect()->back()->withErrors('You have no access to this lesson');
		}
		
	
		

		$lesson=$node->lesson;
		$question=LabLessonQuestion::findOrFail($question_id);

		//update lesson status
		$userNode=UserTopicNode::where('user_id',Auth::user()->id)->where('topic_node_id',$node->id)->first();
		if($userNode===null)
		{
			$userNode=new UserTopicNode;
			$userNode->topic_node_id=$node->id;
			$userNode->user_id=Auth::user()->id;
			$userNode->status='todo';
			$userNode->save();
		}

		if($userNode->status=='success' || $userNode->status=='fail')
		{
			return redirect()->back()->withErrors('You can\'t buy any hints to answered questions or failed tasks');
		}
		
		$hint = LabLessonQuestionHint::where('id',$hint_id)->firstOrFail();	
		if($hint->bought==TRUE)
		{
			return redirect()->back()->withErrors('Hint already bought');
		}
		$user=Auth::user();
		if($user->user_statistic->score<$hint->price)
		{
			return redirect()->back()->withErrors('Insufficient funds');
		}

		$user->user_statistic->score=$user->user_statistic->score-$hint->price;
		$user->user_statistic->save();
		$userHint=new UserLabLessonQuestionHint;
		$userHint->user_id=$user->id;
		$userHint->lab_lesson_question_hint_id=$hint->id;
		$userHint->user_topic_node_id=$userNode->id;
		$userHint->save();
		return redirect()->back()->with('success', 'Hint bought!');   

	}

	public function answer(Request $request,$topic_id,$node_id)
	{

	
		$validated = $request->validate([
			'question_id' => 'required',
			'answer' => 'required'
		]);


		$topic = Topic::where('published', true)->where('id',$topic_id)->firstOrFail();	
		$node = TopicNode::where('id',$node_id)->where('topic_id',$topic_id)->firstOrFail();

		$hasAccess=false;
		foreach($topic->user_route() as $route)
		{
			if($route->id==$node->id)$hasAccess=true;
		}
		if(Auth::user()->admin)$hasAccess=true;
		if(!$hasAccess)
		{
			return redirect()->back()->withErrors('You have no access to this lesson');
		}
		
	
		

		$lesson=$node->lesson;
		$question=LabLessonQuestion::findOrFail($request->input('question_id'));

		//update lesson status
		$userNode=UserTopicNode::where('user_id',Auth::user()->id)->where('topic_node_id',$node->id)->first();
		if($userNode===null)
		{
			$userNode=new UserTopicNode;
			$userNode->topic_node_id=$node->id;
			$userNode->user_id=Auth::user()->id;
			$userNode->status='todo';
			$userNode->save();
		}

		if($userNode->status=='success' || $userNode->status=='fail')
		{
			return redirect()->back()->withErrors('You can\'t answer this question at this time');
		}


		if($question->correct($userNode->id)==TRUE)
			return redirect()->route('view-lesson',['topic_id' =>$topic_id,'node_id' =>$node->node_id]);
		if($lesson->type!="lab")
			return redirect()->route('view-lesson',['topic_id' =>$topic_id,'node_id' =>$node->node_id]);
		if($lesson->id!=$question->lab_lesson->lesson->id)
			return redirect()->route('view-lesson',['topic_id' =>$topic_id,'node_id' =>$node->node_id]);
		
		foreach($lesson->lab->questions as $lab_question)
		{
			if(($question->id!=$lab_question->id) && $lab_question->correct($userNode->id)!==TRUE)
			{
				
				return redirect()->route('view-lesson',['topic_id' =>$topic_id,'node_id' =>$node->node_id]);
			}
			if(($question->id==$lab_question->id) && $lab_question->correct($userNode->id)!==TRUE)
			{
				break;
			}
		}
		//yes- any answer
		//string - check similarity 80
		//multiply and vuln
		

		$user=Auth::user();
		$userLabLessonQuestion= new UserLabLessonQuestion;
		$userLabLessonQuestion->correct=FALSE;
		$userLabLessonQuestion->lab_lesson_question_id=$question->id;
		$userLabLessonQuestion->user_topic_node_id=$userNode->id;
		$userLabLessonQuestion->answer=$request->input('answer');
		if($question->type=='yes')
		{
			$user->user_statistic->score=$user->user_statistic->score+$question->score;
			$user->user_statistic->total_score=$user->user_statistic->total_score+$question->score;
			$user->user_statistic->save();

			$userLabLessonQuestion->correct=TRUE;
		}
		if($question->type=='string')
		{
			similar_text($question->answer->answer,$request->input('answer'),$similar_answers);
			if($similar_answers>80)
			{
				$user->user_statistic->score=$user->user_statistic->score+$question->score;
				$user->user_statistic->total_score=$user->user_statistic->total_score+$question->score;
				$user->user_statistic->save();
				$userLabLessonQuestion->correct=TRUE;
			}
		}
		
		if($question->type=='repeat' || $question->type=='vuln')
		{
			foreach($question->left_answers($userNode->id) as $answer)
			{
				similar_text($answer->answer,$request->input('answer'),$similar_answers);
				if($similar_answers>90)
				{
						$user->user_statistic->score=$user->user_statistic->score+$question->score;
						$user->user_statistic->total_score=$user->user_statistic->total_score+$question->score;
						$user->user_statistic->save();
						$userLabLessonQuestion->correct=TRUE;
						break;
				}
			}
		}
		$userLabLessonQuestion->save();
		if(!$userLabLessonQuestion->correct)
		{
			return redirect()->back()->withErrors('Your answer is wrong');
		}

		
		
		

		
		
		$all_correct=true;
		foreach($lesson->lab->questions as $lab_question)
		{
			if($lab_question->correct($userNode->id)!==TRUE)
			{	
				$all_correct=false;
				break;
			}
		}	
		if($all_correct)
		{
			$userNode->status='success';
			$userNode->save();
		}
		return redirect()->back()->with('success', 'You are right!');   

	}

}
	
	
	
	
	
	

