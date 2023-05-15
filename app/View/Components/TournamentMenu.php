<?php

namespace App\View\Components;

use Illuminate\View\Component;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Topic;
use App\Models\Lesson;
use App\Models\TopicNode;
use App\Models\TopicNodeRoute;
use App\Models\UserTopicNode;
class TournamentMenu extends Component
{
    /**
     * Create a new component instance.
     *
     * @return void
     */
    public function __construct()
    {
        //
    }

    /**
     * Get the view / contents that represent the component.
     *
     * @return \Illuminate\Contracts\View\View|\Closure|string
     */
    public function render()
    {
		$tournaments=Topic::where('type','tournament')->where('published',TRUE)->get();
        return view('components.tournament-menu',['tournaments'=>$tournaments]);
    }
}
