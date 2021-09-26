<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;
class TopicNodeCondition extends Model
{
    use HasFactory;
	
	
	public function topic_node()
    {
		return $this->belongsTo(TopicNode::class);
    }
	
	public function getTimeLeftAttribute()
	{
		if($this->type!='timeout')return 0;
		$node=$this->topic_node;
		if($node->user_topic_node!=null)
		{
			return (intval($this->value)-intval($node->user_topic_node->updated_at->diffInMinutes(Carbon::now())));
		}
		return intval($this->value);
	}
	
		public function getTimeLeftProgressAttribute()
	{
		if($this->type!='timeout')return 0;
		$node=$this->topic_node;
		if($node->user_topic_node!=null)
		{
			
			return round((((intval($this->value)-intval($node->user_topic_node->updated_at->diffInMinutes(Carbon::now()))))/intval($this->value))*100);
		}
		return intval($this->value);
	}
}
