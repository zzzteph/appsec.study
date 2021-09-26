<?php

namespace App\Http\Controllers\Web\Admin;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Course;
use App\Models\Topic;
use App\Models\Lesson;
use App\Models\TopicNode;
use App\Models\TopicNodeCondition;
use App\Models\TopicNodeRoute;
use Illuminate\Support\Facades\Storage;
class NodesController extends Controller
{
	
	public function get($course_id,$topic_id)
    {

		return view('admin.content.topics.nodes',['lessons'=>Lesson::all(),'course' =>Course::findOrFail($course_id),'topic' =>Topic::findOrFail($topic_id),'nodes'=>TopicNode::where('topic_id', $topic_id)->get()]);
    }
	
	public function update(Request $request,$course_id,$topic_id)
    {
		
		$course=Course::findOrFail($course_id);
		$topic=Topic::findOrFail($topic_id);
		if (!$request->filled('nodes') || !$request->filled('routes')) 
		 return back()->withErrors([
            'message' => 'You must set nodes and routes!',
        ]);
		
		$nodes=json_decode($request->input('nodes'));
		$routes=json_decode($request->input('routes'));
		//todo-refactor for normal loops
		
		
		//check if all nodes exist
		foreach($nodes as $node)
		{
			if(Lesson::where('id', $node->lesson)->count() == 0)
			{
				return back()->withErrors([
				'message' => 'Can find a valid lesson!']);
			}
		}
		
		
		//check if there is no such route from
		foreach($routes as $route)
		{		
			$founded=false;	
			foreach($nodes as $node)
			{
				if($route->to==$node->id)$founded=true;
			}
			if(!$founded)
			{
				 return back()->withErrors([
            'message' => 'Route not found (to)']);
			}
		}
		
		//check if there is no such route from
		foreach($routes as $route)
		{		
			$founded=false;	
			foreach($nodes as $node)
			{
				if($route->from==$node->id)$founded=true;
			}
			if(!$founded)
			{
				 return back()->withErrors([
            'message' => 'Route not found (from)']);
			}
		}
		//check empty nodes
		foreach($nodes as $node)
		{		
			$founded=false;	
			foreach($routes as $route)
			{
				if($route->from==$node->id || $route->to==$node->id)$founded=true;
			}
			if(!$founded)
			{
				 return back()->withErrors([
				'message' => 'Node has no routes']);
			}
		}
		
		//todo refactor not to touch 
		TopicNode::where('topic_id',$topic_id)->delete();
	
		foreach($nodes as $node)
		{		
			$topicNode=new TopicNode;
			$topicNode->topic_id=$topic_id;
			$topicNode->lesson_id=$node->lesson;
			$topicNode->node_id=$node->id;
			$topicNode->save();
			
			if(isset($node->timeout))
			{
				$topicNodeCondition=new TopicNodeCondition;
				$topicNodeCondition->topic_node_id=$topicNode->id;
				$topicNodeCondition->type='timeout';
				$topicNodeCondition->value=intval($node->timeout);
				$topicNodeCondition->save();
			}
		}

		foreach($routes as $route)
		{
			$topicNodeFrom=TopicNode::where('topic_id',$topic_id)->where('node_id',$route->from)->first();
			$topicNodeTo=TopicNode::where('topic_id',$topic_id)->where('node_id',$route->to)->first();
			$topicRoute=new TopicNodeRoute;
			$topicRoute->from_id=$topicNodeFrom->id;
			$topicRoute->to_id=$topicNodeTo->id;
			$topicRoute->condition=$route->condition;
			$topicRoute->save();
		}
	
	return redirect()->route('admin-nodes', ['course_id' => $course_id,'topic_id' => $topic_id]);
	
	
	
    }
	
	
	

}
	
	
	
	
	
	

