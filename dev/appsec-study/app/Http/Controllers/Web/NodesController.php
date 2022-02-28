<?php

namespace App\Http\Controllers\Web;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Course;
use App\Models\Topic;
use App\Models\Lesson;
use App\Models\TopicNode;
use App\Models\TopicNodeRoute;
use App\Models\UserTopicNode;
use Illuminate\Support\Facades\Storage;
class NodesController extends Controller
{
	
	public function list($course_id,$topic_id)
    {
		$course=Course::where('published', true)->findOrFail($course_id);
		$topic=Topic::findOrFail($topic_id);

		return view('content.nodes',['course' =>$course,'topic' =>$topic,'nodes'=>$topic->user_route()]);
		
    }
	
	public function view($course_id,$topic_id,$node_id)
	{	
	
		//lesson can be published , but course and topic can be not

		$course=Course::where('published', true)->findOrFail($course_id);
		$topic = Topic::where('published', true)->findOrFail($topic_id);
		$node = TopicNode::where('topic_id', $topic_id)->where('node_id', $node_id)->first();
		$lesson=$node->lesson;
		$hasAccess=false;
		foreach($topic->user_route() as $route)
		{
			if($route->id==$node->id)$hasAccess=true;
		}
		if(!$hasAccess)
		{
			return redirect()->back()->withErrors('You have no access to this lesson');
		}
		$userTopicNode=UserTopicNode::where('user_id',Auth::user()->id)->where('topic_node_id',$node->id)->first();
		if($userTopicNode==null)
		{
			$userTopicNode=new UserTopicNode;
			$userTopicNode->topic_node_id=$node->id;
			$userTopicNode->user_id=Auth::user()->id;
			$userTopicNode->status='todo';
			$userTopicNode->save();
			
		}
		if($lesson->type=="lab")
		{
			return view('content.lesson.lab',['course' =>$course,'topic' =>$topic,'lesson' =>$lesson,'node' =>$node,'task'=>Auth::user()->current_user_lab_vm()]);
		}
		else if($lesson->type=="theory")
		{
			return view('content.lesson.theory',['course' =>$course,'topic' =>$topic,'lesson' =>$lesson,'node' =>$node]);
		}
		
	}

	
	

}
	
	
	
	
	
	

