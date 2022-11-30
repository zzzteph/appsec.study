<?php

namespace App\Http\Controllers\Web\Admin;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Vm;
use App\Models\CloudVm;

use Illuminate\Support\Facades\Storage;
use Illuminate\Http\RedirectResponse;
class VmsController extends Controller
{
	
	public function get()
    {
      return view('vms.index', [
            'vms' => Vm::orderBy('id')->paginate(15)
        ]);
    }
	
	
	public function create(Request $request)
	{
		$validated = $request->validate([
			'name' => 'required',
			'image' => 'required',
		]);

		$vm=new Vm;
		$vm->name=$request->input('name');
		$vm->image=$request->input('image');
		$vm->save();
		return back();
	}
	

	public function update(Request $request,$id)
	{
		$validated = $request->validate([
		
			'name' => 'required',
			'image' => 'required',
		]);

		$vm=Vm::findOrFail($id);
		$vm->name=$request->input('name');
		$vm->image=$request->input('image');
		$vm->save();
		return back();
	}
	

	public function delete(Request $request,$id)
	{
		$vm=Vm::findOrFail($id);
		$vm->delete();
		return back();
	}
	


}
	
	
	
	
	
	

