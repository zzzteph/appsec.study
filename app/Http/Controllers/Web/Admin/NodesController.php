<?php

namespace App\Http\Controllers\Web\Admin;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Topic;
use App\Models\Lesson;
use App\Models\TopicNode;
use App\Models\TopicNodeCondition;
use App\Models\TopicNodeRoute;
use Illuminate\Support\Facades\Storage;
class NodesController extends Controller
{
	
	public function get($topic_id)
    {

		$topic=Topic::findOrFail($topic_id);

		if($topic->structure=='linear')
			return view('admin.content.topics.structure.linear',['lessons'=>Lesson::all(),'topic' =>Topic::findOrFail($topic_id),'nodes'=>TopicNode::where('topic_id', $topic_id)->get()]);

		if($topic->structure=='graph')
			return view('admin.content.topics.structure.graph',['lessons'=>Lesson::all(),'topic' =>Topic::findOrFail($topic_id),'nodes'=>TopicNode::where('topic_id', $topic_id)->get()]);
    }
	
	public function update(Request $request,$topic_id)
    {
		
		$topic=Topic::findOrFail($topic_id);
		

		if($topic->structure=='linear' || $topic->structure=='hidden')
		{
			$request->validate([
				'lessons' => 'required'
			]);
			return $this->update_linear($request,$topic);
		}
		
		
		
		
		if($topic->structure=='graph')
		{
			$request->validate([
				'nodes' => 'required',
				'routes' => 'required'
			]);
			return $this->update_graph($request,$topic);
		}
		return back();
    }
	
	
	function update_linear($request,$topic)
	{
		
		TopicNode::where('topic_id',$topic->id)->delete();
		$nodes=array();
		foreach($request->input('lessons') as $entry)
		{
			$lesson=Lesson::where('id',$entry)->first();
			if($lesson==null)continue;
			$topicNode=new TopicNode;
			$topicNode->topic_id=$topic->id;
			$topicNode->lesson_id=$lesson->id;
			$topicNode->node_id=0;
			$topicNode->save();
			array_push($nodes,$topicNode->id);
		}
		
			for($i=0;$i<count($nodes)-1;$i++)
			{
				$topicRoute=new TopicNodeRoute;
				$topicRoute->from_id=$nodes[$i];
				$topicRoute->to_id=$nodes[$i+1];
				$topicRoute->condition='none';
				$topicRoute->save();
			}

		
		
	return redirect()->route('admin-nodes', ['topic_id' => $topic->id]);
		
		
		
	}
	
	
	function update_graph($request,$topic)
	{
		
		
		//todo JSON
		$nodes=array();
		$routes=array();
		
		$nodesEntries=explode(PHP_EOL,$request->input('nodes'));
		foreach($nodesEntries	as $nodeEntry)
		{
			$nodeEntry=explode(',',$nodeEntry);
			if(count($nodeEntry)==4)
			{
				array_push($nodes,(object)(array('id'=>$nodeEntry[0],'lesson'=>$nodeEntry[1],'timeout'=>intval($nodeEntry[3]))));
			}
			else if(count($nodeEntry)!=4 && isset($nodeEntry[0]) && isset($nodeEntry[1]))
			{
				array_push($nodes,(object)(array('id'=>$nodeEntry[0],'lesson'=>$nodeEntry[1])));
			}				
		}
		
		
		$routesEntries=explode(PHP_EOL,$request->input('routes'));
		foreach($routesEntries	as $routeEntry)
		{
			$routeEntry= preg_split('/(->|,)/',$routeEntry);
			if(count($routeEntry)==3 && !empty($routeEntry[0]) && !empty($routeEntry[1])&& !empty($routeEntry[2]) )
			{
				array_push($routes,(object)(array('from'=>$routeEntry[0],'to'=>$routeEntry[1],'condition'=>trim($routeEntry[2]))));
			}
			else if(!empty($routeEntry[0]) && !empty($routeEntry[1]))
			{
				array_push($routes,(object)(array('from'=>$routeEntry[0],'to'=>$routeEntry[1],'condition'=>'none')));
			}				
		}

		
		
		
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
		return redirect()->route('admin-nodes', ['topic_id' => $topic->id]);
	}
	
	

}
	
	
	
	
	
	

