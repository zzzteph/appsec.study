<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Auth;
class Topic extends Model
{
    use HasFactory;
    public function course()
    {
        return $this->belongsTo(Course::class);
    }
	public function topic_nodes()
    {
        return $this->hasMany(TopicNode::class);
    }
	public function topic_routes()
    {
		$routes=collect();
        foreach($this->topic_nodes as $node)
		{
			foreach($node->topic_node_from as $route)
			{
				$routes->push($route);
			}
		}
		return $routes;
    }


	
	
	public function current_user_node()
	{
		if($this->user_route()==FALSE)return FALSE;
		return $this->user_route()->last();
	}
	


	public function user_route()
	{
		$userNodes=collect();
		$currentNode=FALSE;
		foreach($this->topic_nodes as $node)
		{
			if($node->topic_node_to->count()==0 && $node->topic_node_from->count()!=0)
			{
				$currentNode=$node;
			}
		}
	if(	$currentNode==FALSE) return FALSE;

	while(true)
	{
		$userNodes->push($currentNode);
		if($currentNode->status=='todo' || $currentNode->status==FALSE)
		{
			return $userNodes;
		}
		//check if user on last node

		
		if($currentNode->status=="fail")
		{
			if($currentNode->getRoute('fail')==FALSE)
			{
				if($currentNode->getRoute('none')==FALSE)
					return $userNodes;
				$currentNode=$currentNode->getRoute('none');
			}
			else
			{
				$currentNode=$currentNode->getRoute('fail');
			}
		}
		else if($currentNode->status=="success")
		{
			if($currentNode->getRoute('success')==FALSE)
			{
				if($currentNode->getRoute('none')==FALSE)
					return $userNodes;
				$currentNode=$currentNode->getRoute('none');
			}
			else
			{
				$currentNode=$currentNode->getRoute('success');
			}
		}
		
	}

	return $userNodes;

	}

	public function getIsDoneAttribute()
	{
		$currentNode=$this->current_user_node();
		if($currentNode==FALSE)return FALSE;
		if($currentNode->status=='success' || $currentNode->status=='fail')return TRUE;
		return false;
	}
	
	public function getTheoryLessonDoneCountAttribute()
	{
		$userNodes=$this->user_route();
		if($userNodes==FALSE)return 0;
		$count=0;
		foreach($userNodes as $node)
		{
			if($node->status=='success' || $node->status=='fail' )
			{
				if($node->lesson->type=='theory')$count++;
			}
		}
		return $count;
	}

		public function getLabLessonDoneCountAttribute()
	{
		$userNodes=$this->user_route();
		if($userNodes==FALSE)return 0;
		$count=0;
		foreach($userNodes as $node)
		{
			if($node->status=='success' || $node->status=='fail' )
			{
				if($node->lesson->type=='lab')$count++;
			}
		}
		return $count;
	}

	
    protected static function booted()
    {
        static::created(function ($entry) {
            $entry->order = Topic::where('course_id',$entry->course_id)->max('order')+1;
			$entry->save();
        });
    }

	
}
