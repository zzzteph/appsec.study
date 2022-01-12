<?php

namespace App\Http\Controllers;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Laravel\Socialite\Facades\Socialite;
class AuthController extends Controller
{
	
	public function social_login(Request $request,$driver)
    {
           $socialUser = Socialite::driver($driver)->user();
			$user = User::where('email', $socialUser->getEmail())->first();
			if(is_null($user)){	
				$user = new User;
				$emailPart = explode("@", $socialUser->getEmail());
				$user->name = $emailPart[0].Str::random(5);
				$user->email = $socialUser->getEmail();
				$user->password=Hash::make(Str::random(40));
				$user->save();				
			}	
			$user->markEmailAsVerified();
			Auth::loginUsingId($user->id);
			$request->session()->regenerate();
			return redirect('/');
    }
	
	
	
  	public function logout(Request $request)
	{
		Auth::logout();
		$request->session()->invalidate();
		$request->session()->regenerateToken();
		return redirect('/');
	}
	

	
	

		
		
		

		
	}
	
	
	
	
	
	

