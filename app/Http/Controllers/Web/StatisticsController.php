<?php

namespace App\Http\Controllers\Web;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\UserStatistic;
use Illuminate\Support\Facades\Storage;
class StatisticsController extends Controller
{
	
	
	public function rating()
    {
      return view('rating', [
            'users' => UserStatistic::orderBy('total_score','DESC')->orderBy('labs_time_spend','ASC')->paginate(20)
        ]);

	
    }
	
	
}
	
	
	
	
	
	

