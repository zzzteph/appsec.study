<?php

namespace App\Http\Controllers\Web;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Topic;
use Illuminate\Support\Facades\Storage;
class TournamentsController extends Controller
{
	
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

		return view('content.tournaments',['tournaments'=>$tournaments]);
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
	
	
	