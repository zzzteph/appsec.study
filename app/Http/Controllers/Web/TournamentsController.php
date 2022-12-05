<?php

namespace App\Http\Controllers\Web;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Topic;
use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;
class TournamentsController extends Controller
{
	
	
	
	public function list_archived()
    {

		if(Auth::user()->admin)
		{
			$tournaments=Topic::where('type', 'tournament')->whereDate('ends_at','<',Carbon::now())->get();
		}
		else
		{
			$tournaments=Topic::where('type', 'tournament')->where('published', true)->whereDate('ends_at','<',Carbon::now())->get();
		}

		return view('content.tournaments.list',['tournaments'=>$tournaments]);
    }


	
	
	public function list()
    {

		if(Auth::user()->admin)
		{
			$tournaments=Topic::where('type', 'tournament')->get();
		}
		else
		{
			$tournaments=Topic::where('type', 'tournament')->where('published', true)->get();
		}

		return view('content.tournaments.list',['tournaments'=>$tournaments]);
    }


	public function view($id)
    {

		if(Auth::user()->admin)
		{
			$tournament=Topic::where('type', 'tournament')->findOrFail($id);
		}
		else
		{
			$tournament=Topic::where('type', 'tournament')->where('published', true)->findOrFail($id);
		}
		
		return view('content.tournaments.view',['tournament'=>$tournament,'nodes'=>$tournament->user_route()]);
    }




}
	
	
	