<?php

namespace App\Http\Controllers\Web\Admin;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Cloud;
use App\Models\ToolVm;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Bus;
class ToolsController extends Controller
{
	
	
	public function get()
    {

			return view('admin.cloud.tools.index',['toolvm' =>ToolVm::first()]);

	
    }

	
	
	public function create(Request $request)
	{
		
		$validated = $request->validate([
			'name' => 'required',
		]);

		$cloud=Cloud::first();
		if($cloud==null)
		return back()->withErrors(['Cloud not set!']);
		$vm=new ToolVm;
		$vm->name=$request->input('name');
		$vm->cloud_id=$cloud->id;
		$vm->save();
		return back();

	}
	
	
	
		public function update(Request $request)
	{
		$validated = $request->validate([
			'name' => 'required',
		]);

		$cloud=Cloud::first();
		if($cloud==null)
		return back()->withErrors(['Cloud not set!']);
		$vm=ToolVm::first();
		$vm->name=$request->input('name');
		$vm->save();
		return back();

	}


	
	
	public function delete(Request $request)
	{		

		ToolVm::first()->delete();
		return back();
	}





}
	