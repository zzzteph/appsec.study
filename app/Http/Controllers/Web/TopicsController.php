<?php

namespace App\Http\Controllers\Web;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Topic;
use Illuminate\Support\Facades\Storage;
class TopicsController extends Controller
{
	
	public function list()
    {

		if(Auth::user()->admin)
		{
			$topics=Topic::orderBy('order', 'asc')->get();
		}
		else
		{
			$topics=Topic::where('published', true)->orderBy('order', 'asc')->get();
		}

		return view('content.topics',['topics'=>$topics]);
    }

}
	
	
	
	
	
	

