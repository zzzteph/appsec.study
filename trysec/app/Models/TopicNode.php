<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Auth;
class TopicNode extends Model
{
    use HasFactory;
	public function topic_node_from()
    {
        return $this->hasMany(TopicNodeRoute::class,'from_id','id');
    }
	public function topic_node_to()
    {
        return $this->hasMany(TopicNodeRoute::class,'to_id','id');
    }

	public function topic_node_condition()
    {
        return $this->hasOne(TopicNodeCondition::class);
    }


	public function getRoute($type)
    {
       $route=TopicNodeRoute::where('from_id',$this->id)->where('condition',$type)->first();
	   if($route==null)return FALSE;
	   
	   return $route->to_node;
	    
	   
    }

	public function topic()
    {
		return $this->belongsTo(Topic::class);
    }

	public function user_topic_node()
	{
		return $this->hasOne(UserTopicNode::class)->where('user_id',Auth::user()->id);
	}

	public function lesson()
    {
		return $this->belongsTo(Lesson::class);
    }


	public function getStatusAttribute()
    {
		$userNode=$this->hasOne(UserTopicNode::class)->where('user_id',Auth::user()->id)->first();
		if($userNode!=null)
			return $userNode->status;
		return FALSE;
    }



	





}
