<?php

namespace App\Http\Controllers\Web;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Course;
use App\Models\Topic;
use App\Models\Lesson;
use App\Models\LabLesson;
use App\Models\LabLessonQuestion;
use App\Models\UserLesson;
use App\Models\UserLabLessonQuestion;
use App\Models\UserTopicNode;
use App\Models\TopicNode;
use Illuminate\Support\Facades\Storage;
class LabLessonQuestionController extends Controller
{

	public function answer(Request $request,$course_id,$topic_id,$node_id)
	{

	
		$validated = $request->validate([
			'question_id' => 'required',
			'answer' => 'required'
		]);

		$course=Course::where('published', true)->findOrFail($course_id);
		$topic = Topic::where('id',$topic_id)->firstOrFail();	
		$node = TopicNode::where('node_id',$node_id)->where('topic_id',$topic_id)->firstOrFail();

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
			return redirect()->route('view-lesson',['course_id' =>$course_id,'topic_id' =>$topic_id,'node_id' =>$node->node_id]);
		if($lesson->type!="lab")
			return redirect()->route('view-lesson',['course_id' =>$course_id,'topic_id' =>$topic_id,'node_id' =>$node->node_id]);
		if($lesson->id!=$question->lab_lesson->lesson->id)
			return redirect()->route('view-lesson',['course_id' =>$course_id,'topic_id' =>$topic_id,'node_id' =>$node->node_id]);
		
		foreach($lesson->lab->questions as $lab_question)
		{
			if(($question->id!=$lab_question->id) && $lab_question->correct($userNode->id)!==TRUE)
			{
				
				return redirect()->route('view-lesson',['course_id' =>$course_id,'topic_id' =>$topic_id,'node_id' =>$node->node_id]);
			}
			if(($question->id==$lab_question->id) && $lab_question->correct($userNode->id)!==TRUE)
			{
				break;
			}
		}
		//yes- any answer
		//string - check similarity 80
		//multiply and vuln
		

		
		$userLabLessonQuestion= new UserLabLessonQuestion;
		$userLabLessonQuestion->correct=FALSE;
		$userLabLessonQuestion->lab_lesson_question_id=$question->id;
		$userLabLessonQuestion->user_topic_node_id=$userNode->id;
		$userLabLessonQuestion->answer=$request->input('answer');
		if($question->type=='yes')
			$userLabLessonQuestion->correct=TRUE;
	
		if($question->type=='string')
		{
			similar_text($question->answer->answer,$request->input('answer'),$similar_answers);
			if($similar_answers>80)
			{
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
	
	
	
	
	
	

