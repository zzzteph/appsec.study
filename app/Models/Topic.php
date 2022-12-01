<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Auth;
use Carbon\Carbon;
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
		
		if($this->structure=='graph')return $this->graph_route();
		if($this->structure=='linear')return $this->linear_route();

	}
	
	
	function linear_route()
	{
		$userNodes=collect();
		foreach($this->topic_nodes as $node)
		{
			$userNodes->push($node);
		}
		return $userNodes;


		
	}
	
	
	
	function graph_route()
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
            $entry->order = Topic::max('order')+1;
			$entry->save();
        });
    }

	public function getIsTournamentPlannedAttribute()
	{
		if($this->type!=='tournament')return FALSE;
		if(Carbon::now()->diffInDays($this->start_at)>0 && $this->published==true)
		{
				return TRUE;
		}
		return FALSE;
	}


	public function getIsTournamentStartedAttribute()
	{
		if($this->type!=='tournament')return FALSE;
		if(Carbon::now()->diffInDays($this->start_at)<=0 && $this->published==true && Carbon::now()->diffInDays($this->ends_at)>=0)
		{
				return TRUE;
		}
		return FALSE;
	}
		public function getIsTournamentArchivedAttribute()
	{
		if($this->type!=='tournament')return FALSE;
		if(Carbon::now()->diffInDays($this->start_at)<=0 && $this->published==true && Carbon::now()->diffInDays($this->ends_at)<=0)
		{
				return TRUE;
		}
		return FALSE;
	}
	
	public function getLeaderboardAttribute()
	{
		
	}
	
	
	
	public function getEndsInTimeAttribute()
	{
		if(Carbon::now()->diffInDays($this->ends_at)>0)return (Carbon::now()->diffInDays($this->ends_at))." days";
		if(Carbon::now()->diffInHours($this->ends_at)>0)return (Carbon::now()->diffInHours($this->ends_at))." hours";
		if(Carbon::now()->diffInMinutes($this->ends_at)>0)return (Carbon::now()->diffInMinutes($this->ends_at))." minutes";
		return 0;
	}
	
	
	
}
