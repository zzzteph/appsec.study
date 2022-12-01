<?php

namespace App\View\Components;

use Illuminate\View\Component;
use Auth;
use Carbon\Carbon;
use App\Models\User;
use App\Models\Topic;
use App\Models\TopicLeaderboard as MTL;

class TopicLeaderboard extends Component
{

	public $topic;
	public $limit;
    public function __construct($topic,$limit,$paginate=FALSE)
    {
        $this->topic = $topic;
        $this->limit = $limit;
		$this->paginate = $paginate;
    }

    /**
     * Get the view / contents that represent the component.
     *
     * @return \Illuminate\Contracts\View\View|\Closure|string
     */
    public function render()
    {
	
        return view('components.topic-leaderboard',[
		'entries'=>MTL::where('topic_id',$this->topic->id)->orderBy('score','DESC')->orderBy('timespend','ASC')->paginate($this->limit),
		'paginate'=>$this->paginate
		
		
		]);
    }
}
