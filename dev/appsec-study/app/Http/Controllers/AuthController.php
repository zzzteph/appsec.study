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
	
	public function authentificate(Request $request)
	{

        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);
        if (Auth::attempt($credentials)) {
			$request->session()->regenerate();
		  if (!Auth::user()->hasVerifiedEmail()) {
           
		   return redirect()->intended('/email/verify');
		   
        }

			
           
            return redirect()->intended('/');
			
        }
        return back()->withErrors([
            'message' => 'The provided credentials do not match our records.',
        ]);
	}
	
	
	public function register(Request $request)
	{
		  $validated = $request->validate([
				'name' => 'required|max:255',
				'password' => 'required',
				'email' => 'required|email|max:255'
			]);

			
			if(User::where('name',  $request->input('name'))->where('email',  $request->input('email'))->exists())
			{
				return back()->withErrors([
						'message' => 'Email is registered or name is already taken',
					]);
			}
				$user = new User();
				$user->name = $request->input('name');
				$user->password = Hash::make($request->input('password'));
				$user->email = $request->input('email');
				$user->save();
				event(new Registered($user));			
			return redirect()->intended('/');
			
			
		}
		
		
		

		
	}
	
	
	
	
	
	

