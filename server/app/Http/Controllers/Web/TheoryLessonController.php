<?php

namespace App\Http\Controllers\Web;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Course;
use App\Models\Topic;
use App\Models\Lesson;
use App\Models\TheoryLesson;
use App\Models\LabLesson;
use App\Models\LabLessonQuestion;
use App\Models\UserTopicNode;
use Illuminate\Support\Facades\Storage;
class TheoryLessonController extends Controller
{


	public function mark_as_done($course_id,$topic_id,$lesson_id)
    {
		//check if userLesson exist
		$course=Course::where('published', true)->findOrFail($course_id);
		$topic=Topic::findOrFail($topic_id);
		$node=$topic->current_user_node();
		if($node->status!='todo' &&  $node->status!=FALSE)
		{
			return back()->withErrors([	'message' => 'You can not do anything to this lesson']);
		}
		if($node->lesson->type!='theory')
		{
			return back()->withErrors([	'message' => 'This is not theory lesson']);
		}
		
		$userTopicNode=UserTopicNode::where('user_id',Auth::user()->id)->where('topic_node_id',$node->id)->first();
		if($userTopicNode==null)
		{
			$userTopicNode=new UserTopicNode;
			$userTopicNode->topic_node_id=$node->id;
			$userTopicNode->user_id=Auth::user()->id;
			
		}
		$userTopicNode->status='success';
		$userTopicNode->save();
			return redirect()->route('view-lesson', ['course_id' => $course_id,'topic_id' => $topic_id,'node_id' => $node->node_id]);
    }





}
	
	
	
	
	
	

