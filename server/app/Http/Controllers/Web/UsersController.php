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
class UsersController extends Controller
{
	
	public function get($id)
    {
      return view('user.index', ['user' => User::findOrFail($id)]);
    }
	
	public function edit($id)
    {

		if(Auth::id()!=$id)
			return back();
		return view('user.edit', ['user' => User::findOrFail(Auth::id())]);
    }
	

	public function update(Request $request,$id)
	{
		
		if(Auth::id()!=$id)
			return back();
		$validated = $request->validate([
			'name' => 'required',
			'avatar' => 'image|dimensions:min_width=128,min_height=128|file|max:2000'
		]);
		
		$user=User::findOrFail(Auth::id());
		$user->name=$request->input('name');
		
			if($request->hasFile('avatar'))
		{
			$path = $request->file('avatar')->store('public/users/avatar/'.Auth::id());
			$user->avatar=Storage::url($path);
		}

		$user->save();
		return redirect()->route('user-page',['id'=>Auth::id()]);
	}


}
	
	
	
	
	
	

