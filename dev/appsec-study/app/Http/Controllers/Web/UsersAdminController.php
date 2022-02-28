<?php

namespace App\Http\Controllers\Web;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Auth\Events\Registered;
class UsersAdminController extends Controller
{
	
	public function get()
    {
      return view('admin.users.index', [
            'users' => User::orderBy('id')->paginate(15)
        ]);
    }
	
	

	public function update(Request $request,$id)
	{
		$validated = $request->validate([
		
			'name' => 'required',
			'email' => 'required'
		]);
		
		$user=User::findOrFail($id);
		$user->name=$request->input('name');
		$user->email=$request->input('email');
		$user->role=$request->input('role');
		if ($request->filled('password')) {

			$user->password=Hash::make($request->input('password'));
		}
		if($request->input('confirmed')=="on" && !$user->hasVerifiedEmail())
		{
			$user->markEmailAsVerified();
		}
		
		$user->save();
		return back();
	}
	

	public function create(Request $request)
	{
		$validated = $request->validate([
		
			'name' => 'required',
			'email' => 'required'
		]);
		if(User::where('name',  $request->input('name'))->where('email',  $request->input('email'))->exists())
			{
				return back()->withErrors(['Email is registered or name is already taken']);
			}
		$user = new User();
		$user->name = $request->input('name');
		$user->password = Hash::make(Str::random(40));
		$user->email = $request->input('email');
		$user->save();
		event(new Registered($user));		
		
		
	
		return back();
	}
	




		public function reset(Request $request,$id)
	{
		
		
		$user=User::findOrFail($id);

		  $status = Password::sendResetLink(array('email'=>$user->email));

    return $status === Password::RESET_LINK_SENT
                ? back()
                : back()->withErrors([$status]);

	}
		public function delete(Request $request,$id)
	{
		
		
		$user=User::findOrFail($id);
		if($user->id!=Auth::id())
		{
			$user->delete();
		}
return back();

	}

}
	
	
	
	
	
	

