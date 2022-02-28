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
		
		$user->save();
		return back();
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
	
	
	
	
	
	

