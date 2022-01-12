<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TopicNodeRoute extends Model
{
    use HasFactory;
	
	    public function from_node()
    {
        return $this->belongsTo(TopicNode::class,'from_id','id');
    }
	
	    public function to_node()
    {
        return $this->belongsTo(TopicNode::class,'to_id','id');
    }
	
}
