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
			if($currentNode->getRoute('fail')==FALSE)return $userNodes;
			$currentNode=$currentNode->getRoute('fail');
		}
		if($currentNode->status=="success")
		{
			if($currentNode->getRoute("success")==FALSE)return $userNodes;
			$currentNode=$currentNode->getRoute("success");
		}
		
	}
	return $userNodes;

	}

	public function getIsDoneAttribute()
	{
	//	 foreach($this->lessons as $lesson)
	//  {
	//	  if(!$lesson->is_done && $lesson->published==TRUE)return FALSE;
	//  }
	  return true;
	}
	
    protected static function booted()
    {
        static::created(function ($entry) {
            $entry->order = Topic::where('course_id',$entry->course_id)->max('order')+1;
			$entry->save();
        });
    }

	
}
