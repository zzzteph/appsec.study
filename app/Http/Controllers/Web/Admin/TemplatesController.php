<?php

namespace App\Http\Controllers\Web\Admin;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Template;
use App\Models\CloudVm;

use Illuminate\Support\Facades\Storage;
use Illuminate\Http\RedirectResponse;
class TemplatesController extends Controller
{
	
	public function list()
    {
      return view('admin.templates.list', [
            'templates' => Template::orderBy('id')->paginate(15)
        ]);
    }
	
	
	public function new()
	{
		return view('admin.templates.new');
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
	
	
	
	
	
	

