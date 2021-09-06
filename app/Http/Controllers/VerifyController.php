<?php

namespace App\Http\Controllers;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use App\Models\User;


class VerifyController extends Controller
{
public function __construct()
    {
        $this->middleware('signed')->only('verify');
        $this->middleware('throttle:6,1')->only('verify', 'resend');
    }

    public function verify(Request $request)
    {   
        $user = User::find($request->route('id'));

        if ($user->hasVerifiedEmail()) {
           return redirect()->route('main');
        }

        if ($user->markEmailAsVerified()) {
          return redirect()->route('main');
        }

         return redirect()->route('main');
    }
	}
	
	
	
	
	
	

